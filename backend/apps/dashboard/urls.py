from django.urls import path

from apps.dashboard import views

urlpatterns = [
    path("dashboard", views.DashboardView.as_view(), name="admin-dashboard"),
    path("top-salons", views.TopSalonsView.as_view(), name="admin-top-salons"),
    path("users", views.AllUsersView.as_view(), name="admin-users"),
    path(
        "users/<int:pk>/role",
        views.UpdateUserRoleView.as_view(),
        name="admin-update-user-role",
    ),
    path(
        "users/<int:pk>/suspend",
        views.SuspendUserView.as_view(),
        name="admin-suspend-user",
    ),
    path("stylists", views.AllStylistsView.as_view(), name="admin-stylists"),
    path(
        "salons/<int:pk>/featured",
        views.ManageFeaturedSalonView.as_view(),
        name="admin-manage-featured-salon",
    ),
    path("kyc/pending", views.PendingKycListView.as_view(), name="admin-kyc-pending"),
    path(
        "kyc/<int:pk>/approve",
        views.ApproveKycView.as_view(),
        name="admin-kyc-approve",
    ),
    path("salons", views.AllVerifiedSalonsView.as_view(), name="admin-salons"),
    path(
        "salons/<int:pk>/verify",
        views.ManageSalonVerificationView.as_view(),
        name="admin-salons-verify",
    ),
    path("revenue", views.RevenueStatsView.as_view(), name="admin-revenue"),
    path("transactions", views.AllTransactionsView.as_view(), name="admin-transactions"),
    path("disputes", views.PendingDisputesView.as_view(), name="admin-disputes"),
    path(
        "disputes/<int:pk>/resolve",
        views.ResolveDisputeView.as_view(),
        name="admin-disputes-resolve",
    ),
    path("reviews", views.FlaggedReviewsView.as_view(), name="admin-reviews"),
    path(
        "reviews/<int:pk>/moderate",
        views.ModerateReviewView.as_view(),
        name="admin-moderate-review",
    ),
    path("platform-stats", views.PlatformStatsView.as_view(), name="admin-platform-stats"),
    path("analytics", views.PlatformAnalyticsView.as_view(), name="admin-analytics"),
]
