from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


def add_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_content(
                message=str(exc.detail),
                status_code=exc.status_code,
                path=request.url.path,
                errors={},
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content=_error_content(
                message="Validation failed",
                status_code=422,
                path=request.url.path,
                errors=_validation_errors(exc),
            ),
        )


def _error_content(*, message: str, status_code: int, path: str, errors: dict[str, str]) -> dict:
    return {
        "success": False,
        "message": message,
        "status": status_code,
        "path": path,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "errors": errors,
    }


def _validation_errors(exc: RequestValidationError) -> dict[str, str]:
    errors: dict[str, str] = {}
    for error in exc.errors():
        loc = [str(part) for part in error.get("loc", []) if part != "body"]
        field = loc[-1] if loc else "body"
        errors[field] = str(error.get("msg", "Invalid value"))
    return errors
