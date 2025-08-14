# backend/app/schemas/classroom.py

from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from .subject import SubjectOut
from .academic_year import AcademicYearOut

class ClassroomBase(BaseModel):
    name: str
    grade_level: str  # "K", "1", "2"..."8", "MULTI"
    classroom_type: str = "CORE"  # CORE, ENRICHMENT, SPECIAL
    max_students: Optional[int] = None

class ClassroomCreate(ClassroomBase):
    subject_id: str
    academic_year_id: str

class ClassroomUpdate(BaseModel):
    name: Optional[str] = None
    grade_level: Optional[str] = None
    classroom_type: Optional[str] = None
    max_students: Optional[int] = None

class TeacherAssignmentOut(BaseModel):
    id: UUID
    teacher_user_id: UUID
    teacher_name: str
    role_name: str
    can_view_grades: bool
    can_modify_grades: bool
    can_take_attendance: bool
    can_view_parent_contact: bool
    can_create_assignments: bool
    is_active: bool

    class Config:
        orm_mode = True
        from_attributes = True

class ClassroomOut(ClassroomBase):
    id: UUID
    subject_id: UUID
    academic_year_id: UUID
    subject: Optional[SubjectOut] = None
    academic_year: Optional[AcademicYearOut] = None
    enrollment_count: int = 0

    class Config:
        orm_mode = True
        from_attributes = True

class ClassroomWithDetails(ClassroomOut):
    teacher_assignments: List[TeacherAssignmentOut] = []
    # enrollments: List[EnrollmentOut] = []  # Will add when we create enrollment schema

    class Config:
        orm_mode = True
        from_attributes = True