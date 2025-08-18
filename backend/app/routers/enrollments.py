# =============================================================================
# 2. backend/app/routers/enrollments.py - REPLACE ENTIRE FILE
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import joinedload
from typing import List, Optional
from uuid import UUID
from datetime import date

from ..deps import get_db, get_current_user, require_admin
from ..models.enrollment import Enrollment
from ..models.student import Student
from ..models.classroom import Classroom
from ..schemas.enrollment import EnrollmentCreate, EnrollmentOut, EnrollmentUpdate, EnrollmentWithDetails

router = APIRouter(tags=["enrollments"])

@router.get("", response_model=List[EnrollmentOut])
async def list_enrollments(
    student_id: Optional[str] = Query(None, description="Filter by student ID"),
    classroom_id: Optional[str] = Query(None, description="Filter by classroom ID"),
    is_active: Optional[bool] = Query(True, description="Filter by active status"),
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """List enrollments with filtering"""
    try:
        query = select(Enrollment)
        
        if student_id:
            query = query.where(Enrollment.student_id == UUID(student_id))
        
        if classroom_id:
            query = query.where(Enrollment.classroom_id == UUID(classroom_id))
        
        if is_active is not None:
            query = query.where(Enrollment.is_active == is_active)
        
        query = query.order_by(Enrollment.created_at.desc())
        
        result = await session.execute(query)
        enrollments = result.scalars().all()
        
        return enrollments
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get enrollments: {str(e)}")

@router.get("/{enrollment_id}", response_model=EnrollmentWithDetails)
async def get_enrollment(
    enrollment_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get a specific enrollment with details"""
    try:
        query = select(Enrollment).options(
            joinedload(Enrollment.student),
            joinedload(Enrollment.classroom)
        ).where(Enrollment.id == UUID(enrollment_id))
        
        result = await session.execute(query)
        enrollment = result.scalar_one_or_none()
        
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Add computed fields
        enrollment.student_name = enrollment.full_name
        enrollment.classroom_name = enrollment.classroom_name
        
        return enrollment
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get enrollment: {str(e)}")

@router.post("", response_model=EnrollmentOut, status_code=status.HTTP_201_CREATED)
async def create_enrollment(
    payload: EnrollmentCreate,
    session: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Create a new enrollment with validation"""
    try:
        # Validate student exists
        student = await session.get(Student, UUID(payload.student_id))
        if not student:
            raise HTTPException(status_code=400, detail="Student not found")
        
        # Validate classroom exists
        classroom = await session.get(Classroom, UUID(payload.classroom_id))
        if not classroom:
            raise HTTPException(status_code=400, detail="Classroom not found")
        
        # Check for duplicate enrollment
        existing = await session.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.student_id == UUID(payload.student_id),
                    Enrollment.classroom_id == UUID(payload.classroom_id),
                    Enrollment.is_active == True
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Student already enrolled in this classroom")
        
        # Check classroom capacity if set
        if classroom.max_students:
            current_count = await session.execute(
                select(func.count(Enrollment.id)).where(
                    and_(
                        Enrollment.classroom_id == UUID(payload.classroom_id),
                        Enrollment.is_active == True
                    )
                )
            )
            count = current_count.scalar()
            if count >= classroom.max_students:
                raise HTTPException(status_code=400, detail=f"Classroom is at capacity ({classroom.max_students} students)")
        
        # Create enrollment
        enrollment = Enrollment(
            student_id=UUID(payload.student_id),
            classroom_id=UUID(payload.classroom_id),
            enrollment_date=payload.enrollment_date or date.today(),
            enrollment_status=payload.enrollment_status,
            is_audit_only=payload.is_audit_only,
            requires_accommodation=payload.requires_accommodation,
            enrolled_by=current_user.id,
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

@router.patch("/{enrollment_id}", response_model=EnrollmentOut)
async def update_enrollment(
    enrollment_id: str,
    payload: EnrollmentUpdate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Update an enrollment"""
    try:
        enrollment = await session.get(Enrollment, UUID(enrollment_id))
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Update fields
        if payload.enrollment_status is not None:
            enrollment.enrollment_status = payload.enrollment_status
            
            # Auto-set withdrawal date and status
            if payload.enrollment_status in ["WITHDRAWN", "TRANSFERRED", "COMPLETED"]:
                enrollment.is_active = False
                if not enrollment.withdrawal_date:
                    enrollment.withdrawal_date = date.today()
            elif payload.enrollment_status == "ACTIVE":
                enrollment.is_active = True
                enrollment.withdrawal_date = None
        
        if payload.withdrawal_date is not None:
            enrollment.withdrawal_date = payload.withdrawal_date
        
        if payload.withdrawal_reason is not None:
            enrollment.withdrawal_reason = payload.withdrawal_reason
        
        if payload.is_audit_only is not None:
            enrollment.is_audit_only = payload.is_audit_only
        
        if payload.requires_accommodation is not None:
            enrollment.requires_accommodation = payload.requires_accommodation
        
        await session.commit()
        await session.refresh(enrollment)
        
        return enrollment
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update enrollment: {str(e)}")

@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_enrollment(
    enrollment_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Remove an enrollment (soft delete)"""
    try:
        enrollment = await session.get(Enrollment, UUID(enrollment_id))
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Soft delete
        enrollment.withdraw(reason="ADMIN_REMOVAL")
        
        await session.commit()
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete enrollment: {str(e)}")