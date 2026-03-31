from rest_framework import status
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return response

    response.data = {
        "success": False,
        "message": "Request failed",
        "errors": response.data,
        "status_code": response.status_code,
    }
    return response

