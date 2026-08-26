from django.contrib.auth import authenticate, login, logout
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.views import APIView

from .access import (
    AUTH_FAILED,
    is_office_staff,
    is_public_student,
    is_studio_teacher,
    user_payload,
)
from .serializers import AvatarUploadSerializer, LoginSerializer, ProfileUpdateSerializer


def _failed():
    return Response({"detail": AUTH_FAILED}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if not is_public_student(user):
            return _failed()
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)
        return Response(user_payload(user, token.key, request))


class TeacherLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if not is_studio_teacher(user):
            return _failed()
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)
        return Response(user_payload(user, token.key, request))


class StaffLoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if not is_office_staff(user):
            return _failed()
        login(request, user)
        token, _ = Token.objects.get_or_create(user=user)
        return Response(user_payload(user, token.key, request))


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        logout(request)
        return Response({"ok": True})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        token, _ = Token.objects.get_or_create(user=request.user)
        return Response(user_payload(request.user, token.key, request))

    def patch(self, request):
        if not is_public_student(request.user):
            return Response({"detail": "Немає доступу"}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        token, _ = Token.objects.get_or_create(user=request.user)
        return Response(user_payload(request.user, token.key, request))


class AvatarView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not is_public_student(request.user):
            return Response({"detail": "Немає доступу"}, status=status.HTTP_403_FORBIDDEN)
        serializer = AvatarUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user
        if user.avatar:
            user.avatar.delete(save=False)
        user.avatar = serializer.validated_data["avatar"]
        user.save(update_fields=["avatar"])
        token, _ = Token.objects.get_or_create(user=user)
        return Response(user_payload(user, token.key, request))
