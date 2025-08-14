# backend/app/models/classroom.py

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base

class Classroom(Base):
    __tablename__ = "classrooms"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Flexible Admin-Created Naming
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # "7th - English - Mrs. Garcia" or "Advanced Math 1"
    
    # Academic Structure
    subject_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id"), nullable=False)
    grade_level: Mapped[str] = mapped_column(String(10), nullable=False)  # "K", "1", "2"..."8", "MULTI"
    classroom_type: Mapped[str] = mapped_column(String(20), nullable=False, default="CORE")  # "CORE", "ENRICHMENT", "SPECIAL"
    
    # Academic Year Association
    academic_year_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("academic_years.id"), nullable=False)
    
    # Optional Capacity Limit
    max_students: Mapped[int] = mapped_column(Integer, nullable=True)
    
    # Relationships
    subject = relationship("Subject", back_populates="classrooms")
    academic_year = relationship("AcademicYear", back_populates="classrooms")
    teacher_assignments = relationship("ClassroomTeacherAssignment", back_populates="classroom", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="classroom", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Classroom {self.name} - {self.grade_level} {self.subject.name if self.subject else 'Unknown Subject'}>"
    
    @property
    def primary_teacher(self):
        """Get the primary teacher for this classroom"""
        primary_assignment = next((ta for ta in self.teacher_assignments 
                                 if ta.role_name.lower() == "primary teacher" and ta.is_active), None)
        return primary_assignment.teacher if primary_assignment else None
    
    @property
    def all_active_teachers(self):
        """Get all active teachers assigned to this classroom"""
        return [ta.teacher for ta in self.teacher_assignments if ta.is_active]
    
    def get_enrollment_count(self):
        """Get current number of enrolled students"""
        return len([e for e in self.enrollments if e.is_active])


