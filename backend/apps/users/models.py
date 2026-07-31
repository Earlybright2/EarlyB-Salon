from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, union_id, email, password, **extra_fields):
        if not union_id:
            raise ValueError("The unionId field must be set")
        email = self.normalize_email(email) if email else None
        user = self.model(union_id=union_id, email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_user(self, union_id, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(union_id, email, password, **extra_fields)

    def create_superuser(self, union_id, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(union_id, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        USER = "user", "User"
        ADMIN = "admin", "Admin"
        SUPER_ADMIN = "super_admin", "Super Admin"
        VERIFICATION_ADMIN = "verification_admin", "Verification Admin"
        FINANCE_ADMIN = "finance_admin", "Finance Admin"
        SUPPORT_ADMIN = "support_admin", "Support Admin"
        CONTENT_ADMIN = "content_admin", "Content Admin"

    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        NON_BINARY = "non_binary", "Non Binary"
        PREFER_NOT_TO_SAY = "prefer_not_to_say", "Prefer Not To Say"

    class HairType(models.TextChoices):
        STRAIGHT = "straight", "Straight"
        WAVY = "wavy", "Wavy"
        CURLY = "curly", "Curly"
        COILY = "coily", "Coily"
        KINKY = "kinky", "Kinky"

    class FaceShape(models.TextChoices):
        OVAL = "oval", "Oval"
        ROUND = "round", "Round"
        SQUARE = "square", "Square"
        HEART = "heart", "Heart"
        DIAMOND = "diamond", "Diamond"
        OBLONG = "oblong", "Oblong"

    class AuthProvider(models.TextChoices):
        EMAIL = "email", "Email"
        GOOGLE = "google", "Google"
        APPLE = "apple", "Apple"
        PHONE = "phone", "Phone"

    id = models.BigAutoField(primary_key=True)
    union_id = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(max_length=320, unique=True, null=True, blank=True)
    password = models.CharField("password", max_length=128)
    avatar = models.TextField(blank=True, null=True)
    role = models.CharField(
        max_length=50, choices=Role.choices, default=Role.USER
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    gender = models.CharField(max_length=20, choices=Gender.choices, blank=True, null=True)
    date_of_birth = models.DateTimeField(null=True, blank=True)
    hair_type = models.CharField(max_length=20, choices=HairType.choices, blank=True, null=True)
    face_shape = models.CharField(max_length=20, choices=FaceShape.choices, blank=True, null=True)
    hairline_stage = models.SmallIntegerField(null=True, blank=True)
    skin_tone = models.SmallIntegerField(null=True, blank=True)
    auth_provider = models.CharField(
        max_length=20, choices=AuthProvider.choices, default=AuthProvider.EMAIL
    )
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_suspended = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["union_id"]

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]

    def __str__(self):
        return self.email or self.union_id
