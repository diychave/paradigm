import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.catalog.models import (
    Course,
    CourseFit,
    CoursePlanLevel,
    FaqItem,
    PricingPlan,
    SocialLink,
    VideoItem,
)
from apps.learning.models import (
    AssignmentProgress,
    CourseSection,
    CourseTeacher,
    CourseTopic,
    Enrollment,
    LessonProgress,
    ScheduleException,
    ScheduleSlot,
    StudentMaterial,
    TopicAssignment,
    TopicMaterial,
    TopicProgress,
    Transaction,
)
from apps.reviews.models import TextReview
from apps.users.models import User
from apps.users.signals import ensure_role_groups


class Command(BaseCommand):
    help = "Seed catalog content from frontend/api.json and create demo users"

    def add_arguments(self, parser):
        parser.add_argument(
            "--json",
            type=str,
            default="",
            help="Path to api.json (default: ../frontend/api.json)",
        )

    def handle(self, *args, **options):
        json_path = options["json"] or str(
            Path(settings.BASE_DIR).parent / "frontend" / "api.json"
        )
        path = Path(json_path)
        if not path.exists():
            self.stderr.write(self.style.ERROR(f"File not found: {path}"))
            return

        data = json.loads(path.read_text(encoding="utf-8"))
        password = settings.DEMO_PASSWORD

        with transaction.atomic():
            ensure_role_groups()
            self._seed_pricing(data.get("pricing", []))
            self._seed_socials(data.get("socials", []))
            self._seed_videos(data.get("video", []))
            self._seed_courses(data.get("courses", []))
            self._seed_faq(data.get("faq", []))
            self._seed_reviews(data.get("reviews", []))
            users = self._seed_users(password)
            self._seed_curriculum()
            self._seed_demo_enrollment(users["student"], users["teacher"])
            self._seed_demo_schedule(users["student"])
            self._seed_demo_transactions(users)

        self.stdout.write(self.style.SUCCESS("Seed completed."))
        self.stdout.write(
            f"Demo logins (password: {password}):\n"
            f"  student  → http://localhost:5173/login\n"
            f"  teacher  → http://localhost:5173/{settings.TEACHER_PATH}/\n"
            f"  manager  → http://localhost:5173/{settings.STAFF_PATH}/\n"
            f"  admin    → http://localhost:5173/{settings.STAFF_PATH}/\n"
        )

    def _seed_pricing(self, items):
        for i, item in enumerate(items):
            PricingPlan.objects.update_or_create(
                id=item["id"],
                defaults={
                    "tag": item["tag"],
                    "lessons_label": item["lessonsLabel"],
                    "lessons_count": item["lessonsCount"],
                    "price_per_lesson": item["pricePerLesson"],
                    "hidden": item.get("hidden", False),
                    "order": i,
                },
            )

    def _seed_socials(self, items):
        for i, item in enumerate(items):
            SocialLink.objects.update_or_create(
                id=item["id"],
                defaults={"url": item["url"], "order": i},
            )

    def _seed_videos(self, items):
        VideoItem.objects.all().delete()
        for i, item in enumerate(items):
            VideoItem.objects.create(
                id=item.get("id"),
                video=item["video"],
                order=i,
                is_published=True,
            )

    def _seed_courses(self, items):
        for i, item in enumerate(items):
            course, _ = Course.objects.update_or_create(
                id=item["id"],
                defaults={
                    "title": item["title"],
                    "subtitle": item.get("subtitle", ""),
                    "card_description": item.get("cardDescription", ""),
                    "card_image": item.get("cardImage", ""),
                    "age_range": item.get("ageRange", ""),
                    "tags": item.get("tags", []),
                    "description": item.get("description", ""),
                    "image": item.get("image", ""),
                    "video": item.get("video", ""),
                    "suitable": item.get("suitable", ""),
                    "order": i,
                    "is_published": True,
                },
            )
            course.fits.all().delete()
            for j, fit in enumerate(item.get("fit", [])):
                CourseFit.objects.create(
                    course=course,
                    title=fit["title"],
                    description=fit.get("description", ""),
                    order=j,
                )
            course.plan_levels.all().delete()
            for j, plan_obj in enumerate(item.get("plans", [])):
                for level, topics in plan_obj.items():
                    CoursePlanLevel.objects.create(
                        course=course,
                        level=level,
                        topics=topics,
                        order=j,
                    )

    def _seed_faq(self, items):
        FaqItem.objects.all().delete()
        for i, item in enumerate(items):
            FaqItem.objects.create(
                id=item.get("id"),
                title=item["title"],
                description=item["description"],
                order=i,
                is_published=True,
            )

    def _seed_reviews(self, items):
        TextReview.objects.all().delete()
        for item in items:
            course_id = item.get("course")
            if not Course.objects.filter(pk=course_id).exists():
                continue
            TextReview.objects.create(
                id=item.get("id"),
                name=item["name"],
                age=str(item.get("age", "")),
                course_id=course_id,
                review=item["review"],
                is_published=True,
            )

    def _seed_users(self, password):
        ensure_role_groups()
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@paradigm.local",
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
                "first_name": "Супер",
                "last_name": "Адмін",
            },
        )
        if created or not admin.has_usable_password():
            admin.set_password(password)
        admin.role = User.Role.ADMIN
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()

        manager, created = User.objects.get_or_create(
            username="manager",
            defaults={
                "email": "manager@paradigm.local",
                "role": User.Role.MANAGER,
                "is_staff": True,
                "first_name": "Марія",
                "last_name": "Менеджер",
            },
        )
        if created or not manager.has_usable_password():
            manager.set_password(password)
        manager.role = User.Role.MANAGER
        manager.is_staff = True
        manager.is_superuser = False
        manager.office_password = password
        manager.save()

        student, created = User.objects.get_or_create(
            username="student",
            defaults={
                "email": "student@paradigm.local",
                "role": User.Role.STUDENT,
                "first_name": "Демо",
                "last_name": "Студент",
            },
        )
        if created or not student.has_usable_password():
            student.set_password(password)
        student.role = User.Role.STUDENT
        student.is_staff = False
        student.is_superuser = False
        student.office_password = password
        student.save()

        teacher, created = User.objects.get_or_create(
            username="teacher",
            defaults={
                "email": "teacher@paradigm.local",
                "role": User.Role.TEACHER,
                "first_name": "Олена",
                "last_name": "Викладач",
            },
        )
        if created or not teacher.has_usable_password():
            teacher.set_password(password)
        teacher.role = User.Role.TEACHER
        teacher.is_staff = False
        teacher.is_superuser = False
        teacher.office_password = password
        teacher.save()

        return {"admin": admin, "manager": manager, "student": student, "teacher": teacher}

    def _seed_curriculum(self):
        python = Course.objects.filter(id="python").first()
        if python:
            self._seed_python_curriculum(python)

        curricula = {
            "scratch": [
                (
                    "Старт у Scratch",
                    [
                        ("Інтерфейс Scratch", "Сцена, спрайти, блоки"),
                        ("Рух і координати", "Переміщення спрайтів"),
                        ("Зовнішній вигляд", "Костюми та ефекти"),
                    ],
                ),
                (
                    "Події та керування",
                    [
                        ("Події", "Коли натиснуто прапорець / клавішу"),
                        ("Умови", "Якщо — то — інакше"),
                        ("Цикли", "Повторити та завжди"),
                    ],
                ),
                (
                    "Змінні та списки",
                    [
                        ("Змінні", "Лічильники та очки"),
                        ("Списки", "Зберігання кількох значень"),
                    ],
                ),
                (
                    "Ігровий проєкт",
                    [
                        ("Міні-гра", "Збираємо механіку"),
                        ("Фінальний проєкт", "Повна гра у Scratch"),
                    ],
                ),
            ],
            "roblox": [
                (
                    "Основи Roblox Studio",
                    [
                        ("Інтерфейс Studio", "Viewport, Explorer, Properties"),
                        ("Parts і моделі", "Будуємо світ"),
                        ("Workspace", "Організація сцени"),
                    ],
                ),
                (
                    "Lua для початківців",
                    [
                        ("Змінні та типи", "number, string, boolean"),
                        ("Умови та цикли", "if, for, while"),
                        ("Функції", "Власні скрипти"),
                    ],
                ),
                (
                    "Геймплей",
                    [
                        ("Гравець і персонаж", "Humanoid, spawn"),
                        ("Тригери та події", "Touched, ClickDetector"),
                    ],
                ),
                (
                    "Проєкт гри",
                    [
                        ("Механіка рівня", "Перешкоди та нагороди"),
                        ("Публікація", "Тест і publish"),
                    ],
                ),
            ],
            "web-development": [
                (
                    "HTML основи",
                    [
                        ("Структура сторінки", "html, head, body"),
                        ("Текст і списки", "Заголовки, p, ul"),
                        ("Посилання та зображення", "a, img"),
                    ],
                ),
                (
                    "CSS стилі",
                    [
                        ("Селектори", "Класи та id"),
                        ("Box model", "margin, padding, border"),
                        ("Flexbox", "Сучасне вирівнювання"),
                    ],
                ),
                (
                    "JavaScript старт",
                    [
                        ("Змінні та DOM", "querySelector, events"),
                        ("Інтерактив", "Кнопки та форми"),
                    ],
                ),
                (
                    "Веб-проєкт",
                    [
                        ("Лендінг", "Збираємо сторінку"),
                        ("Деплой", "Публікація результату"),
                    ],
                ),
            ],
            "unity": [
                (
                    "Основи Unity",
                    [
                        ("Редактор Unity", "Scene, Hierarchy, Inspector"),
                        ("GameObject і компоненти", "Transform, Camera"),
                        ("Сцени", "Організація рівнів"),
                    ],
                ),
                (
                    "C# для ігор",
                    [
                        ("Скрипти MonoBehaviour", "Start і Update"),
                        ("Змінні та методи", "Публічні поля"),
                        ("Колізії", "Colliders і triggers"),
                    ],
                ),
                (
                    "2D / 3D геймплей",
                    [
                        ("Рух персонажа", "Input і Rigidbody"),
                        ("UI в грі", "Canvas і кнопки"),
                    ],
                ),
                (
                    "Ігровий проєкт",
                    [
                        ("Збірка рівня", "Префаби та спавн"),
                        ("Білд гри", "Build Settings"),
                    ],
                ),
            ],
        }

        for course_id, modules in curricula.items():
            course = Course.objects.filter(id=course_id).first()
            if not course:
                continue
            self._seed_simple_modules(course, modules)

    def _seed_simple_modules(self, course, modules):
        """Replace placeholder single module with a multi-module curriculum."""
        existing = list(course.sections.order_by("order"))
        only_placeholder = (
            len(existing) == 1 and existing[0].title == "Основний модуль"
        )
        if existing and not only_placeholder:
            return

        if only_placeholder:
            existing[0].delete()

        for s_idx, (section_title, topics) in enumerate(modules):
            section = CourseSection.objects.create(
                course=course,
                title=section_title,
                order=s_idx,
            )
            for t_idx, (title, description) in enumerate(topics):
                topic = CourseTopic.objects.create(
                    section=section,
                    title=title,
                    description=description,
                    order=t_idx,
                )
                TopicMaterial.objects.create(
                    topic=topic,
                    title=f"Конспект — {title}",
                    material_type=TopicMaterial.MaterialType.PDF,
                    meta="PDF • 6 сторінок",
                    url="#",
                    order=0,
                )
                if t_idx % 2 == 0:
                    TopicMaterial.objects.create(
                        topic=topic,
                        title=f"Практика — {title}",
                        material_type=TopicMaterial.MaterialType.VIDEO,
                        meta="Відео • 8 хв",
                        url="#",
                        order=1,
                    )

    def _seed_python_curriculum(self, course):
        if course.sections.exists():
            return

        curriculum = [
            (
                "Основи Python",
                [
                    {
                        "title": "Змінні",
                        "description": "Основні типи даних",
                        "materials": [
                            ("Конспект — Змінні Python", "pdf", "PDF • 12 сторінок"),
                            ("Типи даних Python", "pdf", "PDF • 8 сторінок"),
                        ],
                        "assignments": [
                            ("Домашнє завдання 1", "Змінні та типи даних"),
                            ("Домашнє завдання 2", "Робота з рядками"),
                        ],
                    },
                    {
                        "title": "Ввід і вивід даних",
                        "description": "input() і print()",
                        "materials": [
                            ("Конспект — input і print", "pdf", "PDF • 5 сторінок"),
                        ],
                        "assignments": [
                            ("Домашнє завдання 1", "Практика з input() і print()"),
                        ],
                    },
                    {
                        "title": "Математичні оператори",
                        "description": "Робота з числами",
                        "materials": [
                            ("Конспект — оператори", "pdf", "PDF • 7 сторінок"),
                            ("Презентація — числа в Python", "ppt", "PPT • 14 слайдів"),
                        ],
                        "assignments": [
                            ("Домашнє завдання 1", "Арифметичні вирази"),
                            ("Домашнє завдання 2", "Калькулятор"),
                            ("Домашнє завдання 3", "Практичні задачі"),
                        ],
                    },
                ],
            ),
            (
                "Умови",
                [
                    {
                        "title": "if / elif / else",
                        "description": "Умовні конструкції",
                        "materials": [
                            ("Конспект — умови", "pdf", "PDF • 9 сторінок"),
                            ("Відео — розгалуження", "video", "Відео • 12 хв"),
                        ],
                        "assignments": [
                            ("Домашнє завдання 1", "Умови та порівняння"),
                        ],
                    },
                    {
                        "title": "Логічні оператори",
                        "description": "and, or, not",
                        "materials": [
                            ("Конспект — логіка", "doc", "Документ • 4 сторінки"),
                        ],
                        "assignments": [
                            ("Домашнє завдання 1", "Складні умови"),
                            ("Домашнє завдання 2", "Міні-проєкт з умовами"),
                        ],
                    },
                ],
            ),
            (
                "Цикли",
                [
                    {
                        "title": "Цикл for",
                        "description": "Ітерації та range()",
                        "materials": [
                            ("Конспект — for", "pdf", "PDF • 8 сторінок"),
                        ],
                        "assignments": [
                            ("Домашнє завдання 1", "Цикли for"),
                        ],
                    },
                    {
                        "title": "Цикл while",
                        "description": "Умови виходу з циклу",
                        "materials": [
                            ("Конспект — while", "pdf", "PDF • 6 сторінок"),
                            ("Посилання — практика", "link", "Зовнішнє посилання"),
                        ],
                        "assignments": [
                            ("Домашнє завдання 1", "while і break"),
                            ("Домашнє завдання 2", "Ігри з циклами"),
                        ],
                    },
                ],
            ),
            (
                "Списки і кортежі",
                [
                    {
                        "title": "Списки",
                        "description": "Методи списків",
                        "materials": [
                            ("Конспект — списки", "pdf", "PDF • 10 сторінок"),
                        ],
                        "assignments": [
                            ("Домашнє завдання 1", "Робота зі списками"),
                        ],
                    },
                    {
                        "title": "Кортежі",
                        "description": "Незмінні послідовності",
                        "materials": [
                            ("Конспект — кортежі", "pdf", "PDF • 5 сторінок"),
                        ],
                        "assignments": [
                            ("Домашнє завдання 1", "Списки vs кортежі"),
                        ],
                    },
                ],
            ),
            (
                "Словники",
                [
                    {
                        "title": "Основи словників",
                        "description": "Ключі та значення",
                        "materials": [
                            ("Конспект — словники", "pdf", "PDF • 8 сторінок"),
                        ],
                        "assignments": [
                            ("Домашнє завдання 1", "Словники на практиці"),
                        ],
                    },
                ],
            ),
            (
                "Функції",
                [
                    {
                        "title": "Оголошення функцій",
                        "description": "def, return, параметри",
                        "materials": [
                            ("Конспект — функції", "pdf", "PDF • 11 сторінок"),
                            ("Презентація — функції", "ppt", "PPT • 10 слайдів"),
                        ],
                        "assignments": [
                            ("Домашнє завдання 1", "Власні функції"),
                            ("Домашнє завдання 2", "Рефакторинг коду"),
                        ],
                    },
                ],
            ),
            (
                "Робота з файлами",
                [
                    {
                        "title": "Читання і запис",
                        "description": "open, with, режими",
                        "materials": [
                            ("Конспект — файли", "pdf", "PDF • 7 сторінок"),
                        ],
                        "assignments": [
                            ("Домашнє завдання 1", "Робота з текстовими файлами"),
                        ],
                    },
                ],
            ),
            (
                "Підсумковий проєкт",
                [
                    {
                        "title": "Фінальний проєкт",
                        "description": "Збираємо все разом",
                        "materials": [
                            ("Бриф проєкту", "doc", "Документ • 3 сторінки"),
                            ("Приклади рішень", "link", "Зовнішнє посилання"),
                        ],
                        "assignments": [
                            ("Проєкт", "Здати фінальну роботу"),
                        ],
                    },
                ],
            ),
        ]

        for s_idx, (section_title, topics) in enumerate(curriculum):
            section = CourseSection.objects.create(
                course=course,
                title=section_title,
                order=s_idx,
            )
            for t_idx, topic_data in enumerate(topics):
                topic = CourseTopic.objects.create(
                    section=section,
                    title=topic_data["title"],
                    description=topic_data["description"],
                    order=t_idx,
                )
                for m_idx, (title, mtype, meta) in enumerate(topic_data["materials"]):
                    TopicMaterial.objects.create(
                        topic=topic,
                        title=title,
                        material_type=mtype,
                        meta=meta,
                        url="#",
                        order=m_idx,
                    )

    def _seed_demo_enrollment(self, student, teacher):
        keep_id = "python"
        Enrollment.objects.filter(student=student).exclude(course_id=keep_id).update(
            status=Enrollment.Status.CANCELLED
        )
        CourseTeacher.objects.filter(teacher=teacher).exclude(course_id=keep_id).delete()

        course = Course.objects.filter(id=keep_id).first()
        if not course:
            return
        enrollment, _ = Enrollment.objects.get_or_create(
            student=student,
            course=course,
            defaults={"status": Enrollment.Status.ACTIVE, "teacher": teacher},
        )
        enrollment.status = Enrollment.Status.ACTIVE
        enrollment.teacher = teacher
        enrollment.save(update_fields=["status", "teacher"])
        if teacher:
            CourseTeacher.objects.get_or_create(course=course, teacher=teacher)

        if not course.sections.exists() and not enrollment.lessons.exists():
            plan = course.plan_levels.filter(level="junior").first()
            topics = plan.topics if plan else ["Вступне заняття", "Практика", "Проєкт"]
            for i, title in enumerate(topics[:8]):
                LessonProgress.objects.create(
                    enrollment=enrollment,
                    title=title,
                    order=i,
                    materials=self._lesson_materials(title),
                )

        self._seed_topic_progress(enrollment)

    def _seed_topic_progress(self, enrollment):
        topics = list(CourseTopic.objects.filter(section__course=enrollment.course))
        total = len(topics)
        done_target = max(1, int(round(total * 0.35))) if total else 0

        for idx, topic in enumerate(topics):
            if idx < done_target:
                status = TopicProgress.Status.DONE
            elif idx == done_target:
                status = TopicProgress.Status.IN_PROGRESS
            else:
                status = TopicProgress.Status.NOT_STARTED
            TopicProgress.objects.update_or_create(
                enrollment=enrollment,
                topic=topic,
                defaults={"status": status},
            )

            if status == TopicProgress.Status.NOT_STARTED:
                continue

            assignment, _ = TopicAssignment.objects.get_or_create(
                topic=topic,
                enrollment=enrollment,
                title=f"Домашнє — {topic.title}",
                defaults={
                    "description": "Практичні вправи за темою",
                    "due_label": "До наступного заняття",
                    "order": 0,
                },
            )
            if status == TopicProgress.Status.DONE:
                a_status = AssignmentProgress.Status.REVIEWED
                grade = "9/10"
                hw_status = AssignmentProgress.HwStatus.DONE
            else:
                a_status = AssignmentProgress.Status.IN_PROGRESS
                grade = ""
                hw_status = ""
                StudentMaterial.objects.get_or_create(
                    enrollment=enrollment,
                    topic=topic,
                    title=f"Додаткова практика — {topic.title}",
                    defaults={
                        "material_type": TopicMaterial.MaterialType.LINK,
                        "meta": "Від викладача",
                        "url": "#",
                        "order": 0,
                    },
                )
            AssignmentProgress.objects.update_or_create(
                enrollment=enrollment,
                assignment=assignment,
                defaults={"status": a_status, "grade": grade, "hw_status": hw_status},
            )

    def _seed_demo_schedule(self, student):
        from datetime import time

        slots = [
            ("python", 0, time(16, 0), time(17, 30), "online", "Zoom"),
            ("python", 3, time(16, 0), time(17, 30), "online", "Zoom"),
            ("scratch", 2, time(15, 0), time(16, 0), "offline", "Каб. 2"),
            ("scratch", 5, time(11, 0), time(12, 0), "offline", "Каб. 2"),
            ("roblox", 5, time(12, 30), time(14, 0), "online", "Zoom"),
        ]
        ScheduleSlot.objects.filter(enrollment__student=student).delete()
        for course_id, weekday, start, end, mode, place in slots:
            enrollment = Enrollment.objects.filter(
                student=student,
                course_id=course_id,
                status=Enrollment.Status.ACTIVE,
            ).first()
            if not enrollment:
                continue
            ScheduleSlot.objects.create(
                enrollment=enrollment,
                weekday=weekday,
                start_time=start,
                end_time=end,
                mode=mode,
                place=place,
            )

        from datetime import timedelta

        today = timezone.localdate()
        scratch_sat = ScheduleSlot.objects.filter(
            enrollment__student=student,
            enrollment__course_id="scratch",
            weekday=5,
        ).first()
        python_thu = ScheduleSlot.objects.filter(
            enrollment__student=student,
            enrollment__course_id="python",
            weekday=3,
        ).first()

        def last_weekday(weekday):
            delta = (today.weekday() - weekday) % 7
            if delta == 0:
                delta = 7
            return today - timedelta(days=delta)

        def next_weekday(weekday):
            delta = (weekday - today.weekday()) % 7
            if delta == 0:
                delta = 7
            return today + timedelta(days=delta)

        if scratch_sat:
            ScheduleException.objects.update_or_create(
                slot=scratch_sat,
                date=last_weekday(5),
                defaults={"status": ScheduleException.Status.CANCELLED},
            )
        if python_thu:
            ScheduleException.objects.update_or_create(
                slot=python_thu,
                date=next_weekday(3),
                defaults={"status": ScheduleException.Status.CANCELLED},
            )

    def _seed_demo_transactions(self, users):
        student = users["student"]
        admin = users["admin"]
        python = Course.objects.filter(id="python").first()
        scratch = Course.objects.filter(id="scratch").first()
        samples = [
            (python, 4800, Transaction.Status.PAID, "Пакет 8 занять"),
            (scratch, 2400, Transaction.Status.PENDING, "Очікує оплату за квітень"),
            (None, 600, Transaction.Status.REFUNDED, "Повернення за скасоване заняття"),
        ]
        if Transaction.objects.filter(student=student).exists():
            return
        for course, amount, status, note in samples:
            Transaction.objects.create(
                student=student,
                course=course,
                amount=amount,
                status=status,
                note=note,
                created_by=admin,
            )

    def _lesson_materials(self, title):
        return [
            {"name": f"{title} — конспект.pdf", "url": "#", "type": "pdf"},
            {"name": f"{title} — матеріали.zip", "url": "#", "type": "zip"},
        ]
