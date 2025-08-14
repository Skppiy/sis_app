# backend/app/models/enrollment.py

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Date, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import date
from typing import Optional
import uuid
from .base import Base

class Enrollment(Base):
    """Student enrollment in specific classroom sections"""
    __tablename__ = "enrollments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    classroom_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classrooms.id"), nullable=False)
    
    # Enrollment Timeline
    enrollment_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    withdrawal_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Enrollment Details
    enrollment_status: Mapped[str] = mapped_column(String(20), default="ACTIVE")  # "ACTIVE", "WITHDRAWN", "TRANSFERRED", "COMPLETED"
    withdrawal_reason: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # "MOVED", "SCHEDULE_CHANGE", "PROMOTED"
    
    # Academic Considerations
    is_audit_only: Mapped[bool] = mapped_column(Boolean, default=False)  # Student auditing, not for grade
    requires_accommodation: Mapped[bool] = mapped_column(Boolean, default=False)  # IEP/504 accommodations needed
    
    # Administrative
    enrolled_by: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    student = relationship("Student", back_populates="enrollments")
    classroom = relationship("Classroom", back_populates="enrollments")
    enrolled_by_user = relationship("User")
    
    def __repr__(self):
        student_name = self.student.full_name if self.student else "Unknown Student"
        classroom_name = self.classroom.name if self.classroom else "Unknown Classroom"
        return f"<Enrollment {student_name} in {classroom_name} ({self.enrollment_status})>"
    
    @classmethod
    def get_student_enrollments(cls, session, student_id, academic_year_id=None, active_only=True):
        """Get all enrollments for a student"""
        query = session.query(cls).filter(cls.student_id == student_id)
        
        if academic_year_id:
            from .classroom import Classroom
            query = query.join(Classroom).filter(Classroom.academic_year_id == academic_year_id)
        
        if active_only:
            query = query.filter(cls.is_active == True)
        
        return query.all()
    
    @classmethod
    def get_classroom_enrollment(cls, session, classroom_id, active_only=True):
        """Get all students enrolled in a specific classroom"""
        query = session.query(cls).filter(cls.classroom_id == classroom_id)
        if active_only:
            query = query.filter(cls.is_active == True, cls.enrollment_status == "ACTIVE")
        return query.all()
    
    @classmethod 
    def get_teacher_students(cls, session, teacher_user_id, academic_year_id):
        """Get all students assigned to a teacher across all their classrooms"""
        from .classroom import Classroom
        from .classroom_teacher_assignment import ClassroomTeacherAssignment
        
        return session.query(cls).join(Classroom).join(ClassroomTeacherAssignment).filter(
            ClassroomTeacherAssignment.teacher_user_id == teacher_user_id,
            ClassroomTeacherAssignment.is_active == True,
            Classroom.academic_year_id == academic_year_id,
            cls.is_active == True,
            cls.enrollment_status == "ACTIVE"
        ).all()
    
    def withdraw(self, reason=None, withdrawal_date=None):
        """Withdraw student from this enrollment"""
        self.enrollment_status = "WITHDRAWN"
        self.withdrawal_date = withdrawal_date or date.today()
        self.withdrawal_reason = reason
        self.is_active = False
    
    @property
    def is_currently_enrolled(self):
        """Check if student is currently enrolled (active and no withdrawal date)"""
        return (self.is_active and 
                self.enrollment_status == "ACTIVE" and 
                self.withdrawal_date is None)