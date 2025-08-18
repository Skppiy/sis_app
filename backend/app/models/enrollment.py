# backend/app/models/enrollment.py
# COMPLETE MODEL - Matches your actual database from migration 99f0476a11b6

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Date, Boolean, ForeignKey, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from datetime import date, datetime
from typing import Optional
import uuid
from .base import Base

class Enrollment(Base):
    """Student enrollment in specific classroom sections"""
    __tablename__ = "enrollments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    classroom_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classrooms.id"), nullable=False)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    
    # Basic status from your original migration
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    
    # Timestamps from your original migration  
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
    
    # School year ID from later migration (optional)
    school_year_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    
    # Extended enrollment fields for Phase A.2 (these will be added by migration later)
    enrollment_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, default=date.today)
    withdrawal_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    enrollment_status: Mapped[str] = mapped_column(String(20), default="ACTIVE")  # "ACTIVE", "WITHDRAWN", "TRANSFERRED", "COMPLETED"
    withdrawal_reason: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # "MOVED", "SCHEDULE_CHANGE", "PROMOTED"
    
    # Academic considerations
    is_audit_only: Mapped[bool] = mapped_column(Boolean, default=False)  # Student auditing, not for grade
    requires_accommodation: Mapped[bool] = mapped_column(Boolean, default=False)  # IEP/504 accommodations needed
    
    # Administrative tracking
    enrolled_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relationships
    student = relationship("Student", back_populates="enrollments")
    classroom = relationship("Classroom", back_populates="enrollments")
    enrolled_by_user = relationship("User", foreign_keys=[enrolled_by])
    
    def __repr__(self):
        student_name = f"{self.student.first_name} {self.student.last_name}" if self.student else "Unknown Student"
        classroom_name = self.classroom.name if self.classroom else "Unknown Classroom"
        return f"<Enrollment {student_name} in {classroom_name} ({self.enrollment_status})>"
    
    @property
    def full_name(self):
        """Get student's full name"""
        return f"{self.student.first_name} {self.student.last_name}" if self.student else "Unknown Student"
    
    @property
    def classroom_name(self):
        """Get classroom name"""
        return self.classroom.name if self.classroom else "Unknown Classroom"
    
    @property
    def is_currently_active(self):
        """Check if enrollment is currently active"""
        return self.is_active and self.enrollment_status == "ACTIVE"
    
    def withdraw(self, reason=None, withdrawal_date=None):
        """Withdraw student from classroom"""
        self.is_active = False
        self.enrollment_status = "WITHDRAWN"
        self.withdrawal_date = withdrawal_date or date.today()
        self.withdrawal_reason = reason
    
    def reactivate(self):
        """Reactivate withdrawn enrollment"""
        self.is_active = True
        self.enrollment_status = "ACTIVE" 
        self.withdrawal_date = None
        self.withdrawal_reason = None
    
    @classmethod
    def get_student_enrollments(cls, session, student_id, academic_year_id=None, active_only=True):
        """Get all enrollments for a student"""
        from sqlalchemy import select
        
        query = select(cls).where(cls.student_id == student_id)
        
        if academic_year_id:
            from .classroom import Classroom
            query = query.join(Classroom).where(Classroom.academic_year_id == academic_year_id)
        
        if active_only:
            query = query.where(cls.is_active == True)
        
        return session.scalars(query).all()
    
    @classmethod
    def get_classroom_enrollment(cls, session, classroom_id, active_only=True):
        """Get all students enrolled in a specific classroom"""
        from sqlalchemy import select
        
        query = select(cls).where(cls.classroom_id == classroom_id)
        
        if active_only:
            query = query.where(cls.is_active == True)
        
        return session.scalars(query).all()
    
    @classmethod
    def check_enrollment_exists(cls, session, student_id, classroom_id, active_only=True):
        """Check if a specific enrollment already exists"""
        from sqlalchemy import select
        
        query = select(cls).where(
            cls.student_id == student_id,
            cls.classroom_id == classroom_id
        )
        
        if active_only:
            query = query.where(cls.is_active == True)
        
        return session.scalar(query) is not None
    
    @classmethod
    def get_enrollments_by_status(cls, session, status="ACTIVE"):
        """Get all enrollments with a specific status"""
        from sqlalchemy import select
        
        query = select(cls).where(cls.enrollment_status == status)
        return session.scalars(query).all()
    
    def get_enrollment_duration(self):
        """Calculate how long student has been enrolled"""
        if not self.enrollment_date:
            return None
        
        end_date = self.withdrawal_date or date.today()
        return (end_date - self.enrollment_date).days
    
    def to_dict(self):
        """Convert enrollment to dictionary for API responses"""
        return {
            "id": str(self.id),
            "student_id": str(self.student_id),
            "classroom_id": str(self.classroom_id),
            "enrollment_date": self.enrollment_date.isoformat() if self.enrollment_date else None,
            "withdrawal_date": self.withdrawal_date.isoformat() if self.withdrawal_date else None,
            "enrollment_status": self.enrollment_status,
            "withdrawal_reason": self.withdrawal_reason,
            "is_active": self.is_active,
            "is_audit_only": self.is_audit_only,
            "requires_accommodation": self.requires_accommodation,
            "enrolled_by": str(self.enrolled_by) if self.enrolled_by else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }