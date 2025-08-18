# backend/app/routers/enrollments.py
# Complete enrollment router

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List
from uuid import UUID

from ..deps import get_db, get_current_user
from ..models.enrollment import Enrollment
from ..models.student import Student
from ..models.classroom import Classroom
from ..schemas.enrollment import EnrollmentCreate, EnrollmentOut

router = APIRouter(tags=["enrollments"])

@router.post("", response_model=EnrollmentOut)
async def create_enrollment(
    payload: EnrollmentCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Create a new enrollment"""
    try:
        # Check if student exists
        student = await session.get(Student, UUID(payload.student_id))
        if not student:
            raise HTTPException(status_code=400, detail="Student not found")
        
        # Check if classroom exists
        classroom = await session.get(Classroom, UUID(payload.classroom_id))
        if not classroom:
            raise HTTPException(status_code=400, detail="Classroom not found")
        
        # Check for duplicate enrollment
        existing = await session.execute(
            select(Enrollment).where(
                Enrollment.student_id == UUID(payload.student_id),
                Enrollment.classroom_id == UUID(payload.classroom_id),
                Enrollment.is_active == True
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Student already enrolled in this classroom")
        
        # Create enrollment
        enrollment = Enrollment(
            student_id=UUID(payload.student_id),
            classroom_id=UUID(payload.classroom_id),
            is_active=True
        )
        
        session.add(enrollment)
        await session.commit()
        await session.refresh(enrollment)
        
        return enrollment
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create enrollment: {str(e)}")

@router.get("", response_model=List[EnrollmentOut])
async def list_enrollments(
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """List all enrollments"""
    try:
        result = await session.execute(
            select(Enrollment).where(Enrollment.is_active == True)
        )
        enrollments = result.scalars().all()
        return enrollments
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get enrollments: {str(e)}")

@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_enrollment(
    enrollment_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Remove an enrollment"""
    try:
        enrollment = await session.get(Enrollment, UUID(enrollment_id))
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        enrollment.is_active = False
        await session.commit()
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete enrollment: {str(e)}")