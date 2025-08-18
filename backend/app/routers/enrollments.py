# backend/app/routers/enrollments.py
# Complete enrollment router following patterns from students.py and classrooms.py

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import joinedload, selectinload
from typing import List, Optional
import uuid
from uuid import UUID
from datetime import date

from ..deps import get_db, require_admin, get_current_user
from ..models.enrollment import Enrollment
from ..models.student import Student
from ..models.classroom import Classroom
from ..models.academic_year import AcademicYear
from ..schemas.enrollment import (
    EnrollmentCreate, 
    EnrollmentOut, 
    EnrollmentUpdate,
    EnrollmentWithDetails,
    ClassroomRosterStudent,
    BulkEnrollmentCreate,
    StudentTransfer
)

print("🔍 ENROLLMENT ROUTER IS LOADING!")

router = APIRouter(tags=["enrollments"])

@router.get("", response_model=List[EnrollmentOut])
async def list_enrollments(
    student_id: Optional[str] = Query(None, description="Filter by student ID"),
    classroom_id: Optional[str] = Query(None, description="Filter by classroom ID"),
    academic_year_id: Optional[str] = Query(None, description="Filter by academic year"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """List enrollments with filtering - following students.py patterns"""
    try:
        print("🔍 DEBUG: Starting list_enrollments")
        
        query = select(Enrollment).options(
            joinedload(Enrollment.student),
            joinedload(Enrollment.classroom).joinedload(Classroom.academic_year),
            joinedload(Enrollment.classroom).joinedload(Classroom.subject)
        )
        
        # Apply filters
        if student_id:
            query = query.where(Enrollment.student_id == UUID(student_id))
            print(f"🔍 DEBUG: Filtering by student_id: {student_id}")
        
        if classroom_id:
            query = query.where(Enrollment.classroom_id == UUID(classroom_id))
            print(f"🔍 DEBUG: Filtering by classroom_id: {classroom_id}")
        
        if academic_year_id:
            query = query.join(Classroom).where(Classroom.academic_year_id == UUID(academic_year_id))
            print(f"🔍 DEBUG: Filtering by academic_year_id: {academic_year_id}")
        
        if is_active is not None:
            query = query.where(Enrollment.is_active == is_active)
            print(f"🔍 DEBUG: Filtering by is_active: {is_active}")
        
        # Order by enrollment date
        query = query.order_by(Enrollment.enrollment_date.desc())
        
        result = await session.execute(query)
        enrollments = result.scalars().all()
        
        print(f"🔍 DEBUG: Found {len(enrollments)} enrollments")
        return enrollments
        
    except Exception as e:
        print(f"❌ ERROR in list_enrollments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch enrollments")

@router.get("/{enrollment_id}", response_model=EnrollmentWithDetails)
async def get_enrollment(
    enrollment_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get a specific enrollment with full details"""
    try:
        query = select(Enrollment).options(
            joinedload(Enrollment.student),
            joinedload(Enrollment.classroom).joinedload(Classroom.subject),
            joinedload(Enrollment.classroom).joinedload(Classroom.academic_year),
            joinedload(Enrollment.classroom).joinedload(Classroom.room)
        ).where(Enrollment.id == UUID(enrollment_id))
        
        result = await session.execute(query)
        enrollment = result.scalar_one_or_none()
        
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        return enrollment
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR in get_enrollment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch enrollment")

@router.post("", response_model=EnrollmentOut, status_code=status.HTTP_201_CREATED)
async def create_enrollment(
    payload: EnrollmentCreate,
    session: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    """Create a new student enrollment with validation"""
    try:
        print(f"🔍 DEBUG: Creating enrollment - Student: {payload.student_id}, Classroom: {payload.classroom_id}")
        
        # Validate student exists
        student = await session.get(Student, UUID(payload.student_id))
        if not student:
            raise HTTPException(status_code=400, detail="Student not found")
        
        # Validate classroom exists
        classroom_query = select(Classroom).options(
            joinedload(Classroom.academic_year),
            joinedload(Classroom.subject)
        ).where(Classroom.id == UUID(payload.classroom_id))
        
        classroom_result = await session.execute(classroom_query)
        classroom = classroom_result.scalar_one_or_none()
        if not classroom:
            raise HTTPException(status_code=400, detail="Classroom not found")
        
        # VALIDATION 1: Check for duplicate enrollment
        existing_enrollment = await session.execute(
            select(Enrollment).where(
                and_(
                    Enrollment.student_id == UUID(payload.student_id),
                    Enrollment.classroom_id == UUID(payload.classroom_id),
                    Enrollment.is_active == True
                )
            )
        )
        if existing_enrollment.scalar_one_or_none():
            raise HTTPException(
                status_code=400, 
                detail=f"Student is already enrolled in {classroom.name}"
            )
        
        # VALIDATION 2: Check classroom capacity (if set)
        if classroom.max_students:
            current_count = await session.execute(
                select(func.count(Enrollment.id)).where(
                    and_(
                        Enrollment.classroom_id == UUID(payload.classroom_id),
                        Enrollment.is_active == True
                    )
                )
            )
            current_enrollment_count = current_count.scalar()
            
            if current_enrollment_count >= classroom.max_students:
                raise HTTPException(
                    status_code=400,
                    detail=f"Classroom is at capacity ({classroom.max_students} students)"
                )
        
        # VALIDATION 3: Check academic year context (ensure current/active year)
        if not classroom.academic_year.is_active:
            raise HTTPException(
                status_code=400,
                detail="Cannot enroll students in inactive academic year"
            )
        
        # Create enrollment
        enrollment = Enrollment(
            id=uuid.uuid4(),
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
        
        print(f"✅ SUCCESS: Enrolled {student.first_name} {student.last_name} in {classroom.name}")
        return enrollment
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        print(f"❌ ERROR in create_enrollment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create enrollment")

@router.patch("/{enrollment_id}", response_model=EnrollmentOut)
async def update_enrollment(
    enrollment_id: str,
    payload: EnrollmentUpdate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Update an enrollment (status, withdrawal, etc.)"""
    try:
        enrollment = await session.get(Enrollment, UUID(enrollment_id))
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Update fields
        if payload.enrollment_status is not None:
            enrollment.enrollment_status = payload.enrollment_status
            
            # Auto-set withdrawal date if status changed to withdrawn
            if payload.enrollment_status in ["WITHDRAWN", "TRANSFERRED", "COMPLETED"]:
                if not enrollment.withdrawal_date:
                    enrollment.withdrawal_date = date.today()
                enrollment.is_active = False
            elif payload.enrollment_status == "ACTIVE":
                enrollment.withdrawal_date = None
                enrollment.is_active = True
        
        if payload.withdrawal_date is not None:
            enrollment.withdrawal_date = payload.withdrawal_date
            if payload.withdrawal_date and enrollment.enrollment_status == "ACTIVE":
                enrollment.enrollment_status = "WITHDRAWN"
                enrollment.is_active = False
        
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
        print(f"❌ ERROR in update_enrollment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update enrollment")

@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_enrollment(
    enrollment_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Remove an enrollment (soft delete by setting inactive)"""
    try:
        enrollment = await session.get(Enrollment, UUID(enrollment_id))
        if not enrollment:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        # Soft delete - set inactive and withdrawn
        enrollment.is_active = False
        enrollment.enrollment_status = "WITHDRAWN"
        enrollment.withdrawal_date = date.today()
        enrollment.withdrawal_reason = "ADMIN_REMOVAL"
        
        await session.commit()
        
        print(f"✅ SUCCESS: Removed enrollment {enrollment_id}")
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        print(f"❌ ERROR in delete_enrollment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to remove enrollment")

# Frontend Integration Endpoints

@router.get("/students/{student_id}/enrollments", response_model=List[EnrollmentWithDetails])
async def get_student_enrollments(
    student_id: str,
    academic_year_id: Optional[str] = Query(None, description="Filter by academic year"),
    active_only: bool = Query(True, description="Only return active enrollments"),
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get all enrollments for a specific student - Frontend expects this exact endpoint"""
    try:
        print(f"🔍 DEBUG: Getting enrollments for student {student_id}")
        
        query = select(Enrollment).options(
            joinedload(Enrollment.classroom).joinedload(Classroom.subject),
            joinedload(Enrollment.classroom).joinedload(Classroom.academic_year),
            joinedload(Enrollment.classroom).joinedload(Classroom.room)
        ).where(Enrollment.student_id == UUID(student_id))
        
        if academic_year_id:
            query = query.join(Classroom).where(Classroom.academic_year_id == UUID(academic_year_id))
        
        if active_only:
            query = query.where(Enrollment.is_active == True)
        
        query = query.order_by(Enrollment.enrollment_date.desc())
        
        result = await session.execute(query)
        enrollments = result.scalars().all()
        
        print(f"🔍 DEBUG: Found {len(enrollments)} enrollments for student")
        return enrollments
        
    except Exception as e:
        print(f"❌ ERROR in get_student_enrollments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch student enrollments")

@router.get("/classrooms/{classroom_id}/students", response_model=List[ClassroomRosterStudent])
async def get_classroom_roster(
    classroom_id: str,
    active_only: bool = Query(True, description="Only return active enrollments"),
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get all students enrolled in a specific classroom - For teacher rosters"""
    try:
        print(f"🔍 DEBUG: Getting roster for classroom {classroom_id}")
        
        query = select(Enrollment).options(
            joinedload(Enrollment.student)
        ).where(Enrollment.classroom_id == UUID(classroom_id))
        
        if active_only:
            query = query.where(Enrollment.is_active == True)
        
        query = query.order_by(Enrollment.student.has(Student.last_name))
        
        result = await session.execute(query)
        enrollments = result.scalars().all()
        
        # Transform to ClassroomRosterStudent format
        roster = []
        for enrollment in enrollments:
            if enrollment.student:  # Safety check
                roster.append(ClassroomRosterStudent(
                    id=enrollment.student.id,
                    student_id=enrollment.student.student_id,
                    first_name=enrollment.student.first_name,
                    last_name=enrollment.student.last_name,
                    enrollment_id=enrollment.id,
                    enrollment_date=enrollment.enrollment_date,
                    enrollment_status=enrollment.enrollment_status,
                    is_active=enrollment.is_active,
                    requires_accommodation=enrollment.requires_accommodation
                ))
        
        print(f"🔍 DEBUG: Found {len(roster)} students in classroom roster")
        return roster
        
    except Exception as e:
        print(f"❌ ERROR in get_classroom_roster: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch classroom roster")

@router.get("/test-enrollment")
async def test_enrollment():
    return {"message": "Enrollment router works!", "status": "success"}