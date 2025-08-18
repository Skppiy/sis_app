# =============================================================================
# 1. backend/app/schemas/enrollment.py - REPLACE ENTIRE FILE
# =============================================================================

from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List
from uuid import UUID

class EnrollmentBase(BaseModel):
    enrollment_date: Optional[date] = None
    enrollment_status: str = "ACTIVE"
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
    is_active: bool
    created_at: datetime
    updated_at: datetime
    enrollment_date: Optional[date] = None
    withdrawal_date: Optional[date] = None
    withdrawal_reason: Optional[str] = None
    enrolled_by: Optional[UUID] = None
    school_year_id: Optional[UUID] = None

    class Config:
        from_attributes = True

class EnrollmentWithDetails(EnrollmentOut):
    """Extended enrollment schema with relationship data"""
    student_name: Optional[str] = None
    classroom_name: Optional[str] = None

    class Config:
        from_attributes = True

# For classroom rosters
class ClassroomRosterStudent(BaseModel):
    """Student info for classroom rosters"""
    id: UUID
    student_id: Optional[str]
    first_name: str
    last_name: str
    enrollment_id: UUID
    enrollment_date: Optional[date]
    enrollment_status: str
    is_active: bool
    requires_accommodation: bool = False

    class Config:
        from_attributes = True