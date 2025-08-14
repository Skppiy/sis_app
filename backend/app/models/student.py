# Update to existing student.py model
# backend/app/models/student.py

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID
from datetime import date
from typing import Optional
import uuid
from .base import Base

class Student(Base):
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, unique=True)
    
    # Basic Demographics
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    student_id: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, unique=True)  # District ID
    
    # Entry Information
    entry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    entry_grade_level: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # Grade when first entered district
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    academic_records = relationship("StudentAcademicRecord", back_populates="student", cascade="all, delete-orphan")
    special_needs = relationship("StudentSpecialNeed", back_populates="student", cascade="all, delete-orphan")
    parent_relationships = relationship("ParentStudentRelationship", back_populates="student", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Student {self.first_name} {self.last_name}>"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def current_grade(self):
        """Get student's current grade level from active academic record"""
        from sqlalchemy.orm import sessionmaker
        # Note: In real usage, session would be passed as parameter
        current_record = next((ar for ar in self.academic_records 
                             if ar.is_active and ar.academic_year.is_active), None)
        return current_record.grade_level if current_record else None
    
    def get_active_special_needs(self):
        """Get all currently active special needs for this student"""
        return [sn for sn in self.special_needs if sn.is_active]
