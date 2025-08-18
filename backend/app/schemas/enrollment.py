# backend/app/schemas/enrollment.py
# Enrollment schemas following established patterns from student.py and classroom.py

from pydantic import BaseModel
from datetime import date
from typing import Optional, List
from uuid import UUID

# Import existing schemas for relationships
from .student import StudentEnrollmentInfo
from .classroom import ClassroomOut

class EnrollmentBase(BaseModel):
    enrollment_date: Optional[date] = None
    enrollment_status: str = "ACTIVE"  # "ACTIVE", "WITHDRAWN", "TRANSFERRED", "COMPLETED"
    is_audit_only: bool = False
    requires_accommodation: bool = False

class EnrollmentCreate(BaseModel):
    """Schema for creating a new enrollment"""
    student_id: str  # UUID as string from frontend
    classroom_id: str  # UUID as string from frontend
    enrollment_date: Optional[date] = None
    enrollment_status: str = "ACTIVE"
    is_audit_only: bool = False
    requires_accommodation: bool = False

class EnrollmentUpdate(BaseModel):
    """Schema for updating an enrollment"""
    enrollment_status: Optional[str] = None
    withdrawal_date: Optional[date] = None
    withdrawal_reason: Optional[str] = None
    is_audit_only: Optional[bool] = None
    requires_accommodation: Optional[bool] = None

class EnrollmentOut(EnrollmentBase):
    """Schema for enrollment output - matches frontend expectations"""
    id: UUID
    student_id: UUID
    classroom_id: UUID
    enrollment_date: date
    withdrawal_date: Optional[date] = None
    withdrawal_reason: Optional[str] = None
    enrolled_by: Optional[UUID] = None
    is_active: bool

    class Config:
        from_attributes = True

class EnrollmentWithDetails(EnrollmentOut):
    """Extended enrollment schema with relationship data"""
    student: Optional[StudentEnrollmentInfo] = None
    classroom: Optional[ClassroomOut] = None

    class Config:
        from_attributes = True

# For bulk operations (Phase 2)
class BulkEnrollmentCreate(BaseModel):
    """Schema for bulk enrollment operations"""
    student_ids: List[str]
    classroom_id: str
    enrollment_date: Optional[date] = None
    
class BulkEnrollmentByGrade(BaseModel):
    """Schema for bulk enrollment by grade level"""
    grade_level: str
    classroom_ids: List[str]
    academic_year_id: str

class StudentTransfer(BaseModel):
    """Schema for student transfer operations"""
    from_classroom_id: str
    to_classroom_id: str
    transfer_date: Optional[date] = None
    transfer_reason: Optional[str] = None

class HomeroomEnrollment(BaseModel):
    """Schema for homeroom enrollment (auto-enrolls in grade-level core subjects)"""
    homeroom_classroom_id: str
    academic_year_id: str

# For classroom rosters
class ClassroomRosterStudent(BaseModel):
    """Student info for classroom rosters"""
    id: UUID
    student_id: Optional[str]
    first_name: str
    last_name: str
    enrollment_id: UUID
    enrollment_date: date
    enrollment_status: str
    is_active: bool
    requires_accommodation: bool

    class Config:
        from_attributes = True