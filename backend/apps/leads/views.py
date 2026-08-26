from rest_framework import mixins, status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Lead
from .serializers import LeadCreateSerializer
from .telegram import notify_lead_async


class LeadViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    serializer_class = LeadCreateSerializer
    queryset = Lead.objects.all()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = serializer.save()
        notify_lead_async(lead)
        return Response(
            {"id": lead.id, "status": lead.status},
            status=status.HTTP_201_CREATED,
        )
