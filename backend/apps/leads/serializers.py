from rest_framework import serializers

from .models import Lead


class LeadCreateSerializer(serializers.ModelSerializer):
    tel = serializers.CharField(source="phone", max_length=32)

    class Meta:
        model = Lead
        fields = ("name", "tel", "message")

    def validate_name(self, value):
        value = value.strip()
        if len(value) < 2:
            raise serializers.ValidationError("Ім'я має містити мінімум 2 символи")
        return value

    def validate_tel(self, value):
        digits = "".join(ch for ch in value if ch.isdigit())
        if len(digits) != 12:
            raise serializers.ValidationError("Введіть повний номер телефону")
        return value
