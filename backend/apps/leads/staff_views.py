from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.access import is_office_staff

from .models import Lead


class IsOfficeStaff(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and is_office_staff(request.user)


COLUMNS = ("new", "in_progress", "closed")
COLUMN_TO_STATUS = {
    "new": Lead.Status.NEW,
    "in_progress": Lead.Status.IN_PROGRESS,
    "closed": Lead.Status.CONVERTED,
}


def lead_column(value):
    if value == Lead.Status.NEW:
        return "new"
    if value == Lead.Status.IN_PROGRESS:
        return "in_progress"
    return "closed"


def display_name(user):
    if not user:
        return ""
    return user.get_full_name().strip() or user.username


def lead_payload(lead):
    return {
        "id": lead.id,
        "name": lead.name,
        "phone": lead.phone,
        "message": lead.message,
        "status": lead.status,
        "status_label": lead.get_status_display(),
        "column": lead_column(lead.status),
        "assigned_to": lead.assigned_to_id,
        "assigned_name": display_name(lead.assigned_to),
        "created_at": lead.created_at.isoformat() if lead.created_at else "",
        "updated_at": lead.updated_at.isoformat() if lead.updated_at else "",
    }


def apply_column(lead, column, user=None):
    if column not in COLUMN_TO_STATUS:
        return False
    lead.status = COLUMN_TO_STATUS[column]
    if column == "in_progress" and user and not lead.assigned_to_id:
        lead.assigned_to = user
    return True


class OfficeLeadsView(APIView):
    permission_classes = [IsOfficeStaff]

    def get(self, request):
        rows = list(Lead.objects.select_related("assigned_to").all())
        grouped = {key: [] for key in COLUMNS}
        for lead in rows:
            grouped[lead_column(lead.status)].append(lead_payload(lead))
        return Response(
            {
                "columns": grouped,
                "counts": {key: len(grouped[key]) for key in COLUMNS},
            }
        )


class OfficeLeadDetailView(APIView):
    permission_classes = [IsOfficeStaff]

    def patch(self, request, pk):
        lead = Lead.objects.select_related("assigned_to").filter(pk=pk).first()
        if not lead:
            return Response({"detail": "Заявку не знайдено"}, status=status.HTTP_404_NOT_FOUND)

        column = (request.data.get("column") or "").strip()
        next_status = (request.data.get("status") or "").strip()
        if next_status == "closed":
            next_status = Lead.Status.CONVERTED

        if next_status:
            valid = {choice[0] for choice in Lead.Status.choices}
            if next_status not in valid:
                return Response({"detail": "Невірний статус"}, status=status.HTTP_400_BAD_REQUEST)
            lead.status = next_status
            if next_status == Lead.Status.IN_PROGRESS and not lead.assigned_to_id:
                lead.assigned_to = request.user
        elif column:
            if not apply_column(lead, column, request.user):
                return Response({"detail": "Невірна колонка"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"detail": "Потрібен status або column"}, status=status.HTTP_400_BAD_REQUEST)

        lead.save()
        return Response(lead_payload(lead))
