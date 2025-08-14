# backend/app/routers/classrooms.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import joinedload
from typing import List, Optional
from ..deps import get_db, require_admin, get_current_user
from ..models.classroom import Classroom
from ..models.classroom_teacher_assignment import ClassroomTeacherAssignment
from ..models.academic_year import AcademicYear
from ..models.subject import Subject
from ..schemas.classroom import ClassroomCreate, ClassroomOut, ClassroomUpdate, ClassroomWithDetails

router = APIRouter(tags=["classrooms"])

@router.get("", response_model=List[ClassroomOut])
async def list_classrooms(
    academic_year_id: Optional[str] = None,
    grade_level: Optional[str] = None,
    subject_id: Optional[str] = None,
    teacher_user_id: Optional[str] = None,
    school_id: Optional[str] = None,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get classrooms with optional filtering"""
    query = select(Classroom).options(
        joinedload(Classroom.subject),
        joinedload(Classroom.academic_year),
        joinedload(Classroom.teacher_assignments)
    ).order_by(Classroom.name)
    
    # Default to active academic year if none specified
    if not academic_year_id:
        result = await session.execute(select(AcademicYear).where(AcademicYear.is_active == True))
        active_year = result.scalar_one_or_none()
        if active_year:
            academic_year_id = str(active_year.id)
    
    if academic_year_id:
        from uuid import UUID
        query = query.where(Classroom.academic_year_id == UUID(academic_year_id))
    
    if grade_level:
        query = query.where(Classroom.grade_level == grade_level)
    
    if subject_id:
        from uuid import UUID
        query = query.where(Classroom.subject_id == UUID(subject_id))
    
    if teacher_user_id:
        from uuid import UUID
        query = query.join(ClassroomTeacherAssignment).where(
            and_(
                ClassroomTeacherAssignment.teacher_user_id == UUID(teacher_user_id),
                ClassroomTeacherAssignment.is_active == True
            )
        )
    
    result = await session.execute(query)
    return result.scalars().all()

@router.get("/{classroom_id}", response_model=ClassroomWithDetails)
async def get_classroom(
    classroom_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get detailed classroom information including enrollments and teachers"""
    from uuid import UUID
    
    result = await session.execute(
        select(Classroom)
        .options(
            joinedload(Classroom.subject),
            joinedload(Classroom.academic_year),
            joinedload(Classroom.teacher_assignments),
            joinedload(Classroom.enrollments)
        )
        .where(Classroom.id == UUID(classroom_id))
    )
    classroom = result.scalar_one_or_none()
    
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    return classroom

@router.post("", response_model=ClassroomOut, status_code=status.HTTP_201_CREATED)
async def create_classroom(
    payload: ClassroomCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Create a new classroom"""
    from uuid import UUID
    
    # Validate subject exists
    subject = await session.get(Subject, UUID(payload.subject_id))
    if not subject:
        raise HTTPException(status_code=400, detail="Subject not found")
    
    # Validate academic year exists
    academic_year = await session.get(AcademicYear, UUID(payload.academic_year_id))
    if not academic_year:
        raise HTTPException(status_code=400, detail="Academic year not found")
    
    classroom = Classroom(
        name=payload.name,
        subject_id=UUID(payload.subject_id),
        academic_year_id=UUID(payload.academic_year_id),
        grade_level=payload.grade_level,
        classroom_type=payload.classroom_type,
        max_students=payload.max_students
    )
    
    session.add(classroom)
    await session.commit()
    await session.refresh(classroom)
    return classroom

@router.patch("/{classroom_id}", response_model=ClassroomOut)
async def update_classroom(
    classroom_id: str,
    payload: ClassroomUpdate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Update a classroom"""
    from uuid import UUID
    
    classroom = await session.get(Classroom, UUID(classroom_id))
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Update fields
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(classroom, field, value)
    
    await session.commit()
    await session.refresh(classroom)
    return classroom

@router.delete("/{classroom_id}")
async def delete_classroom(
    classroom_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Delete a classroom"""
    from uuid import UUID
    
    classroom = await session.get(Classroom, UUID(classroom_id))
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Check if classroom has enrollments
    result = await session.execute(
        select(func.count()).select_from(
            select(1).where(
                and_(
                    ClassroomTeacherAssignment.classroom_id == classroom.id,
                    ClassroomTeacherAssignment.is_active == True
                )
            ).subquery()
        )
    )
    
    if result.scalar() > 0:
        raise HTTPException(
            status_code=400, 
            detail="Cannot delete classroom with active teacher assignments"
        )
    
    await session.delete(classroom)
    await session.commit()
    return {"message": "Classroom deleted successfully"}