from django.utils.text import slugify
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.learning.staff_views import IsOfficeAdmin
from apps.learning.sync import bump_course
from apps.reviews.models import TextReview
from apps.users.access import is_office_admin

from .models import (
    Course,
    CourseFit,
    CoursePlanLevel,
    FaqItem,
    PricingPlan,
    SiteContent,
    SocialLink,
    VideoItem,
)

DEFAULT_SITE = {
    "hero_title": "Школа програмування для дітей від 5 років",
    "hero_description": "З IT Paradigma ваша дитина вже на перших заняттях створить власну гру, програму або сайт.",
    "hero_tags": ["Сертифікат про навчання", "IT-професія", "Портфоліо проектів"],
    "about_stats": [
        {
            "number": "1000",
            "title": "Випускників",
            "desc": "Допомогли дітям зробити перші кроки в IT та перетворили захоплення іграми на корисні навички.",
        },
        {
            "number": "5000",
            "title": "Годин практики",
            "desc": "Жодних нудних лекцій. Навчання побудоване на інтерактиві, щоб дитина не втрачала цікавість.",
        },
        {
            "number": "700",
            "title": "Готових проєктів",
            "desc": "Наші учні вже створили власні ігри, сайти та додатки. Кожен проходить шлях від ідеї до релізу.",
        },
        {
            "number": "8000",
            "title": "Виконаних завдань",
            "desc": "Фокус на реальній роботі з кодом. Ми вчимо логічно мислити та вирішувати складні задачі самостійно.",
        },
    ],
    "footer_description": "Онлайн-школа програмування для дітей від 5 до 17 років. Ми навчаємо створювати ігри, сайти та додатки через практику та роботу над реальними проєктами. Ми допомагаємо зробити перші кроки в IT та поступово доводимо учнів до створення власних повноцінних проєктів.",
    "footer_phone": "+380 50 600 60 94",
    "footer_copyright": "© 2026 IT Paradigma. Всі права захищені",
}


def get_site():
    obj = SiteContent.objects.filter(pk=1).first()
    if obj:
        return obj
    return SiteContent.objects.create(pk=1, **DEFAULT_SITE)


def site_payload(obj=None):
    obj = obj or get_site()
    return {
        "hero_title": obj.hero_title,
        "hero_description": obj.hero_description,
        "hero_tags": obj.hero_tags or DEFAULT_SITE["hero_tags"],
        "about_stats": obj.about_stats or DEFAULT_SITE["about_stats"],
        "footer_description": obj.footer_description,
        "footer_phone": obj.footer_phone,
        "footer_copyright": obj.footer_copyright,
    }


def listing_course(course):
    plans = {row.level: row.topics or [] for row in course.plan_levels.all()}
    return {
        "id": course.id,
        "title": course.title,
        "subtitle": course.subtitle,
        "card_description": course.card_description,
        "card_image": course.card_image,
        "age_range": course.age_range,
        "tags": course.tags or [],
        "description": course.description,
        "image": course.image,
        "video": course.video,
        "suitable": course.suitable,
        "order": course.order,
        "is_published": course.is_published,
        "fits": [
            {"id": row.id, "title": row.title, "description": row.description, "order": row.order}
            for row in course.fits.all()
        ],
        "plans": {
            "junior": plans.get("junior") or [],
            "middle": plans.get("middle") or [],
            "senior": plans.get("senior") or [],
        },
    }


def pricing_payload(row):
    return {
        "id": row.id,
        "tag": row.tag,
        "lessons_label": row.lessons_label,
        "lessons_count": row.lessons_count,
        "price_per_lesson": row.price_per_lesson,
        "hidden": row.hidden,
        "order": row.order,
    }


def faq_payload(row):
    return {
        "id": row.id,
        "title": row.title,
        "description": row.description,
        "order": row.order,
        "is_published": row.is_published,
    }


def social_payload(row):
    return {"id": row.id, "url": row.url, "order": row.order}


