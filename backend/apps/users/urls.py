from django.urls import path

from apps.users import views

urlpatterns = [
    path("login", views.LoginView.as_view(), name="auth-login"),
    path("admin/login", views.AdminLoginView.as_view(), name="auth-admin-login"),
    path("register", views.RegisterView.as_view(), name="auth-register"),
    path("kyc", views.KycView.as_view(), name="auth-kyc"),
    path("me", views.MeView.as_view(), name="auth-me"),
    path("logout", views.LogoutView.as_view(), name="auth-logout"),
    path("google", views.GoogleAuthView.as_view(), name="auth-google"),
    path("google/callback", views.GoogleCallbackView.as_view(), name="auth-google-callback"),
    path("apple", views.AppleAuthView.as_view(), name="auth-apple"),
    path("apple/callback", views.AppleCallbackView.as_view(), name="auth-apple-callback"),
]
