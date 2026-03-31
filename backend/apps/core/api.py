from rest_framework.response import Response


def api_success(data=None, message="Success", status_code=200):
    return Response(
        {
            "success": True,
            "message": message,
            "data": data,
        },
        status=status_code,
    )


def paginated_payload(page, serializer):
    return {
        "count": page.paginator.count,
        "page": page.number,
        "num_pages": page.paginator.num_pages,
        "results": serializer.data,
    }

