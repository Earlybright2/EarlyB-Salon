from datetime import timedelta

from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.shop.models import (
    Appointment,
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


class ApproveKycView(APIView):
    permission_classes = [IsAuthenticated, IsVerificationAdmin]

    def post(self, request, pk):
        approved = bool(request.data.get("approved", False))
        update = {"kyc_status": "approved" if approved else "rejected"}
        if approved:
            update["kyc_approved_at"] = timezone.now()
        Stylist.objects.filter(pk=pk).update(**update)
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