def video_payload(row):
    return {"id": row.id, "video": row.video, "order": row.order, "is_published": row.is_published}


def review_payload(row):
    return {
        "id": row.id,
        "name": row.name,
        "age": row.age,
        "course": row.course_id,
        "review": row.review,
        "is_published": row.is_published,
    }


class SiteView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response(site_payload())


class OfficeListingView(APIView):
    permission_classes = [IsOfficeAdmin]

    def get(self, request):
        if not is_office_admin(request.user):
            return Response({"detail": "Немає доступу"}, status=status.HTTP_403_FORBIDDEN)
        courses = Course.objects.all().prefetch_related("fits", "plan_levels").order_by("order", "title")
        return Response(
            {
                "site": site_payload(),
                "courses": [listing_course(course) for course in courses],
                "pricing": [pricing_payload(row) for row in PricingPlan.objects.all()],
                "faq": [faq_payload(row) for row in FaqItem.objects.all()],
                "socials": [social_payload(row) for row in SocialLink.objects.all()],
                "videos": [video_payload(row) for row in VideoItem.objects.all()],
                "reviews": [review_payload(row) for row in TextReview.objects.select_related("course")],
            }
        )


class OfficeListingSiteView(APIView):
    permission_classes = [IsOfficeAdmin]

    def patch(self, request):
        obj = get_site()
        for key in (
            "hero_title",
            "hero_description",
            "footer_description",
            "footer_phone",
            "footer_copyright",
        ):
            if key in request.data:
                setattr(obj, key, str(request.data.get(key) or "").strip())
        if "hero_tags" in request.data:
            tags = request.data.get("hero_tags") or []
            obj.hero_tags = [str(item).strip() for item in tags if str(item).strip()]
        if "about_stats" in request.data:
            stats = []
            for item in request.data.get("about_stats") or []:
                stats.append(
                    {
                        "number": str(item.get("number") or "").strip(),
                        "title": str(item.get("title") or "").strip(),
                        "desc": str(item.get("desc") or "").strip(),
                    }
                )
            obj.about_stats = stats
        obj.save()
        return Response(site_payload(obj))


