from django.db.models import F
from django.utils import timezone

from apps.catalog.models import Course
from .models import CabinetSync, Enrollment


def bump_students(student_ids):
    ids = {int(sid) for sid in student_ids if sid}
    if not ids:
        return
    existing = set(
        CabinetSync.objects.filter(student_id__in=ids).values_list("student_id", flat=True)
    )
    CabinetSync.objects.bulk_create(
        [CabinetSync(student_id=sid, version=1) for sid in ids - existing]
    )
    CabinetSync.objects.filter(student_id__in=existing).update(
        version=F("version") + 1,
        updated_at=timezone.now(),
    )


def bump_course(course_id):
    ids = Enrollment.objects.filter(
        course_id=course_id,
        status=Enrollment.Status.ACTIVE,
    ).values_list("student_id", flat=True)
    bump_students(ids)
    Course.objects.filter(pk=course_id).update(updated_at=timezone.now())
