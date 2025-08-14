# backend/app/routers/subjects.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from ..deps import get_db, require_admin, get_current_user
from ..models.subject import Subject
from ..schemas.subject import SubjectCreate, SubjectOut, SubjectUpdate

router = APIRouter(prefix="/subjects", tags=["subjects"])

@router.get("", response_model=List[SubjectOut])
async def list_subjects(
    grade_band: Optional[str] = None,  # "elementary", "middle"
    subject_type: Optional[str] = None,  # "CORE", "ENRICHMENT", "SPECIAL"
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get subjects with optional filtering"""
    query = select(Subject).order_by(Subject.name)
    
    if grade_band == "elementary":
        query = query.where(Subject.applies_to_elementary == True)
    elif grade_band == "middle":
        query = query.where(Subject.applies_to_middle == True)
    
    if subject_type:
        query = query.where(Subject.subject_type == subject_type.upper())
    
    result = await session.execute(query)
    return result.scalars().all()

@router.get("/core", response_model=List[SubjectOut])
async def get_core_subjects(
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get system core subjects that cannot be deleted"""
    core_subjects = Subject.get_core_subjects(session)
    return core_subjects

@router.post("", response_model=SubjectOut, status_code=status.HTTP_201_CREATED)
async def create_subject(
    payload: SubjectCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Create a new subject"""
    # Check for duplicate code
    existing = await session.execute(select(Subject).where(Subject.code == payload.code.upper()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Subject code already exists")
    
    subject = Subject(
        name=payload.name,
        code=payload.code.upper(),
        subject_type=payload.subject_type.upper(),
        applies_to_elementary=payload.applies_to_elementary,
        applies_to_middle=payload.applies_to_middle,
        is_homeroom_default=payload.is_homeroom_default,
        requires_specialist=payload.requires_specialist,
        allows_cross_grade=payload.allows_cross_grade,
        is_system_core=False,  # Admin-created subjects are never system core
        created_by_admin=True,
    )
    
    session.add(subject)
    await session.commit()
    await session.refresh(subject)
    return subject

@router.patch("/{subject_id}", response_model=SubjectOut)
async def update_subject(
    subject_id: str,
    payload: SubjectUpdate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Update a subject (cannot modify system core subjects significantly)"""
    from uuid import UUID
    
    subject = await session.get(Subject, UUID(subject_id))
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Prevent major changes to system core subjects
    if subject.is_system_core:
        # Only allow name changes for system subjects
        if payload.name:
            subject.name = payload.name
    else:
        # Full updates for admin-created subjects
        if payload.name:
            subject.name = payload.name
        if payload.subject_type:
            subject.subject_type = payload.subject_type.upper()
        if payload.applies_to_elementary is not None:
            subject.applies_to_elementary = payload.applies_to_elementary
        if payload.applies_to_middle is not None:
            subject.applies_to_middle = payload.applies_to_middle
        if payload.is_homeroom_default is not None:
            subject.is_homeroom_default = payload.is_homeroom_default
        if payload.requires_specialist is not None:
            subject.requires_specialist = payload.requires_specialist
        if payload.allows_cross_grade is not None:
            subject.allows_cross_grade = payload.allows_cross_grade
    
    await session.commit()
    await session.refresh(subject)
    return subject

@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Delete a subject (cannot delete system core subjects)"""
    from uuid import UUID
    
    subject = await session.get(Subject, UUID(subject_id))
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    if subject.is_system_core:
        raise HTTPException(status_code=400, detail="Cannot delete system core subjects")
    
    # Check if subject is in use
    from ..models.classroom import Classroom
    classrooms_using = await session.execute(
        select(func.count(Classroom.id)).where(Classroom.subject_id == subject.id)
    )
    if classrooms_using.scalar() > 0:
        raise HTTPException(status_code=400, detail="Cannot delete subject that is assigned to classrooms")
    
    await session.delete(subject)
    await session.commit()