class OfficeListingCourseView(APIView):
    permission_classes = [IsOfficeAdmin]

    def patch(self, request, pk):
        course = Course.objects.filter(pk=pk).first()
        if not course:
            return Response({"detail": "Курс не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        fields = []
        for key in (
            "title",
            "subtitle",
            "card_description",
            "card_image",
            "age_range",
            "description",
            "image",
            "video",
            "suitable",
        ):
            if key in request.data:
                setattr(course, key, str(request.data.get(key) or "").strip())
                fields.append(key)
        if "tags" in request.data:
            tags = request.data.get("tags") or []
            course.tags = [str(item).strip() for item in tags if str(item).strip()]
            fields.append("tags")
        if "is_published" in request.data:
            course.is_published = bool(request.data.get("is_published"))
            fields.append("is_published")
        if "order" in request.data:
            try:
                course.order = int(request.data.get("order"))
                fields.append("order")
            except (TypeError, ValueError):
                return Response({"detail": "Невірний порядок"}, status=status.HTTP_400_BAD_REQUEST)
        if fields:
            course.save(update_fields=fields)
        if "fits" in request.data:
            CourseFit.objects.filter(course=course).delete()
            for index, item in enumerate(request.data.get("fits") or []):
                title = str(item.get("title") or "").strip()
                if not title:
                    continue
                CourseFit.objects.create(
                    course=course,
                    title=title,
                    description=str(item.get("description") or "").strip(),
                    order=index,
                )
        if "plans" in request.data:
            plans = request.data.get("plans") or {}
            for index, level in enumerate(("junior", "middle", "senior")):
                topics = plans.get(level) or []
                if isinstance(topics, str):
                    topics = [line.strip() for line in topics.splitlines() if line.strip()]
                else:
                    topics = [str(item).strip() for item in topics if str(item).strip()]
                CoursePlanLevel.objects.update_or_create(
                    course=course,
                    level=level,
                    defaults={"topics": topics, "order": index},
                )
        bump_course(course.id)
        course = Course.objects.prefetch_related("fits", "plan_levels").get(pk=course.pk)
        return Response(listing_course(course))


class OfficeListingPricingView(APIView):
    permission_classes = [IsOfficeAdmin]

    def post(self, request):
        tag = (request.data.get("tag") or "").strip()
        if not tag:
            return Response({"detail": "Вкажіть назву тарифу"}, status=status.HTTP_400_BAD_REQUEST)
        plan_id = slugify(request.data.get("id") or tag) or f"plan-{PricingPlan.objects.count() + 1}"
        if PricingPlan.objects.filter(pk=plan_id).exists():
            plan_id = f"{plan_id}-{PricingPlan.objects.count() + 1}"
        try:
            lessons_count = int(request.data.get("lessons_count") or 0)
            price = int(request.data.get("price_per_lesson") or 0)
        except (TypeError, ValueError):
            return Response({"detail": "Вкажіть кількість уроків і ціну"}, status=status.HTTP_400_BAD_REQUEST)
        row = PricingPlan.objects.create(
            id=plan_id,
            tag=tag,
            lessons_label=(request.data.get("lessons_label") or f"{lessons_count} занять").strip(),
            lessons_count=lessons_count,
            price_per_lesson=price,
            hidden=bool(request.data.get("hidden")),
            order=PricingPlan.objects.count(),
        )
        return Response(pricing_payload(row), status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        row = PricingPlan.objects.filter(pk=pk).first()
        if not row:
            return Response({"detail": "Тариф не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        if "tag" in request.data:
            row.tag = str(request.data.get("tag") or "").strip()
        if "lessons_label" in request.data:
            row.lessons_label = str(request.data.get("lessons_label") or "").strip()
        for key, field in (("lessons_count", "lessons_count"), ("price_per_lesson", "price_per_lesson"), ("order", "order")):
            if key in request.data:
                try:
                    setattr(row, field, int(request.data.get(key)))
                except (TypeError, ValueError):
                    return Response({"detail": "Невірне число"}, status=status.HTTP_400_BAD_REQUEST)
        if "hidden" in request.data:
            row.hidden = bool(request.data.get("hidden"))
        row.save()
        return Response(pricing_payload(row))

    def delete(self, request, pk):
        row = PricingPlan.objects.filter(pk=pk).first()
        if not row:
            return Response({"detail": "Тариф не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        row.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OfficeListingFaqView(APIView):
    permission_classes = [IsOfficeAdmin]

    def post(self, request):
        title = (request.data.get("title") or "").strip()
        description = (request.data.get("description") or "").strip()
        if not title or not description:
            return Response({"detail": "Вкажіть питання і відповідь"}, status=status.HTTP_400_BAD_REQUEST)
        row = FaqItem.objects.create(
            title=title,
            description=description,
            is_published=bool(request.data.get("is_published", True)),
            order=FaqItem.objects.count(),
        )
        return Response(faq_payload(row), status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        row = FaqItem.objects.filter(pk=pk).first()
        if not row:
            return Response({"detail": "Запис не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        if "title" in request.data:
            row.title = str(request.data.get("title") or "").strip()
        if "description" in request.data:
            row.description = str(request.data.get("description") or "").strip()
        if "is_published" in request.data:
            row.is_published = bool(request.data.get("is_published"))
        if "order" in request.data:
            try:
                row.order = int(request.data.get("order"))
            except (TypeError, ValueError):
                return Response({"detail": "Невірний порядок"}, status=status.HTTP_400_BAD_REQUEST)
        row.save()
        return Response(faq_payload(row))

    def delete(self, request, pk):
        row = FaqItem.objects.filter(pk=pk).first()
        if not row:
            return Response({"detail": "Запис не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        row.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OfficeListingSocialView(APIView):
    permission_classes = [IsOfficeAdmin]

    def post(self, request):
        social_id = slugify(request.data.get("id") or "") 
        url = (request.data.get("url") or "").strip()
        if not social_id or not url:
            return Response({"detail": "Вкажіть id і посилання"}, status=status.HTTP_400_BAD_REQUEST)
        if SocialLink.objects.filter(pk=social_id).exists():
            return Response({"detail": "Така соцмережа вже є"}, status=status.HTTP_400_BAD_REQUEST)
        row = SocialLink.objects.create(id=social_id, url=url, order=SocialLink.objects.count())
        return Response(social_payload(row), status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        row = SocialLink.objects.filter(pk=pk).first()
        if not row:
            return Response({"detail": "Запис не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        if "url" in request.data:
            row.url = str(request.data.get("url") or "").strip()
        if "order" in request.data:
            try:
                row.order = int(request.data.get("order"))
            except (TypeError, ValueError):
                return Response({"detail": "Невірний порядок"}, status=status.HTTP_400_BAD_REQUEST)
        row.save()
        return Response(social_payload(row))

    def delete(self, request, pk):
        row = SocialLink.objects.filter(pk=pk).first()
        if not row:
            return Response({"detail": "Запис не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        row.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OfficeListingVideoView(APIView):
    permission_classes = [IsOfficeAdmin]

    def post(self, request):
        video = (request.data.get("video") or "").strip()
        if not video:
            return Response({"detail": "Вкажіть посилання на відео"}, status=status.HTTP_400_BAD_REQUEST)
        row = VideoItem.objects.create(
            video=video,
            is_published=bool(request.data.get("is_published", True)),
            order=VideoItem.objects.count(),
        )
        return Response(video_payload(row), status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        row = VideoItem.objects.filter(pk=pk).first()
        if not row:
            return Response({"detail": "Запис не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        if "video" in request.data:
            row.video = str(request.data.get("video") or "").strip()
        if "is_published" in request.data:
            row.is_published = bool(request.data.get("is_published"))
        if "order" in request.data:
            try:
                row.order = int(request.data.get("order"))
            except (TypeError, ValueError):
                return Response({"detail": "Невірний порядок"}, status=status.HTTP_400_BAD_REQUEST)
        row.save()
        return Response(video_payload(row))

    def delete(self, request, pk):
        row = VideoItem.objects.filter(pk=pk).first()
        if not row:
            return Response({"detail": "Запис не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        row.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OfficeListingReviewView(APIView):
    permission_classes = [IsOfficeAdmin]

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        review = (request.data.get("review") or "").strip()
        course = Course.objects.filter(pk=request.data.get("course")).first()
        if not name or not review or not course:
            return Response({"detail": "Вкажіть ім’я, курс і відгук"}, status=status.HTTP_400_BAD_REQUEST)
        row = TextReview.objects.create(
            name=name,
            age=str(request.data.get("age") or "").strip(),
            course=course,
            review=review,
            is_published=bool(request.data.get("is_published", True)),
        )
        return Response(review_payload(row), status=status.HTTP_201_CREATED)

    def patch(self, request, pk):
        row = TextReview.objects.filter(pk=pk).first()
        if not row:
            return Response({"detail": "Запис не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        if "name" in request.data:
            row.name = str(request.data.get("name") or "").strip()
        if "age" in request.data:
            row.age = str(request.data.get("age") or "").strip()
        if "review" in request.data:
            row.review = str(request.data.get("review") or "").strip()
        if "is_published" in request.data:
            row.is_published = bool(request.data.get("is_published"))
        if request.data.get("course"):
            course = Course.objects.filter(pk=request.data.get("course")).first()
            if course:
                row.course = course
        row.save()
        return Response(review_payload(row))

    def delete(self, request, pk):
        row = TextReview.objects.filter(pk=pk).first()
        if not row:
            return Response({"detail": "Запис не знайдено"}, status=status.HTTP_404_NOT_FOUND)
        row.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
