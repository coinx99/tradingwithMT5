from typing import Optional, Union
import strawberry


@strawberry.type
class BaseResponse:
    status: str
    message: str

@strawberry.type
class SuccessResponse(BaseResponse):
    status: str
    message: str
    data: Optional[str] = None  # Can be extended with actual data

@strawberry.type  
class ErrorResponse(BaseResponse):
    status: str
    message: str
    error_code: Optional[str] = None
    details: Optional[str] = None

# Union type for mutations
MutationResponse = Union[SuccessResponse, ErrorResponse]
