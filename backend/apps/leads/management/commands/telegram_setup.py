from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.leads.telegram import get_me, get_updates, is_configured, send_message


SETUP_HINT = """
1. Відкрийте Telegram і знайдіть @BotFather.
2. Надішліть /newbot, задайте ім'я (наприклад Paradigm Leads)
   і username, який закінчується на bot.
3. Скопіюйте токен у backend/.env:
   TELEGRAM_BOT_TOKEN=123456:ABC...
4. Напишіть боту /start (або додайте його в групу і надішліть будь-яке повідомлення).
5. Знову запустіть: python manage.py telegram_setup
6. Скопіюйте chat id у backend/.env:
   TELEGRAM_CHAT_ID=123456789
   (кілька чатів — через кому)
7. Перезапустіть Django і перевірте: python manage.py telegram_setup --test
""".strip()


class Command(BaseCommand):
    help = "Перевіряє Telegram-бота заявок і допомагає знайти chat id"

    def add_arguments(self, parser):
        parser.add_argument(
            "--test",
            action="store_true",
            help="Надіслати тестове повідомлення в налаштований чат",
        )

    def handle(self, *args, **options):
        token = getattr(settings, "TELEGRAM_BOT_TOKEN", "")
        if not token:
            self.stdout.write(self.style.WARNING("TELEGRAM_BOT_TOKEN ще не задано.\n"))
            self.stdout.write(SETUP_HINT)
            return

        me = get_me()
        if not me.get("ok"):
            raise CommandError(
                f"Не вдалося звернутися до Telegram API: {me.get('description') or me}"
            )

        username = me["result"].get("username")
        self.stdout.write(self.style.SUCCESS(f"Бот @{username} підключено."))

        if options["test"]:
            if not is_configured():
                raise CommandError("Спочатку додайте TELEGRAM_CHAT_ID у backend/.env")
            if send_message("<b>Paradigm</b>\nТестове повідомлення: бот заявок працює."):
                self.stdout.write(self.style.SUCCESS("Тестове повідомлення надіслано."))
            else:
                raise CommandError("Не вдалося надіслати тестове повідомлення.")
            return

        updates = get_updates()
        if not updates.get("ok"):
            raise CommandError(
                f"getUpdates не спрацював: {updates.get('description') or updates}"
            )

        chats = {}
        for item in updates.get("result") or []:
            message = item.get("message") or item.get("my_chat_member") or {}
            chat = message.get("chat") or {}
            chat_id = chat.get("id")
            if chat_id is None:
                continue
            title = chat.get("title") or " ".join(
                part for part in [chat.get("first_name"), chat.get("last_name")] if part
            ) or chat.get("username") or "chat"
            chats[str(chat_id)] = f"{title} ({chat.get('type')})"

        if not chats:
            self.stdout.write(
                self.style.WARNING(
                    "Поки немає чатів. Напишіть боту /start і запустіть команду ще раз."
                )
            )
            self.stdout.write(SETUP_HINT)
            return

        self.stdout.write("Знайдені чати:")
        for chat_id, label in chats.items():
            self.stdout.write(f"  TELEGRAM_CHAT_ID={chat_id}  # {label}")
        if is_configured():
            self.stdout.write(self.style.SUCCESS("\nTELEGRAM_CHAT_ID уже заданий. Можна слати --test."))
        else:
            self.stdout.write("\nДодайте один із id у backend/.env як TELEGRAM_CHAT_ID.")
