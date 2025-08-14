from pydantic import BaseModel
from uuid import UUID


class EnrollmentCreate(BaseModel):
    classroom_id: UUID
    student_id: UUID


class EnrollmentOut(BaseModel):
    id: UUID
    classroom_id: UUID
    student_id: UUID
    is_active: bool

    class Config:
        orm_mode = True
        from_attributes = True





