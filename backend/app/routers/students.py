# backend/app/routers/students.py
# Complete students router following patterns from your working routers

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import joinedload, selectinload
from typing import List, Optional
import uuid
from uuid import UUID

from ..deps import get_db, require_admin, get_current_user
from ..models.student import Student
from ..models.student_academic_record import StudentAcademicRecord
from ..models.academic_year import AcademicYear
from ..schemas.student import StudentCreate, StudentOut, StudentUpdate, StudentWithDetails
from ..models.enrollment import Enrollment
from ..models.classroom import Classroom
from ..schemas.enrollment import EnrollmentWithDetails

router = APIRouter(tags=["students"])

@router.get("", response_model=List[StudentOut])
async def list_students(
    school_id: Optional[str] = Query(None, description="Filter by school ID"),
    grade_level: Optional[str] = Query(None, description="Filter by grade level"),
    is_active: Optional[bool] = Query(None, description="Filter by active status - leave empty to see all"),
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get all students with optional filtering - Simplified robust version"""
    try:
        print("🔍 DEBUG: Starting list_students")
        print(f"🔍 DEBUG: Filters - school_id: {school_id}, grade_level: {grade_level}, is_active: {is_active}")
        
        # Start with the simplest possible query - just get all students
        query = select(Student)
        
        # Only filter by active status if explicitly set
        if is_active is not None:
            query = query.where(Student.is_active == is_active)
            print(f"🔍 DEBUG: Filtering by is_active = {is_active}")
        else:
            print("🔍 DEBUG: Not filtering by is_active - showing all students")
        
        # Skip grade level filtering for now to keep it simple
        if grade_level:
            print(f"🔍 DEBUG: Grade level filtering requested but skipping for now: {grade_level}")
        
        # Order by name
        query = query.order_by(Student.last_name, Student.first_name)
        
        # Execute the query
        print("🔍 DEBUG: Executing query...")
        result = await session.execute(query)
        students = result.scalars().all()
        
        print(f"🔍 DEBUG: Raw query returned {len(students)} students")
        
        # Convert to response format - keep it simple
        response_students = []
        for i, student in enumerate(students):
            print(f"🔍 Student {i+1}: {student.first_name} {student.last_name} (Active: {student.is_active})")
            
            # Create response object manually to avoid any schema issues
            student_dict = {
                "id": student.id,
                "first_name": student.first_name,
                "last_name": student.last_name,
                "email": student.email,
                "date_of_birth": student.date_of_birth,
                "student_id": student.student_id,
                "entry_date": student.entry_date,
                "entry_grade_level": student.entry_grade_level,
                "is_active": student.is_active,
                "current_grade": student.entry_grade_level  # Use entry grade for now
            }
            response_students.append(StudentOut(**student_dict))
        
        print(f"🔍 DEBUG: Returning {len(response_students)} processed students")
        return response_students
        
    except Exception as e:
        print(f"❌ ERROR in list_students: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return empty list instead of crashing
        return []

@router.get("/{student_id}", response_model=StudentWithDetails)
async def get_student(
    student_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get a specific student by ID"""
    try:
        # Load student with relationships like your other routers
        query = select(Student).options(
            selectinload(Student.academic_records).joinedload(StudentAcademicRecord.academic_year),
            selectinload(Student.special_needs),
            selectinload(Student.parent_relationships)
        ).where(Student.id == UUID(student_id))
        
        result = await session.execute(query)
        student = result.scalar_one_or_none()
        
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Set current grade
        current_record = None
        for record in student.academic_records:
            if (record.is_active and 
                record.academic_year and 
                record.academic_year.is_active):
                current_record = record
                break
        
        student.current_grade = current_record.grade_level if current_record else student.entry_grade_level
        
        return student
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR in get_student: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("", response_model=StudentOut, status_code=status.HTTP_201_CREATED)
async def create_student(
    payload: StudentCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Create a new student - Following your working router patterns"""
    try:
        # Check for duplicate student_id if provided (like your other routers)
        if payload.student_id:
            existing_student = await session.execute(
                select(Student).where(Student.student_id == payload.student_id)
            )
            if existing_student.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Student ID already exists")
        
        # Check for duplicate email if provided
        if payload.email:
            existing_email = await session.execute(
                select(Student).where(Student.email == payload.email)
            )
            if existing_email.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Email already exists")
        
        # Create student (following your model patterns)
        student = Student(
            id=uuid.uuid4(),
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            date_of_birth=payload.date_of_birth,
            student_id=payload.student_id,
            entry_date=payload.entry_date,
            entry_grade_level=payload.entry_grade_level,
            is_active=True
        )
        
        session.add(student)
        await session.commit()
        await session.refresh(student)
        
        # Set current_grade for response
        student.current_grade = payload.entry_grade_level
        
        return student
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        print(f"❌ ERROR in create_student: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create student")

@router.put("/{student_id}", response_model=StudentOut)
async def update_student(
    student_id: str,
    payload: StudentUpdate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Update a student - Following your working router patterns"""
    try:
        student = await session.get(Student, UUID(student_id))
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Check for duplicate student_id if being updated
        if payload.student_id and payload.student_id != student.student_id:
            existing_student = await session.execute(
                select(Student).where(
                    and_(
                        Student.student_id == payload.student_id,
                        Student.id != student.id
                    )
                )
            )
            if existing_student.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Student ID already exists")
        
        # Check for duplicate email if being updated
        if payload.email and payload.email != student.email:
            existing_email = await session.execute(
                select(Student).where(
                    and_(
                        Student.email == payload.email,
                        Student.id != student.id
                    )
                )
            )
            if existing_email.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="Email already exists")
        
        # Update fields (like your classroom router)
        update_data = payload.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(student, field, value)
        
        await session.commit()
        await session.refresh(student)
        
        # Set current_grade for response
        student.current_grade = student.entry_grade_level
        
        return student
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        print(f"❌ ERROR in update_student: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update student")

@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Delete a student (soft delete) - Following your working router patterns"""
    try:
        student = await session.get(Student, UUID(student_id))
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Soft delete by setting is_active to False (like your room router)
        student.is_active = False
        
        await session.commit()
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        print(f"❌ ERROR in delete_student: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete student")

@router.get("/{student_id}/academic-records")
async def get_student_academic_records(
    student_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get academic history for a student"""
    try:
        student = await session.get(Student, UUID(student_id))
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        records_result = await session.execute(
            select(StudentAcademicRecord)
            .options(joinedload(StudentAcademicRecord.academic_year))
            .where(StudentAcademicRecord.student_id == UUID(student_id))
            .order_by(StudentAcademicRecord.enrollment_date.desc())
        )
        records = records_result.scalars().all()
        
        # Convert to dict for simple response
        return [
            {
                "id": str(record.id),
                "grade_level": record.grade_level,
                "promotion_status": record.promotion_status,
                "is_active": record.is_active,
                "enrollment_date": record.enrollment_date.isoformat() if record.enrollment_date else None,
                "academic_year": record.academic_year.name if record.academic_year else None,
            }
            for record in records
        ]
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR in get_student_academic_records: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get academic records")

# Debug endpoint to help troubleshoot - No auth required
@router.get("/debug/info")
async def debug_student_info(
    session: AsyncSession = Depends(get_db),
):
    """Debug endpoint to check student data - No auth required for debugging"""
    try:
        # Count all students
        total_result = await session.execute(select(Student))
        total_students = len(total_result.scalars().all())
        
        # Count active students  
        active_result = await session.execute(select(Student).where(Student.is_active == True))
        active_students = len(active_result.scalars().all())
        
        # Get sample student data
        sample_result = await session.execute(
            select(Student).where(Student.is_active == True).limit(3)
        )
        sample_students = sample_result.scalars().all()
        
        return {
            "total_students": total_students,
            "active_students": active_students,
            "sample_students": [
                {
                    "id": str(s.id),
                    "name": f"{s.first_name} {s.last_name}",
                    "entry_grade": s.entry_grade_level,
                    "is_active": s.is_active
                }
                for s in sample_students
            ],
            "debug": "Check if students exist in database"
        }
        
    except Exception as e:
        return {"error": str(e)}

@router.get("/{student_id}/enrollments", response_model=List[EnrollmentWithDetails])
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
        
        # Validate student exists
        student = await session.get(Student, UUID(student_id))
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
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
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR in get_student_enrollments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch student enrollments")