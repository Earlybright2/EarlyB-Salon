from rest_framework import status
from rest_framework.exceptions import (
    AuthenticationFailed,
    NotAuthenticated,
    PermissionDenied,
    ValidationError,
)
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        return response

    detail = response.data.get("detail", "")
    if isinstance(detail, dict):
        message = detail.get("message", "Request failed")
    else:
        message = detail if detail else "Request failed"

    return response
