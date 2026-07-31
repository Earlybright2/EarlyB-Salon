from rest_framework import serializers

from apps.users.models import User


class UserSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    unionId = serializers.CharField(source="union_id", read_only=True)
    phoneNumber = serializers.CharField(
        source="phone_number", required=False, allow_null=True
    )
    isVerified = serializers.BooleanField(source="is_verified", read_only=True)
    isActive = serializers.BooleanField(source="is_active", read_only=True)
    isSuspended = serializers.BooleanField(source="is_suspended", read_only=True)
    lastLoginAt = serializers.DateTimeField(source="last_login_at", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    dateOfBirth = serializers.DateTimeField(
        source="date_of_birth", required=False, allow_null=True
    )
    hairType = serializers.CharField(source="hair_type", required=False, allow_null=True)
    faceShape = serializers.CharField(source="face_shape", required=False, allow_null=True)
    hairlineStage = serializers.IntegerField(
        source="hairline_stage", required=False, allow_null=True
    )
    skinTone = serializers.IntegerField(source="skin_tone", required=False, allow_null=True)
    authProvider = serializers.CharField(
        source="auth_provider", required=False, allow_null=True
    )

    class Meta:
        model = User
        fields = [
            "id",
            "unionId",
            "name",
            "email",
            "role",
            "avatar",
            "phoneNumber",
            "gender",
            "dateOfBirth",
            "hairType",
            "faceShape",
            "hairlineStage",
            "skinTone",
            "authProvider",
            "isVerified",
            "isActive",
            "isSuspended",
            "lastLoginAt",
            "createdAt",
            "updatedAt",
        ]


class PublicUserSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    role = serializers.CharField(read_only=True)
    phoneNumber = serializers.CharField(source="phone_number", read_only=True)
    isActive = serializers.BooleanField(source="is_active", read_only=True)
    isVerified = serializers.BooleanField(source="is_verified", read_only=True)
    isSuspended = serializers.BooleanField(source="is_suspended", read_only=True)
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    lastLoginAt = serializers.DateTimeField(source="last_login_at", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "role",
            "phoneNumber",
            "isActive",
            "isVerified",
            "isSuspended",
            "createdAt",
            "lastLoginAt",
        ]
