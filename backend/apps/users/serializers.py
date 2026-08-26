from rest_framework import serializers

from .models import User

ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_AVATAR_SIZE = 5 * 1024 * 1024


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone",
            "display_name",
            "avatar",
        )

    def get_display_name(self, obj):
        full = obj.get_full_name().strip()
        return full or obj.username

    def get_avatar(self, obj):
        if not obj.avatar:
            return ""
        request = self.context.get("request")
        url = obj.avatar.url
        if request:
            return request.build_absolute_uri(url)
        return url


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Students may update contact fields, but not first/last name."""

    class Meta:
        model = User
        fields = ("email", "phone", "username")

    def validate_username(self, value):
        value = (value or "").strip()
        if not value:
            raise serializers.ValidationError("Логін не може бути порожнім.")
        qs = User.objects.filter(username__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Цей логін уже зайнятий.")
        return value

    def validate_email(self, value):
        value = (value or "").strip()
        if not value:
            return ""
        qs = User.objects.filter(email__iexact=value).exclude(email="")
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Цей email уже використовується.")
        return value


class AvatarUploadSerializer(serializers.Serializer):
    avatar = serializers.ImageField()

    def validate_avatar(self, value):
        content_type = getattr(value, "content_type", "") or ""
        if content_type and content_type not in ALLOWED_AVATAR_TYPES:
            raise serializers.ValidationError("Дозволені формати: JPG, PNG, WEBP, GIF.")
        if value.size > MAX_AVATAR_SIZE:
            raise serializers.ValidationError("Файл завеликий. Максимум 5 МБ.")
        return value
