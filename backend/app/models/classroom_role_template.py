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


# backend/app/models/classroom_teacher_assignment.py

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Boolean, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import date
import uuid
from .base import Base

class ClassroomTeacherAssignment(Base):
    __tablename__ = "classroom_teacher_assignments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    classroom_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("classrooms.id"), nullable=False)
    teacher_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Admin-Defined Role (no hardcoded values)
    role_name: Mapped[str] = mapped_column(String(50), nullable=False)  # "Primary Teacher", "Student Teacher", "Co-Teacher", "Aide"
    
    # Granular Permissions
    can_view_grades: Mapped[bool] = mapped_column(Boolean, default=True)
    can_modify_grades: Mapped[bool] = mapped_column(Boolean, default=False)
    can_take_attendance: Mapped[bool] = mapped_column(Boolean, default=False)
    can_view_parent_contact: Mapped[bool] = mapped_column(Boolean, default=False)
    can_create_assignments: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Time-based Assignment
    start_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    end_date: Mapped[date] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    classroom = relationship("Classroom", back_populates="teacher_assignments")
    teacher = relationship("User")  # Teacher user
    
    def __repr__(self):
        return f"<ClassroomTeacherAssignment {self.teacher.first_name if self.teacher else 'Unknown'} - {self.role_name} in {self.classroom.name if self.classroom else 'Unknown Classroom'}>"
    
    @classmethod
    def get_teacher_classrooms(cls, session, teacher_user_id, academic_year_id):
        """Get all classrooms a teacher is assigned to in a given academic year"""
        return session.query(cls).join(Classroom).filter(
            cls.teacher_user_id == teacher_user_id,
            cls.is_active == True,
            Classroom.academic_year_id == academic_year_id
        ).all()
    
    def has_permission(self, permission_name):
        """Check if this assignment has a specific permission"""
        return getattr(self, f"can_{permission_name}", False)


# backend/app/models/teacher_role_template.py

from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base

class TeacherRoleTemplate(Base):
    """Admin-created templates for common teacher role permissions"""
    __tablename__ = "teacher_role_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role_name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)  # "Primary Teacher", "Student Teacher"
    description: Mapped[str] = mapped_column(String(200), nullable=True)
    
    # Default permissions for this role (admin can override per assignment)
    default_can_view_grades: Mapped[bool] = mapped_column(Boolean, default=True)
    default_can_modify_grades: Mapped[bool] = mapped_column(Boolean, default=False)
    default_can_take_attendance: Mapped[bool] = mapped_column(Boolean, default=False)
    default_can_view_parent_contact: Mapped[bool] = mapped_column(Boolean, default=False)
    default_can_create_assignments: Mapped[bool] = mapped_column(Boolean, default=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    def __repr__(self):
        return f"<TeacherRoleTemplate {self.role_name}>"
    
    def get_default_permissions(self):
        """Return dict of default permissions for this role"""
        return {
            'can_view_grades': self.default_can_view_grades,
            'can_modify_grades': self.default_can_modify_grades,
            'can_take_attendance': self.default_can_take_attendance,
            'can_view_parent_contact': self.default_can_view_parent_contact,
            'can_create_assignments': self.default_can_create_assignments,
        }