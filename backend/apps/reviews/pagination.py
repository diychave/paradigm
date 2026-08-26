from collections import OrderedDict

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class JsonServerPagination(PageNumberPagination):
    """Pagination shape expected by frontend (json-server v1 style)."""

    page_query_param = "_page"
    page_size_query_param = "_per_page"
    page_size = 6
    max_page_size = 100

    def get_paginated_response(self, data):
        page = self.page
        paginator = page.paginator
        current = page.number
        last = paginator.num_pages
        return Response(
            OrderedDict(
                [
                    ("data", data),
                    ("first", 1),
                    ("prev", current - 1 if page.has_previous() else None),
                    ("next", current + 1 if page.has_next() else None),
                    ("last", last),
                    ("pages", last),
                    ("items", paginator.count),
                ]
            )
        )
