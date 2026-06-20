from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiSuccess(BaseModel, Generic[T]):
    success: bool = True
    message: str
    data: T


class ApiError(BaseModel):
    success: bool = False
    message: str
    status: int
    path: str
    timestamp: datetime
    errors: dict[str, str] = Field(default_factory=dict)
