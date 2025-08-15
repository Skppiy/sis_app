# backend/app/routers/classrooms.py - Enhanced for Phase A completion
"""
Enhanced Classroom Router with Room Integration and Homeroom Preparation
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, text
from sqlalchemy.orm import joinedload, selectinload
from typing import List, Optional
from uuid import UUID
import uuid

from ..deps import get_db, require_admin, get_current_user
from ..models.classroom import Classroom
from ..models.classroom_teacher_assignment import ClassroomTeacherAssignment
from ..models.academic_year import AcademicYear
from ..models.subject import Subject
from ..models.user import User
from ..models.room import Room
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
    """Get classrooms with optional filtering and enhanced room information"""
    query = select(Classroom).options(
        joinedload(Classroom.subject),
        joinedload(Classroom.academic_year),
        selectinload(Classroom.teacher_assignments).joinedload(ClassroomTeacherAssignment.teacher)
    ).order_by(Classroom.name)
    
    # Default to active academic year if none specified
    if not academic_year_id:
        result = await session.execute(select(AcademicYear).where(AcademicYear.is_active == True))
        active_year = result.scalar_one_or_none()
        if active_year:
            academic_year_id = str(active_year.id)
    
    if academic_year_id:
        query = query.where(Classroom.academic_year_id == UUID(academic_year_id))
    
    if grade_level:
        query = query.where(Classroom.grade_level == grade_level)
    
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
    
    # Create classroom
    classroom_data = {
        "id": uuid.uuid4(),
        "name": payload.name,
        "subject_id": UUID(payload.subject_id),
        "academic_year_id": UUID(payload.academic_year_id),
        "grade_level": payload.grade_level,
        "classroom_type": payload.classroom_type,
        "max_students": payload.max_students
    }
    
    # Add room if provided
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
    payload: dict,  # Will be enhanced with proper schema later
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """
    Create an elementary homeroom classroom with automatic core subject assignment
    This is the foundation for the homeroom intelligence system
    """
    
    # Extract basic classroom info
    teacher_id = payload.get("teacher_id")
    grade_level = payload.get("grade_level")
    room_id = payload.get("room_id")
    academic_year_id = payload.get("academic_year_id")
    
    if not all([teacher_id, grade_level, academic_year_id]):
        raise HTTPException(
            status_code=400, 
            detail="teacher_id, grade_level, and academic_year_id are required for homeroom creation"
        )
    
    # Validate inputs
    teacher = await session.get(User, UUID(teacher_id))
    if not teacher:
        raise HTTPException(status_code=400, detail="Teacher not found")
    
    academic_year = await session.get(AcademicYear, UUID(academic_year_id))
    if not academic_year:
        raise HTTPException(status_code=400, detail="Academic year not found")
    
    room = None
    if room_id:
        room = await session.get(Room, UUID(room_id))
        if not room:
            raise HTTPException(status_code=400, detail="Room not found")
    
    # Get core subjects for auto-assignment
    core_subjects_result = await session.execute(
        select(Subject).where(Subject.is_homeroom_default == True)
    )
    core_subjects = core_subjects_result.scalars().all()
    
    if not core_subjects:
        raise HTTPException(
            status_code=400, 
            detail="No core subjects found for homeroom assignment. Please create core subjects first."
        )
    
    # For now, create a single classroom with the first core subject
    # In full implementation, this will create teacher assignments for all core subjects
    primary_subject = core_subjects[0]
    
    classroom_name = f"{teacher.first_name} {teacher.last_name}'s Grade {grade_level} Homeroom"
    
    classroom = Classroom(
        id=uuid.uuid4(),
        name=classroom_name,
        subject_id=primary_subject.id,
        academic_year_id=UUID(academic_year_id),
        grade_level=grade_level,
        classroom_type="HOMEROOM",
        max_students=payload.get("max_students", 25),
        room_id=UUID(room_id) if room_id else None
    )
    
    session.add(classroom)
    await session.flush()
    
    # Create teacher assignment
    teacher_assignment = ClassroomTeacherAssignment(
        id=uuid.uuid4(),
        classroom_id=classroom.id,
        teacher_user_id=UUID(teacher_id),
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
    
    # TODO: In Phase A.2, this will create assignments for ALL core subjects
    # and implement the full homeroom intelligence system
    
    return classroom

@router.get("/available-rooms", response_model=List[dict])
async def get_available_rooms(
    grade_level: Optional[str] = None,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get available rooms for classroom assignment"""
    
    query = select(Room).where(Room.is_active == True)
    
    # Filter by room type based on grade level (future enhancement)
    if grade_level:
        # Elementary might prefer certain room types
        # Middle school might need larger rooms
        pass
    
    result = await session.execute(query.order_by(Room.name))
    rooms = result.scalars().all()
    
    # Return room info with availability status
    room_list = []
    for room in rooms:
        # Check current assignments (simplified for now)
        assignment_count = await session.execute(
            select(func.count(Classroom.id)).where(
                and_(
                    Classroom.room_id == room.id,
                    # Add time-based filtering in future
                )
            )
        )
        current_assignments = assignment_count.scalar()
        
        room_list.append({
            "id": str(room.id),
            "name": room.name,
            "room_code": getattr(room, 'room_code', room.name),
            "room_type": getattr(room, 'room_type', 'CLASSROOM'),
            "capacity": getattr(room, 'capacity', 25),
            "current_assignments": current_assignments,
            "available": True  # Simplified - will add time-based logic later
        })
    
    return room_list

@router.get("/teachers-for-assignment", response_model=List[dict])
async def get_teachers_for_assignment(
    grade_level: Optional[str] = None,
    subject_id: Optional[str] = None,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get available teachers for classroom assignment"""
    
    # Get users with teacher role
    query = text("""
        SELECT DISTINCT u.id, u.first_name, u.last_name, u.email
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        WHERE ur.role ILIKE '%teacher%' 
        AND ur.is_active = true
        AND u.is_active = true
        ORDER BY u.last_name, u.first_name
    """)
    
    result = await session.execute(query)
    teachers = result.fetchall()
    
    teacher_list = []
    for teacher in teachers:
        # Get current classroom assignments
        assignment_query = await session.execute(
            select(func.count(ClassroomTeacherAssignment.id)).where(
                and_(
                    ClassroomTeacherAssignment.teacher_user_id == teacher.id,
                    ClassroomTeacherAssignment.is_active == True
                )
            )
        )
        current_assignments = assignment_query.scalar()
        
        teacher_list.append({
            "id": str(teacher.id),
            "name": f"{teacher.first_name} {teacher.last_name}",
            "email": teacher.email,
            "current_assignments": current_assignments,
            "available": True  # Will add capacity logic later
        })
    
    return teacher_list

@router.patch("/{classroom_id}", response_model=ClassroomOut)
async def update_classroom(
    classroom_id: str,
    payload: ClassroomUpdate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Update a classroom"""
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
    classroom = await session.get(Classroom, UUID(classroom_id))
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Check if classroom has enrollments (future enhancement)
    # For now, allow deletion
    
    await session.delete(classroom)
    await session.commit()
    return {"message": "Classroom deleted successfully"}