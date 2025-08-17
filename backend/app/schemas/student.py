# backend/app/schemas/student.py
# Fixed to work with your model structure

from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional
from uuid import UUID

class StudentBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    date_of_birth: Optional[date] = None
    student_id: Optional[str] = None

class StudentCreate(StudentBase):
    entry_date: Optional[date] = None
    entry_grade_level: Optional[str] = None

class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    date_of_birth: Optional[date] = None
    student_id: Optional[str] = None
    entry_date: Optional[date] = None
    entry_grade_level: Optional[str] = None
    is_active: Optional[bool] = None

class StudentOut(StudentBase):
    id: UUID
    entry_date: Optional[date] = None
    entry_grade_level: Optional[str] = None
    is_active: bool
    current_grade: Optional[str] = None

    class Config:
        orm_mode = True
        from_attributes = True

# Simplified version without complex relationships for now
class StudentWithDetails(StudentOut):
    pass  # Will add relationships later when they're properly set up

    class Config:
        orm_mode = True
        from_attributes = True