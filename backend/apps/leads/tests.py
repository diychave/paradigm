from datetime import datetime
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Lead
from .telegram import format_lead_message, is_configured


class LeadTelegramTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_create_lead_sends_telegram_notification(self):
        with patch("apps.leads.views.notify_lead_async") as notify:
            response = self.client.post(
                "/api/leads",
                {"name": "Олена", "tel": "+380501112233", "message": "Хочу пробний урок"},
                format="json",
            )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Lead.objects.count(), 1)
        lead = Lead.objects.get()
        notify.assert_called_once()
        self.assertEqual(notify.call_args.args[0].pk, lead.pk)

    def test_invalid_phone_does_not_notify(self):
        with patch("apps.leads.views.notify_lead_async") as notify:
            response = self.client.post(
                "/api/leads",
                {"name": "Олена", "tel": "123", "message": ""},
                format="json",
            )
        self.assertEqual(response.status_code, 400)
        notify.assert_not_called()

    @override_settings(TELEGRAM_BOT_TOKEN="", TELEGRAM_CHAT_ID="")
    def test_not_configured_without_credentials(self):
        self.assertFalse(is_configured())

    @override_settings(TELEGRAM_BOT_TOKEN="token", TELEGRAM_CHAT_ID="123,456")
    def test_configured_with_multiple_chats(self):
        self.assertTrue(is_configured())

    def test_format_escapes_html(self):
        created = timezone.make_aware(datetime(2026, 8, 17, 12, 0))
        text = format_lead_message("A <b>B</b>", "+380501112233", "hi & bye", created)
        self.assertIn("A &lt;b&gt;B&lt;/b&gt;", text)
        self.assertIn("hi &amp; bye", text)
        self.assertIn("Нова заявка з сайту", text)


class OfficeLeadBoardTests(TestCase):
    def setUp(self):
        from rest_framework.authtoken.models import Token

        from apps.users.models import User

        self.client = APIClient()
        self.manager = User.objects.create_user(
            username="manager",
            password="demo1234",
            role=User.Role.MANAGER,
            is_staff=True,
        )
        token = Token.objects.create(user=self.manager)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        self.lead = Lead.objects.create(name="Олена", phone="+380501112233", message="Пробний урок")

    def test_manager_sees_new_lead_in_board(self):
        response = self.client.get("/api/office/leads")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["counts"]["new"], 1)
        self.assertEqual(response.data["columns"]["new"][0]["name"], "Олена")

    def test_manager_moves_lead_to_in_progress(self):
        response = self.client.patch(
            f"/api/office/leads/{self.lead.id}",
            {"column": "in_progress"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.lead.refresh_from_db()
        self.assertEqual(self.lead.status, Lead.Status.IN_PROGRESS)
        self.assertEqual(self.lead.assigned_to_id, self.manager.id)

    def test_close_and_reject(self):
        closed = self.client.patch(
            f"/api/office/leads/{self.lead.id}",
            {"column": "closed"},
            format="json",
        )
        self.assertEqual(closed.data["column"], "closed")
        rejected = self.client.patch(
            f"/api/office/leads/{self.lead.id}",
            {"status": "rejected"},
            format="json",
        )
        self.assertEqual(rejected.data["status"], "rejected")
        self.assertEqual(rejected.data["column"], "closed")

    def test_student_cannot_see_office_leads(self):
        from rest_framework.authtoken.models import Token

        from apps.users.models import User

        student = User.objects.create_user(
            username="student",
            password="demo1234",
            role=User.Role.STUDENT,
        )
        token = Token.objects.create(user=student)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        response = client.get("/api/office/leads")
        self.assertEqual(response.status_code, 403)
