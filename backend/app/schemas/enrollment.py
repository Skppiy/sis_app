# 2. backend/app/schemas/enrollment.py - REPLACE ENTIRE FILE
from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
from uuid import UUID

class EnrollmentCreate(BaseModel):
    student_id: str
    classroom_id: str

class EnrollmentOut(BaseModel):
    id: UUID
    student_id: UUID
    classroom_id: UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True