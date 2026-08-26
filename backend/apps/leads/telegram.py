import html
import json
import logging
import threading
import urllib.error
import urllib.request

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

API_ROOT = "https://api.telegram.org/bot{token}/{method}"


def chat_ids():
    raw = getattr(settings, "TELEGRAM_CHAT_ID", "") or ""
    return [part.strip() for part in raw.replace(";", ",").split(",") if part.strip()]


def is_configured():
    return bool(getattr(settings, "TELEGRAM_BOT_TOKEN", "") and chat_ids())


def _request(method, payload=None, timeout=8):
    token = getattr(settings, "TELEGRAM_BOT_TOKEN", "")
    if not token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN is not set")
    url = API_ROOT.format(token=token, method=method)
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(url, data=data, headers=headers, method="POST" if data else "GET")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        logger.warning("Telegram API HTTP %s: %s", exc.code, body)
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            return {"ok": False, "description": body}
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        logger.warning("Telegram API error: %s", exc)
        return {"ok": False, "description": str(exc)}


def send_message(text, parse_mode="HTML"):
    if not is_configured():
        return False
    ok = True
    for chat_id in chat_ids():
        result = _request(
            "sendMessage",
            {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": parse_mode,
                "disable_web_page_preview": True,
            },
        )
        if not result.get("ok"):
            logger.warning("Telegram sendMessage failed for %s: %s", chat_id, result)
            ok = False
    return ok


def format_lead_message(name, phone, message, created_at):
    when = timezone.localtime(created_at).strftime("%d.%m.%Y %H:%M")
    body = (message or "").strip() or "—"
    return (
        "<b>Нова заявка з сайту</b>\n\n"
        f"<b>Ім'я:</b> {html.escape(name)}\n"
        f"<b>Телефон:</b> {html.escape(phone)}\n"
        f"<b>Повідомлення:</b> {html.escape(body)}\n"
        f"<b>Час:</b> {when}"
    )


def notify_lead(lead):
    if not is_configured():
        return False
    return send_message(
        format_lead_message(lead.name, lead.phone, lead.message, lead.created_at)
    )


def notify_lead_async(lead):
    if not is_configured():
        return
    payload = {
        "name": lead.name,
        "phone": lead.phone,
        "message": lead.message,
        "created_at": lead.created_at,
    }

    def _run():
        try:
            send_message(
                format_lead_message(
                    payload["name"],
                    payload["phone"],
                    payload["message"],
                    payload["created_at"],
                )
            )
        except Exception:
            logger.exception("Failed to notify Telegram about a lead")

    threading.Thread(target=_run, daemon=True).start()


def get_me():
    return _request("getMe")


def get_updates(offset=None, timeout=0):
    payload = {"timeout": timeout}
    if offset is not None:
        payload["offset"] = offset
    return _request("getUpdates", payload, timeout=max(timeout + 2, 8))
