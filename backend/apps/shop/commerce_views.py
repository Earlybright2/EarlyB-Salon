"""Commerce APIs: bookings, cart, wishlist, orders/checkout, reviews, notifications, admin products.

Payment gateway (Paystack) is intentionally out of scope — orders stay payment pending.
"""

from __future__ import annotations

import secrets
import string
from decimal import Decimal

from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.shop.models import (
    Appointment,
    CartItem,
    Notification,
    Order,
    OrderItem,
    Product,
    Review,
    Salon,
    Service,
    Stylist,
    WishlistItem,
)
from apps.shop.serializers import (
    AppointmentDetailSerializer,
    CartItemSerializer,
    NotificationSerializer,
    OrderSerializer,
    ProductSerializer,
    ReviewSerializer,
    WishlistItemSerializer,
)
from apps.users.permissions import IsAdminRole

PLATFORM_FEE_RATE = Decimal("0.10")


def _booking_ref() -> str:
    alphabet = string.ascii_uppercase + string.digits
    for _ in range(20):
        ref = "EB" + "".join(secrets.choice(alphabet) for _ in range(8))
        if not Appointment.objects.filter(booking_reference=ref).exists():
            return ref
    return "EB" + secrets.token_hex(4).upper()


def _order_number() -> str:
    for _ in range(20):
        num = "ORD-" + timezone.now().strftime("%y%m%d") + "-" + secrets.token_hex(3).upper()
        if not Order.objects.filter(order_number=num).exists():
            return num
    return "ORD-" + secrets.token_hex(6).upper()


def _notify(user, type_: str, title: str, message: str, data: dict | None = None) -> None:
    if user is None:
        return
    Notification.objects.create(
        user=user,
        type=type_,
        title=title,
        message=message,
        data=data or {},
    )


class AppointmentListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Appointment.objects.filter(user=request.user).select_related(
            "service", "salon", "stylist"
        )
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(AppointmentDetailSerializer(qs, many=True).data)

    def post(self, request):
        data = request.data
        service_id = data.get("serviceId") or data.get("service_id")
        salon_id = data.get("salonId") or data.get("salon_id")
        stylist_id = data.get("stylistId") or data.get("stylist_id")
        scheduled_at = data.get("scheduledAt") or data.get("scheduled_at")
        user_notes = data.get("userNotes") or data.get("user_notes") or ""
        duration = data.get("durationMinutes") or data.get("duration_minutes")

        if not scheduled_at:
            return Response({"error": "scheduledAt is required."}, status=status.HTTP_400_BAD_REQUEST)
        if not service_id and not salon_id and not stylist_id:
            return Response(
                {"error": "Provide at least serviceId, salonId, or stylistId."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service = salon = stylist = None
        if service_id:
            try:
                service = Service.objects.get(pk=service_id, is_active=True)
            except Service.DoesNotExist:
                return Response({"error": "Service not found."}, status=status.HTTP_404_NOT_FOUND)
            if not salon_id and service.salon_id:
                salon_id = service.salon_id
            if not stylist_id and service.stylist_id:
                stylist_id = service.stylist_id
            if duration is None:
                duration = service.duration_min or 60
            base_amount = service.min_price
        else:
            base_amount = Decimal(str(data.get("totalAmount") or data.get("total_amount") or "0"))
            duration = duration or 60

        if salon_id:
            try:
                salon = Salon.objects.get(pk=salon_id)
            except Salon.DoesNotExist:
                return Response({"error": "Salon not found."}, status=status.HTTP_404_NOT_FOUND)
        if stylist_id:
            try:
                stylist = Stylist.objects.get(pk=stylist_id)
            except Stylist.DoesNotExist:
                return Response({"error": "Stylist not found."}, status=status.HTTP_404_NOT_FOUND)

        base_amount = Decimal(base_amount or 0)
        platform_fee = (base_amount * PLATFORM_FEE_RATE).quantize(Decimal("0.01"))
        stylist_amount = (base_amount - platform_fee).quantize(Decimal("0.01"))

        appt = Appointment.objects.create(
            booking_reference=_booking_ref(),
            user=request.user,
            stylist=stylist,
            salon=salon,
            service=service,
            scheduled_at=scheduled_at,
            duration_minutes=int(duration),
            status=Appointment.Status.PENDING,
            user_notes=user_notes or None,
            total_amount=base_amount,
            platform_fee=platform_fee,
            stylist_amount=stylist_amount,
            payment_status=Appointment.PaymentStatus.PENDING,
        )
        _notify(
            request.user,
            "booking_created",
            "Booking created",
            f"Your booking {appt.booking_reference} is pending confirmation.",
            {"appointmentId": appt.id, "bookingReference": appt.booking_reference},
        )
        return Response(AppointmentDetailSerializer(appt).data, status=status.HTTP_201_CREATED)


class AppointmentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            appt = Appointment.objects.select_related("service", "salon", "stylist").get(
                pk=pk, user=request.user
            )
        except Appointment.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(AppointmentDetailSerializer(appt).data)


class AppointmentCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            appt = Appointment.objects.get(pk=pk, user=request.user)
        except Appointment.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
        if appt.status in {
            Appointment.Status.CANCELLED_BY_USER,
            Appointment.Status.CANCELLED_BY_STYLIST,
            Appointment.Status.COMPLETED,
        }:
            return Response(
                {"error": f"Cannot cancel a booking with status '{appt.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        reason = request.data.get("reason") or request.data.get("cancellationReason") or ""
        appt.status = Appointment.Status.CANCELLED_BY_USER
        appt.cancelled_at = timezone.now()
        appt.cancellation_reason = reason or None
        appt.save(update_fields=["status", "cancelled_at", "cancellation_reason"])
        _notify(
            request.user,
            "booking_cancelled",
            "Booking cancelled",
            f"Booking {appt.booking_reference} was cancelled.",
            {"appointmentId": appt.id},
        )
        return Response(AppointmentDetailSerializer(appt).data)


class CartListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = CartItem.objects.filter(user=request.user).select_related("product")
        data = CartItemSerializer(items, many=True, context={"request": request}).data
        total = sum((item.product.price * item.quantity) for item in items if item.product)
        return Response(
            {
                "items": data,
                "itemCount": sum(i.quantity for i in items),
                "subtotal": str(total),
            }
        )


class CartAddView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("productId") or request.data.get("product_id")
        quantity = int(request.data.get("quantity") or 1)
        if not product_id:
            return Response({"error": "productId is required."}, status=status.HTTP_400_BAD_REQUEST)
        if quantity < 1:
            return Response({"error": "quantity must be >= 1."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        item, created = CartItem.objects.get_or_create(
            user=request.user, product=product, defaults={"quantity": quantity}
        )
        if not created:
            item.quantity += quantity
            item.save(update_fields=["quantity", "updated_at"])
        return Response(
            CartItemSerializer(item, context={"request": request}).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class CartItemUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            item = CartItem.objects.select_related("product").get(pk=pk, user=request.user)
        except CartItem.DoesNotExist:
            return Response({"error": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)
        quantity = request.data.get("quantity")
        if quantity is None:
            return Response({"error": "quantity is required."}, status=status.HTTP_400_BAD_REQUEST)
        quantity = int(quantity)
        if quantity < 1:
            item.delete()
            return Response({"ok": True, "deleted": True})
        item.quantity = quantity
        item.save(update_fields=["quantity", "updated_at"])
        return Response(CartItemSerializer(item, context={"request": request}).data)

    def delete(self, request, pk):
        deleted, _ = CartItem.objects.filter(pk=pk, user=request.user).delete()
        if not deleted:
            return Response({"error": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"ok": True})


class CartClearView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        CartItem.objects.filter(user=request.user).delete()
        return Response({"ok": True})


class WishlistListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = WishlistItem.objects.filter(user=request.user).select_related("product")
        return Response(
            WishlistItemSerializer(items, many=True, context={"request": request}).data
        )


class WishlistAddView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("productId") or request.data.get("product_id")
        if not product_id:
            return Response({"error": "productId is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            product = Product.objects.get(pk=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        item, created = WishlistItem.objects.get_or_create(user=request.user, product=product)
        return Response(
            WishlistItemSerializer(item, context={"request": request}).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class WishlistRemoveView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        deleted, _ = WishlistItem.objects.filter(pk=pk, user=request.user).delete()
        if not deleted:
            deleted, _ = WishlistItem.objects.filter(user=request.user, product_id=pk).delete()
        if not deleted:
            return Response({"error": "Wishlist item not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"ok": True})


class OrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = (
            Order.objects.filter(user=request.user)
            .prefetch_related("items", "items__product")
            .order_by("-created_at")
        )
        return Response(OrderSerializer(orders, many=True, context={"request": request}).data)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.prefetch_related("items", "items__product").get(
                pk=pk, user=request.user
            )
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order, context={"request": request}).data)


class CheckoutView(APIView):
    """Create order from cart. No Paystack — status pending."""

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        shipping = request.data.get("shippingAddress") or request.data.get("shipping_address") or ""
        items = list(
            CartItem.objects.filter(user=request.user).select_related("product").select_for_update()
        )
        if not items:
            return Response({"error": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        total = Decimal("0")
        line_payload = []
        for item in items:
            if not item.product or not item.product.is_active:
                return Response(
                    {"error": f"Product unavailable in cart item {item.id}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if item.product.stock_quantity < item.quantity:
                return Response(
                    {
                        "error": f"Insufficient stock for '{item.product.name}'.",
                        "productId": item.product_id,
                        "available": item.product.stock_quantity,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            unit = item.product.price
            line_total = unit * item.quantity
            total += line_total
            line_payload.append((item, unit, line_total))

        order = Order.objects.create(
            user=request.user,
            order_number=_order_number(),
            total_amount=total,
            status=Order.OrderStatus.PENDING,
            shipping_address=shipping or None,
        )
        for item, unit, line_total in line_payload:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                unit_price=unit,
                total_price=line_total,
            )
            product = item.product
            product.stock_quantity = max(0, product.stock_quantity - item.quantity)
            product.save(update_fields=["stock_quantity"])

        CartItem.objects.filter(user=request.user).delete()
        _notify(
            request.user,
            "order_placed",
            "Order placed",
            f"Order {order.order_number} placed. Payment is pending.",
            {"orderId": order.id, "orderNumber": order.order_number},
        )
        order = Order.objects.prefetch_related("items", "items__product").get(pk=order.pk)
        return Response(
            OrderSerializer(order, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class OrderCancelView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        try:
            order = Order.objects.prefetch_related("items").get(pk=pk, user=request.user)
        except Order.DoesNotExist:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        if order.status not in {Order.OrderStatus.PENDING, Order.OrderStatus.PROCESSING}:
            return Response(
                {"error": f"Cannot cancel order with status '{order.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        for line in order.items.all():
            if line.product_id and line.quantity:
                Product.objects.filter(pk=line.product_id).update(
                    stock_quantity=F("stock_quantity") + line.quantity
                )
        order.status = Order.OrderStatus.CANCELLED
        order.save(update_fields=["status"])
        _notify(
            request.user,
            "order_cancelled",
            "Order cancelled",
            f"Order {order.order_number} was cancelled.",
            {"orderId": order.id},
        )
        order = Order.objects.prefetch_related("items", "items__product").get(pk=order.pk)
        return Response(OrderSerializer(order, context={"request": request}).data)


class ReviewCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        rating = request.data.get("rating")
        title = request.data.get("title") or ""
        body = request.data.get("body") or ""
        target_type = (request.data.get("targetType") or request.data.get("target_type") or "").lower()
        target_id = request.data.get("targetId") or request.data.get("target_id")
        appointment_id = request.data.get("appointmentId") or request.data.get("appointment_id")

        if rating is None:
            return Response({"error": "rating is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            rating = int(rating)
        except (TypeError, ValueError):
            return Response({"error": "rating must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
        if not (1 <= rating <= 5):
            return Response({"error": "rating must be between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)
        if target_type not in {"salon", "stylist", "product"}:
            return Response(
                {"error": "targetType must be salon, stylist, or product."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not target_id:
            return Response({"error": "targetId is required."}, status=status.HTTP_400_BAD_REQUEST)

        model_map = {"salon": Salon, "stylist": Stylist, "product": Product}
        Model = model_map[target_type]
        try:
            target = Model.objects.get(pk=target_id)
        except Model.DoesNotExist:
            return Response({"error": f"{target_type} not found."}, status=status.HTTP_404_NOT_FOUND)

        appointment = None
        if appointment_id:
            appointment = Appointment.objects.filter(pk=appointment_id, user=request.user).first()

        ct = ContentType.objects.get_for_model(Model)
        review = Review(
            user=request.user,
            appointment=appointment,
            target_type=target_type,
            target_id=int(target_id),
            target_content_type=ct,
            target_object_id=int(target_id),
            rating=rating,
            title=title or None,
            body=body or None,
            is_verified=bool(appointment),
        )
        review.full_clean()
        review.save()

        if hasattr(target, "total_reviews") and hasattr(target, "average_rating"):
            agg = Review.objects.filter(
                target_content_type=ct, target_object_id=target.id, rating__isnull=False
            )
            count = agg.count()
            if count:
                avg = sum(r.rating for r in agg) / count
                target.total_reviews = count
                target.average_rating = Decimal(str(round(avg, 2)))
                target.save(update_fields=["total_reviews", "average_rating"])

        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class ReviewListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        target_type = (
            request.query_params.get("targetType") or request.query_params.get("target_type") or ""
        ).lower()
        target_id = request.query_params.get("targetId") or request.query_params.get("target_id")
        qs = Review.objects.all().order_by("-created_at")
        if target_type and target_id:
            qs = qs.filter(target_type=target_type, target_id=target_id)
        elif target_type:
            qs = qs.filter(target_type=target_type)
        limit = min(int(request.query_params.get("limit") or 50), 100)
        return Response(ReviewSerializer(qs[:limit], many=True).data)


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(user=request.user).order_by("-created_at")
        if request.query_params.get("unread") in {"1", "true", "True"}:
            qs = qs.filter(is_read=False)
        limit = min(int(request.query_params.get("limit") or 50), 100)
        items = list(qs[:limit])
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response(
            {"items": NotificationSerializer(items, many=True).data, "unreadCount": unread_count}
        )


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk=None):
        if pk is not None:
            updated = Notification.objects.filter(pk=pk, user=request.user, is_read=False).update(
                is_read=True, read_at=timezone.now()
            )
            if not updated and not Notification.objects.filter(pk=pk, user=request.user).exists():
                return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)
            return Response({"ok": True, "updated": updated})
        updated = Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True, read_at=timezone.now()
        )
        return Response({"ok": True, "updated": updated})


class AdminProductCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        data = request.data
        name = data.get("name")
        price = data.get("price")
        if not name or price is None:
            return Response(
                {"error": "name and price are required."}, status=status.HTTP_400_BAD_REQUEST
            )
        product = Product.objects.create(
            name=name,
            description=data.get("description") or None,
            category=data.get("category") or None,
            price=price,
            compare_price=data.get("comparePrice") or data.get("compare_price"),
            stock_quantity=int(data.get("stockQuantity") or data.get("stock_quantity") or 0),
            sku=data.get("sku") or None,
            ingredients=data.get("ingredients") or None,
            usage_guide=data.get("usageGuide") or data.get("usage_guide") or None,
            badge=data.get("badge") or None,
            is_new=bool(data.get("isNew") or data.get("is_new") or False),
            is_featured=bool(data.get("isFeatured") or data.get("is_featured") or False),
            is_active=bool(data.get("isActive", data.get("is_active", True))),
        )
        return Response(
            ProductSerializer(product, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class AdminProductUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        data = request.data
        field_map = {
            "name": "name",
            "description": "description",
            "category": "category",
            "price": "price",
            "comparePrice": "compare_price",
            "compare_price": "compare_price",
            "stockQuantity": "stock_quantity",
            "stock_quantity": "stock_quantity",
            "sku": "sku",
            "ingredients": "ingredients",
            "usageGuide": "usage_guide",
            "usage_guide": "usage_guide",
            "badge": "badge",
            "isNew": "is_new",
            "is_new": "is_new",
            "isFeatured": "is_featured",
            "is_featured": "is_featured",
            "isActive": "is_active",
            "is_active": "is_active",
        }
        updated = []
        for key, model_field in field_map.items():
            if key in data:
                setattr(product, model_field, data[key])
                updated.append(model_field)
        if not updated:
            return Response(
                {"error": "No updatable fields provided."}, status=status.HTTP_400_BAD_REQUEST
            )
        product.save(update_fields=list(set(updated)))
        return Response(ProductSerializer(product, context={"request": request}).data)

    def delete(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        product.is_active = False
        product.save(update_fields=["is_active"])
        return Response({"ok": True, "softDeleted": True})
