# backend/app/models/school.py - Updated with new relationships

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
import uuid
from .base import Base

class School(Base):
    __tablename__ = "schools"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str | None] = mapped_column(String, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    state: Mapped[str | None] = mapped_column(String, nullable=True)
    zip_code: Mapped[str | None] = mapped_column(String, nullable=True)
    tz: Mapped[str] = mapped_column(String, nullable=False)
    
    # Relationships
    user_roles = relationship("UserRole", back_populates="school", cascade="all, delete-orphan")
    rooms = relationship("Room", back_populates="school", cascade="all, delete-orphan")
    special_needs_tags = relationship("SpecialNeedsTagLibrary", back_populates="school", cascade="all, delete-orphan")


# backend/app/models/user.py - Updated with parent profile relationship

from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone

from .base import Base

class User(Base):
    __tablename__ = 'users'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime(timezone=True))

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    user_roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    role_preference = relationship("UserRolePreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    parent_profile = relationship("Parent", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def has_role(self, role_name, school_id=None):
        """Check if user has a specific role, optionally at a specific school"""
        for user_role in self.user_roles:
            if user_role.role.lower() == role_name.lower() and user_role.is_active:
                if school_id is None or user_role.school_id == school_id:
                    return True
        return False
    
    def is_parent(self):
        """Check if user has a parent profile"""
        return self.parent_profile is not None
    
    def is_teacher(self, school_id=None):
        """Check if user has teacher role"""
        return self.has_role("teacher", school_id)
    
    def is_admin(self, school_id=None):
        """Check if user has any admin role"""
        admin_roles = ["admin_principal", "admin_vp", "admin_dean", "admin_staff"]
        return any(self.has_role(role, school_id) for role in admin_roles)