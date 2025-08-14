# backend/app/routers/students.py

from fastapi import APIRouter, Depends, HTTPException, Query, status
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload
from typing import List, Optional

from ..deps import get_db, require_admin, get_current_user
from ..models.student import Student
from ..models.school import School
from ..models.classroom import Classroom
from ..models.enrollment import Enrollment
from ..models.academic_year import AcademicYear
from ..schemas.student import StudentCreate, StudentOut, StudentUpdate, StudentWithDetails

router = APIRouter(prefix="/students", tags=["students"])

@router.get("", response_model=List[StudentOut])
async def list_students(
    school_id: Optional[str] = Query(default=None),
    grade_level: Optional[str] = Query(default=None),
    academic_year_id: Optional[str] = Query(default=None),
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get students with optional filtering"""
    query = select(Student).where(Student.is_active == True).order_by(Student.last_name, Student.first_name)
    
    if school_id:
        try:
            school_uuid = uuid.UUID(str(school_id))
            # Note: Student model may not have school_id directly
            # This might need to be joined through enrollments
            pass  # Remove school filter for now
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid school_id format")
    
    if grade_level:
        # Filter by current grade level through academic records
        pass  # Implement when needed
    
    result = await session.execute(query)
    students = result.scalars().all()
    return students

@router.get("/{student_id}", response_model=StudentWithDetails)
async def get_student(
    student_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get detailed student information"""
    try:
        student_uuid = uuid.UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student ID format")
    
    result = await session.execute(
        select(Student)
        .options(
            joinedload(Student.special_needs),
            joinedload(Student.enrollments),
            joinedload(Student.academic_records)
        )
        .where(Student.id == student_uuid)
    )
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return student

@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
async def create_student(
    payload: StudentCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Create a new student"""
    
    # Check if student ID is unique (if provided)
    if payload.student_id:
        existing = await session.execute(
            select(Student).where(Student.student_id == payload.student_id)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Student ID already exists")
    
    # Check if email is unique (if provided)
    if payload.email:
        existing = await session.execute(
            select(Student).where(Student.email == payload.email)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already exists")
    
    student = Student(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        date_of_birth=payload.date_of_birth,
        student_id=payload.student_id,
        entry_date=payload.entry_date,
        entry_grade_level=payload.entry_grade_level
    )
    
    session.add(student)
    await session.commit()
    await session.refresh(student)
    return student

@router.patch("/{student_id}", response_model=StudentOut)
async def update_student(
    student_id: str,
    payload: StudentUpdate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Update a student"""
    try:
        student_uuid = uuid.UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student ID format")
    
    student = await session.get(Student, student_uuid)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Check if new student ID is unique (if changing)
    if payload.student_id and payload.student_id != student.student_id:
        existing = await session.execute(
            select(Student).where(
                and_(
                    Student.student_id == payload.student_id,
                    Student.id != student_uuid
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Student ID already exists")
    
    # Check if new email is unique (if changing)
    if payload.email and payload.email != student.email:
        existing = await session.execute(
            select(Student).where(
                and_(
                    Student.email == payload.email,
                    Student.id != student_uuid
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Email already exists")
    
    # Update fields
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)
    
    await session.commit()
    await session.refresh(student)
    return student

@router.delete("/{student_id}")
async def delete_student(
    student_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Soft delete a student (set is_active=False)"""
    try:
        student_uuid = uuid.UUID(student_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student ID format")
    
    student = await session.get(Student, student_uuid)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Soft delete - set inactive instead of hard delete
    student.is_active = False
    await session.commit()
    
    return {"message": "Student deactivated successfully"}

@router.post("/{student_id}/enroll", response_model=dict)
async def enroll_student_in_classroom(
    student_id: str,
    classroom_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Enroll a student in a classroom"""
    try:
        student_uuid = uuid.UUID(student_id)
        classroom_uuid = uuid.UUID(classroom_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    
    # Verify student exists
    student = await session.get(Student, student_uuid)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Verify classroom exists
    classroom = await session.get(Classroom, classroom_uuid)
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Check if already enrolled
    existing = await session.execute(
        select(Enrollment).where(
            and_(
                Enrollment.student_id == student_uuid,
                Enrollment.classroom_id == classroom_uuid,
                Enrollment.is_active == True
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Student already enrolled in this classroom")
    
    # Create enrollment
    from datetime import date
    enrollment = Enrollment(
        student_id=student_uuid,
        classroom_id=classroom_uuid,
        enrollment_date=date.today(),
        enrollment_status="ACTIVE"
    )
    
    session.add(enrollment)
    await session.commit()
    
    return {"message": "Student enrolled successfully"}