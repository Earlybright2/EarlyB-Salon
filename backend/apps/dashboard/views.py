from datetime import datetime, timedelta
import calendar
import threading

from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.shop.models import (
    AiRecommendation,
    Appointment,
    Hairstyle,
    Product,
    Review,
    Salon,
    Service,
    Stylist,
)
from apps.shop.serializers import (
    AppointmentSerializer,
    ReviewSerializer,
    StylistSerializer,
)
from apps.users.models import User
from apps.users.permissions import (
    IsAdminRole,
    IsContentAdmin,
    IsFinanceAdmin,
    IsSuperAdmin,
    IsSupportAdmin,
    IsVerificationAdmin,
)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        return Response(
            {
                "totalUsers": User.objects.count(),
                "totalSalons": Salon.objects.count(),
                "totalBookings": Appointment.objects.count(),
                "totalProducts": Product.objects.count(),
                "pendingKyc": Stylist.objects.filter(kyc_status="pending").count(),
                "pendingDisputes": Appointment.objects.filter(
                    payment_status="disputed"
                ).count(),
                "activeSubscriptions": Stylist.objects.exclude(
                    subscription_plan="free"
                ).count(),
            }
        )


class TopSalonsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        salons = (
            Salon.objects.annotate(bookings=Count("appointments"))
            .order_by("-bookings")[:10]
        )
        data = [
            {
                "id": salon.id,
                "name": salon.business_name,
                "city": salon.city,
                "rating": str(salon.average_rating),
                "bookings": salon.bookings,
            }
            for salon in salons
        ]
        return Response(data)


class AllUsersView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        users = User.objects.order_by("-created_at").values(
            "id",
            "name",
            "email",
            "role",
            "phone_number",
            "is_active",
            "is_verified",
            "is_suspended",
            "created_at",
            "last_login_at",
        )
        data = [
            {
                "id": u["id"],
                "name": u["name"],
                "email": u["email"],
                "role": u["role"],
                "phoneNumber": u["phone_number"],
                "isActive": u["is_active"],
                "isVerified": u["is_verified"],
                "isSuspended": u["is_suspended"],
                "createdAt": u["created_at"],
                "lastLoginAt": u["last_login_at"],
            }
            for u in users
        ]
        return Response(data)


class UpdateUserRoleView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def patch(self, request, pk):
        valid_roles = [
            "user",
            "admin",
            "super_admin",
            "verification_admin",
            "finance_admin",
            "support_admin",
            "content_admin",
        ]
        role = request.data.get("role")
        if role not in valid_roles:
            return Response(
                {"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST
            )
        User.objects.filter(pk=pk).update(role=role)
        return Response({"success": True})


class SuspendUserView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, pk):
        suspended = bool(request.data.get("suspended", False))
        User.objects.filter(pk=pk).update(
            is_suspended=suspended, is_active=not suspended
        )
        return Response({"success": True})


class AllStylistsView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        stylists = Stylist.objects.order_by("-created_at")
        return Response(StylistSerializer(stylists, many=True).data)


class ManageFeaturedSalonView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, pk):
        featured = bool(request.data.get("featured", False))
        Salon.objects.filter(pk=pk).update(is_featured=featured)
        return Response({"success": True})


class PendingKycListView(APIView):
    permission_classes = [IsAuthenticated, IsVerificationAdmin]

    def get(self, request):
        stylists = Stylist.objects.filter(kyc_status="pending").order_by(
            "-kyc_submitted_at"
        )
        return Response(StylistSerializer(stylists, many=True).data)


class AllVerifiedSalonsView(APIView):
    permission_classes = [IsAuthenticated, IsVerificationAdmin]

    def get(self, request):
        salons = Salon.objects.order_by("-created_at")
        data = [
            {
                "id": salon.id,
                "businessName": salon.business_name,
                "city": salon.city,
                "state": salon.state,
                "country": salon.country,
                "ownerId": salon.owner_id,
                "isVerified": salon.is_verified,
                "isActive": salon.is_active,
                "createdAt": salon.created_at,
            }
            for salon in salons
        ]
        return Response(data)


class ManageSalonVerificationView(APIView):
    permission_classes = [IsAuthenticated, IsVerificationAdmin]

    def post(self, request, pk):
        verified = bool(request.data.get("verified", False))
        Salon.objects.filter(pk=pk).update(is_verified=verified)
        return Response({"success": True})


def _send_welcome_email(email: str, name: str) -> None:
    subject = "Welcome to Early Bright"
    message = (
        f"Hi {name},\n\n"
        "Congratulations! Your KYC has been approved and your profile is now live on Early Bright. "
        "We’re excited to help you connect with more clients."
    )
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=True,
        )
    except Exception:
        pass


def _schedule_welcome_email(email: str, name: str, delay_seconds: int = 1200) -> None:
    timer = threading.Timer(delay_seconds, _send_welcome_email, args=(email, name))
    timer.daemon = True
    timer.start()


class ApproveKycView(APIView):
    permission_classes = [IsAuthenticated, IsVerificationAdmin]

    def post(self, request, pk):
        approved = bool(request.data.get("approved", False))
        update = {"kyc_status": "approved" if approved else "rejected"}
        if approved:
            update["kyc_approved_at"] = timezone.now()
        Stylist.objects.filter(pk=pk).update(**update)

        if approved:
            stylist = Stylist.objects.filter(pk=pk).select_related("user").first()
            if stylist and stylist.user and stylist.user.email:
                send_mail(
                    "Your KYC has been approved",
                    (
                        f"Hi {stylist.user.name or 'there'},\n\n"
                        "Your KYC documents have been approved. Your profile is now verified and visible to clients on Early Bright."
                    ),
                    settings.DEFAULT_FROM_EMAIL,
                    [stylist.user.email],
                    fail_silently=True,
                )
                _schedule_welcome_email(stylist.user.email, stylist.user.name or "Stylist")

        return Response({"success": True})


