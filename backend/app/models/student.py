# backend/app/models/student.py
# UPDATED TO FIX RELATIONSHIP ISSUES

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Date, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from datetime import date, datetime
from typing import Optional, List
import uuid
from .base import Base

class Student(Base):
    __tablename__ = "students"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name: Mapped[str] = mapped_column(String(50), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, unique=True)
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Student ID (like student number)
    student_id: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, unique=True)
    
    # Entry information
    entry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    entry_grade_level: Mapped[str] = mapped_column(String(10), nullable=False)  # "K", "1", "2", etc.
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now())

    # FIXED RELATIONSHIPS - Using back_populates instead of backref
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    academic_records = relationship("StudentAcademicRecord", back_populates="student", cascade="all, delete-orphan")
    special_needs = relationship("StudentSpecialNeed", back_populates="student", cascade="all, delete-orphan")
    parent_relationships = relationship("ParentStudentRelationship", back_populates="student", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Student {self.first_name} {self.last_name} ({self.student_id})>"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def current_grade(self):
        """Get current grade level from active academic record"""
        for record in self.academic_records:
            if record.is_active:
                return record.grade_level
        return self.entry_grade_level