from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Enrollment, LessonProgress, ScheduleException, ScheduleSlot
from .serializers import (
    EnrollmentListSerializer,
    EnrollmentSerializer,
    ScheduleExceptionSerializer,
    ScheduleSlotSerializer,
)


class IsStudent(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        user = request.user
        return getattr(user, "is_student_role", False) and not user.is_staff and not user.is_superuser


class MyEnrollmentsView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        qs = (
            Enrollment.objects.filter(student=request.user, status=Enrollment.Status.ACTIVE)
            .select_related("course")
            .prefetch_related(
                "lessons",
                "topic_progress",
                "course__sections",
            )
        )
        return Response(EnrollmentListSerializer(qs, many=True).data)


class MyEnrollmentDetailView(APIView):
    permission_classes = [IsStudent]

    def get(self, request, course_id):
        enrollment = (
            Enrollment.objects.filter(student=request.user, course_id=course_id, status=Enrollment.Status.ACTIVE)
            .select_related("course")
            .prefetch_related(
                "lessons",
                "topic_progress",
                "assignment_progress",
                "course__sections__topics__materials",
                "course__sections__topics__assignments",
                "course__sections__topics__student_materials",
            )
            .first()
        )
        if not enrollment:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(
            EnrollmentSerializer(enrollment, context={"hide_locked_topics": True}).data
        )


class ToggleLessonView(APIView):
    permission_classes = [IsStudent]

    def post(self, request, pk):
        lesson = LessonProgress.objects.filter(
            pk=pk,
            enrollment__student=request.user,
        ).first()
        if not lesson:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        if lesson.is_done:
            lesson.is_done = False
            lesson.completed_at = None
            lesson.save(update_fields=["is_done", "completed_at"])
        else:
            lesson.mark_done()
        return Response(
            {
                "id": lesson.id,
                "is_done": lesson.is_done,
                "completed_at": lesson.completed_at,
            }
        )


class MyScheduleView(APIView):
    permission_classes = [IsStudent]

    def get(self, request):
        slots = ScheduleSlot.objects.filter(
            enrollment__student=request.user,
            enrollment__status=Enrollment.Status.ACTIVE,
        ).select_related("enrollment__course")
        exceptions = ScheduleException.objects.filter(slot__in=slots)
        return Response(
            {
                "slots": ScheduleSlotSerializer(slots, many=True).data,
                "exceptions": ScheduleExceptionSerializer(exceptions, many=True).data,
            }
        )
