# backend/app/routers/classrooms.py
# Fixed classroom creation with proper homeroom support

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import joinedload, selectinload
from typing import List, Optional
import uuid
from uuid import UUID

from ..deps import get_db, require_admin, get_current_user
from ..models.classroom import Classroom
from ..models.subject import Subject
from ..models.academic_year import AcademicYear
from ..models.room import Room
from ..models.user import User
from ..models.classroom_teacher_assignment import ClassroomTeacherAssignment
from ..schemas.classroom import ClassroomCreate, ClassroomOut, ClassroomWithDetails

router = APIRouter(tags=["classrooms"])

@router.get("", response_model=List[ClassroomOut])
async def list_classrooms(
    academic_year_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    teacher_user_id: Optional[str] = None,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """List classrooms with optional filtering"""
    query = select(Classroom).options(
        joinedload(Classroom.subject),
        joinedload(Classroom.academic_year)
    )
    
    if academic_year_id:
        query = query.where(Classroom.academic_year_id == UUID(academic_year_id))
    
    if subject_id:
        query = query.where(Classroom.subject_id == UUID(subject_id))
    
    if teacher_user_id:
        query = query.join(ClassroomTeacherAssignment).where(
            and_(
                ClassroomTeacherAssignment.teacher_user_id == UUID(teacher_user_id),
                ClassroomTeacherAssignment.is_active == True
            )
        )
    
    result = await session.execute(query)
    classrooms = result.scalars().all()
    
    # Add enrollment count and room information for each classroom
    for classroom in classrooms:
        # Get enrollment count (when enrollment model exists)
        # For now, set to 0 as placeholder
        classroom.enrollment_count = 0
        
        # Get room information if room_id exists
        if hasattr(classroom, 'room_id') and classroom.room_id:
            room_result = await session.execute(
                select(Room).where(Room.id == classroom.room_id)
            )
            classroom.room = room_result.scalar_one_or_none()
    
    return classrooms

@router.get("/{classroom_id}", response_model=ClassroomWithDetails)
async def get_classroom(
    classroom_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get detailed classroom information including enrollments and teachers"""
    result = await session.execute(
        select(Classroom)
        .options(
            joinedload(Classroom.subject),
            joinedload(Classroom.academic_year),
            selectinload(Classroom.teacher_assignments).joinedload(ClassroomTeacherAssignment.teacher)
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
    """Create a new classroom with enhanced validation and room assignment"""
    
    # Validate subject exists
    subject = await session.get(Subject, UUID(payload.subject_id))
    if not subject:
        raise HTTPException(status_code=400, detail="Subject not found")
    
    # Validate academic year exists
    academic_year = await session.get(AcademicYear, UUID(payload.academic_year_id))
    if not academic_year:
        raise HTTPException(status_code=400, detail="Academic year not found")
    
    # Validate room exists if provided
    room = None
    if hasattr(payload, 'room_id') and payload.room_id:
        room = await session.get(Room, UUID(payload.room_id))
        if not room:
            raise HTTPException(status_code=400, detail="Room not found")
        
        # Check if room is already assigned for this time slot (future enhancement)
        # For now, we'll allow multiple assignments to same room
    
    # Validate teacher exists if provided  
    teacher = None
    if hasattr(payload, 'teacher_id') and payload.teacher_id:
        teacher = await session.get(User, UUID(payload.teacher_id))
        if not teacher:
            raise HTTPException(status_code=400, detail="Teacher not found")
        
        # Verify teacher has appropriate role (future enhancement)
        # For now, assume any user can be assigned as teacher
    
    # Create classroom with room assignment
    classroom_data = {
        "id": uuid.uuid4(),
        "name": payload.name,
        "subject_id": UUID(payload.subject_id),
        "academic_year_id": UUID(payload.academic_year_id),
        "grade_level": payload.grade_level,
        "classroom_type": payload.classroom_type,
        "max_students": payload.max_students
    }
    
    # Add room assignment if provided
    if room:
        classroom_data["room_id"] = room.id
    
    classroom = Classroom(**classroom_data)
    session.add(classroom)
    await session.flush()  # Get the classroom ID
    
    # Create teacher assignment if teacher provided
    if teacher:
        teacher_assignment = ClassroomTeacherAssignment(
            id=uuid.uuid4(),
            classroom_id=classroom.id,
            teacher_user_id=teacher.id,
            role_name="Primary Teacher",
            can_view_grades=True,
            can_modify_grades=True,
            can_take_attendance=True,
            can_view_parent_contact=True,
            can_create_assignments=True,
            start_date=academic_year.start_date,
            is_active=True
        )
        session.add(teacher_assignment)
    
    await session.commit()
    await session.refresh(classroom)
    
    # Load related data for response
    await session.refresh(classroom, ["subject", "academic_year"])
    
    return classroom

@router.post("/homeroom", response_model=ClassroomOut, status_code=status.HTTP_201_CREATED)
async def create_homeroom_classroom(
    payload: dict,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """
    Create an elementary homeroom classroom with automatic core subject assignment
    Fixed to handle proper validation and creation
    """
    
    try:
        # Extract and validate required fields
        teacher_id = payload.get("teacher_id")
        grade_level = payload.get("grade_level")
        room_id = payload.get("room_id")
        academic_year_id = payload.get("academic_year_id")
        name = payload.get("name")
        max_students = payload.get("max_students", 25)
        
        # Validate required fields
        if not all([teacher_id, grade_level, academic_year_id]):
            raise HTTPException(
                status_code=400, 
                detail="teacher_id, grade_level, and academic_year_id are required for homeroom creation"
            )
        
        # Validate teacher exists
        teacher = await session.get(User, UUID(teacher_id))
        if not teacher:
            raise HTTPException(status_code=400, detail="Teacher not found")
        
        # Validate academic year exists
        academic_year = await session.get(AcademicYear, UUID(academic_year_id))
        if not academic_year:
            raise HTTPException(status_code=400, detail="Academic year not found")
        
        # Validate room exists if provided
        room = None
        if room_id:
            room = await session.get(Room, UUID(room_id))
            if not room:
                raise HTTPException(status_code=400, detail="Room not found")
        
        # Get a core subject for the homeroom (we'll use the first one available)
        # In a homeroom setup, we typically assign one "homeroom" subject that represents
        # the teacher's primary classroom, then auto-assign core subjects separately
        core_subjects_result = await session.execute(
            select(Subject).where(Subject.is_homeroom_default == True).limit(1)
        )
        homeroom_subject = core_subjects_result.scalar_one_or_none()
        
        if not homeroom_subject:
            # If no homeroom subjects exist, create a default one or use any core subject
            general_subjects_result = await session.execute(
                select(Subject).where(Subject.subject_type == 'CORE').limit(1)
            )
            homeroom_subject = general_subjects_result.scalar_one_or_none()
            
            if not homeroom_subject:
                raise HTTPException(
                    status_code=400, 
                    detail="No core subjects found. Please create core subjects first."
                )
        
        # Auto-generate name if not provided
        if not name:
            name = f"{teacher.first_name} {teacher.last_name}'s Grade {grade_level} Homeroom"
        
        # Create the homeroom classroom with room assignment
        classroom_data = {
            "id": uuid.uuid4(),
            "name": name,
            "subject_id": homeroom_subject.id,
            "academic_year_id": UUID(academic_year_id),
            "grade_level": grade_level,
            "classroom_type": "HOMEROOM",
            "max_students": max_students
        }
        
        # Add room assignment if provided
        if room:
            classroom_data["room_id"] = room.id
        
        classroom = Classroom(**classroom_data)
        session.add(classroom)
        await session.flush()  # Get the classroom ID
        
        # Create teacher assignment
        teacher_assignment = ClassroomTeacherAssignment(
            id=uuid.uuid4(),
            classroom_id=classroom.id,
            teacher_user_id=teacher.id,
            role_name="Homeroom Teacher",
            can_view_grades=True,
            can_modify_grades=True,
            can_take_attendance=True,
            can_view_parent_contact=True,
            can_create_assignments=True,
            start_date=academic_year.start_date,
            is_active=True
        )
        session.add(teacher_assignment)
        
        await session.commit()
        await session.refresh(classroom)
        
        # Load related data for response
        await session.refresh(classroom, ["subject", "academic_year"])
        
        return classroom
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle any other errors
        await session.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to create homeroom classroom: {str(e)}"
        )

@router.put("/{classroom_id}", response_model=ClassroomOut)
async def update_classroom(
    classroom_id: str,
    payload: ClassroomCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Update a classroom"""
    classroom = await session.get(Classroom, UUID(classroom_id))
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Update classroom fields
    classroom.name = payload.name
    classroom.grade_level = payload.grade_level
    classroom.classroom_type = payload.classroom_type
    classroom.max_students = payload.max_students
    
    # Update subject if provided
    if payload.subject_id:
        subject = await session.get(Subject, UUID(payload.subject_id))
        if not subject:
            raise HTTPException(status_code=400, detail="Subject not found")
        classroom.subject_id = UUID(payload.subject_id)
    
    await session.commit()
    await session.refresh(classroom)
    return classroom

@router.delete("/{classroom_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_classroom(
    classroom_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Delete a classroom"""
    classroom = await session.get(Classroom, UUID(classroom_id))
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # TODO: Check for enrollments before deletion
    # For now, allow deletion
    
    await session.delete(classroom)
    await session.commit()