class RevenueStatsView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceAdmin]

    def get(self, request):
        total_revenue = (
            Appointment.objects.filter(payment_status="paid").aggregate(
                total=Sum("total_amount")
            )["total"]
            or 0
        )
        pending_payouts = (
            Appointment.objects.filter(payment_status="pending").aggregate(
                total=Sum("stylist_amount")
            )["total"]
            or 0
        )
        total_orders = (
            Appointment.objects.aggregate(total=Sum("total_amount"))["total"] or 0
        )
        return Response(
            {
                "totalRevenue": str(total_revenue),
                "pendingPayouts": str(pending_payouts),
                "totalOrdersRevenue": str(total_orders),
            }
        )


class AllTransactionsView(APIView):
    permission_classes = [IsAuthenticated, IsFinanceAdmin]

    def get(self, request):
        appointments = Appointment.objects.order_by("-created_at")[:50]
        data = [
            {
                "id": a.id,
                "amount": str(a.total_amount),
                "status": a.payment_status,
                "type": "booking",
                "createdAt": a.created_at,
            }
            for a in appointments
        ]
        return Response(data)


class PendingDisputesView(APIView):
    permission_classes = [IsAuthenticated, IsSupportAdmin]

    def get(self, request):
        appointments = Appointment.objects.filter(
            payment_status="disputed"
        ).order_by("-created_at")
        return Response(AppointmentSerializer(appointments, many=True).data)


class ResolveDisputeView(APIView):
    permission_classes = [IsAuthenticated, IsSupportAdmin]

    def post(self, request, pk):
        status_choice = request.data.get("status")
        if status_choice not in {"refunded", "paid"}:
            return Response(
                {"error": "Invalid resolution status."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        Appointment.objects.filter(pk=pk, payment_status="disputed").update(
            payment_status=status_choice, status="completed"
        )
        return Response({"success": True})


class FlaggedReviewsView(APIView):
    permission_classes = [IsAuthenticated, IsContentAdmin]

    def get(self, request):
        reviews = Review.objects.filter(is_verified=False).order_by("-created_at")[:50]
        return Response(ReviewSerializer(reviews, many=True).data)


class ModerateReviewView(APIView):
    permission_classes = [IsAuthenticated, IsContentAdmin]

    def post(self, request, pk):
        verified = bool(request.data.get("verified", False))
        Review.objects.filter(pk=pk).update(is_verified=verified)
        return Response({"success": True})


class PlatformStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        week_ago = timezone.now() - timedelta(days=7)
        month_ago = timezone.now() - timedelta(days=30)
        weekly_bookings = Appointment.objects.filter(
            created_at__gte=week_ago
        ).count()
        active_users_30d = User.objects.filter(
            last_login_at__gte=month_ago
        ).count()
        return Response(
            {
                "weeklyBookings": weekly_bookings,
                "activeUsers30d": active_users_30d,
            }
        )


class PlatformAnalyticsView(APIView):
    """Real, aggregated platform analytics for the admin dashboard."""

    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        now = timezone.now()

        daily_bookings = Appointment.objects.filter(
            created_at__gte=now - timedelta(days=1)
        ).count()

        bookings_by_day = []
        for offset in range(6, -1, -1):
            day = (now - timedelta(days=offset)).date()
            bookings_by_day.append(
                {
                    "day": day.strftime("%a"),
                    "bookings": Appointment.objects.filter(
                        created_at__date=day
                    ).count(),
                }
            )

        users_by_role = [
            {"role": entry["role"] or "unknown", "count": entry["total"]}
            for entry in User.objects.values("role").annotate(total=Count("id"))
        ]

        product_sales = [
            {
                "name": product.name,
                "reviews": product.total_reviews,
                "price": str(product.price),
                "stockQuantity": product.stock_quantity,
                "category": product.category,
                "imageUrl": product.photos or None,
            }
            for product in Product.objects.order_by("-total_reviews")[:6]
        ]

        popular_hairstyles = [
            {
                "id": h.id,
                "name": h.name,
                "category": h.category,
                "trendScore": h.trend_score,
                "genderTarget": h.gender_target,
                "imageUrl": h.thumbnail_url or None,
            }
            for h in Hairstyle.objects.order_by("-trend_score")[:8]
        ]

        monthly_revenue = []
        for offset in range(5, -1, -1):
            year = now.year
            month = now.month - offset
            while month <= 0:
                month += 12
                year -= 1
            month_start = timezone.make_aware(datetime(year, month, 1))
            _, last_day = calendar.monthrange(year, month)
            month_end = month_start + timedelta(days=last_day)
            total = (
                Appointment.objects.filter(
                    created_at__gte=month_start,
                    created_at__lt=month_end,
                    payment_status="paid",
                ).aggregate(total=Sum("total_amount"))["total"]
                or 0
            )
            monthly_revenue.append(
                {"month": month_start.strftime("%b"), "revenue": float(total)}
            )

        ai_usage = AiRecommendation.objects.count()

        return Response(
            {
                "dailyBookings": daily_bookings,
                "bookingsByDay": bookings_by_day,
                "usersByRole": users_by_role,
                "productSales": product_sales,
                "popularHairstyles": popular_hairstyles,
                "monthlyRevenue": monthly_revenue,
                "aiUsage": ai_usage,
            }
        )
