# backend/app/routers/student_services.py
# Student services tag library and assignment management

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Optional
from uuid import UUID
import uuid

from ..deps import get_db, require_admin, get_current_user
from ..models.special_needs_tag_library import SpecialNeedsTagLibrary
from ..models.student_special_need import StudentSpecialNeed
from ..schemas.student_services import (
    StudentServiceTagCreate,
    StudentServiceTagOut,
    StudentServiceTagUpdate,
    StudentServiceAssignmentCreate,
    StudentServiceAssignmentOut
)

router = APIRouter(tags=["student-services"])

@router.get("/tags", response_model=List[StudentServiceTagOut])
async def list_service_tags(
    school_id: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get all student service tags with optional filtering"""
    try:
        query = select(SpecialNeedsTagLibrary).where(SpecialNeedsTagLibrary.is_active == True)
        
        if school_id:
            query = query.where(SpecialNeedsTagLibrary.school_id == UUID(school_id))
        
        if category:
            query = query.where(SpecialNeedsTagLibrary.category == category.upper())
        
        query = query.order_by(SpecialNeedsTagLibrary.category, SpecialNeedsTagLibrary.tag_name)
        
        result = await session.execute(query)
        tags = result.scalars().all()
        
        # Add student count for each tag
        tag_list = []
        for tag in tags:
            # Count active student assignments
            count_query = select(func.count(StudentSpecialNeed.id)).where(
                and_(
                    StudentSpecialNeed.tag_library_id == tag.id,
                    StudentSpecialNeed.is_active == True
                )
            )
            count_result = await session.execute(count_query)
            student_count = count_result.scalar() or 0
            
            tag_dict = {
                "id": tag.id,
                "tag_name": tag.tag_name,
                "category": tag.category,
                "description": tag.description,
                "display_color": tag.display_color,
                "requires_documentation": tag.requires_documentation,
                "is_confidential": tag.is_confidential,
                "school_id": tag.school_id,
                "is_active": tag.is_active,
                "student_count": student_count
            }
            tag_list.append(tag_dict)
        
        return tag_list
        
    except Exception as e:
        print(f"Error loading service tags: {e}")
        raise HTTPException(status_code=500, detail="Failed to load service tags")

@router.get("/tags/{tag_id}", response_model=StudentServiceTagOut)
async def get_service_tag(
    tag_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get a specific service tag by ID"""
    try:
        tag = await session.get(SpecialNeedsTagLibrary, UUID(tag_id))
        if not tag:
            raise HTTPException(status_code=404, detail="Service tag not found")
        
        # Get student count
        count_query = select(func.count(StudentSpecialNeed.id)).where(
            and_(
                StudentSpecialNeed.tag_library_id == tag.id,
                StudentSpecialNeed.is_active == True
            )
        )
        count_result = await session.execute(count_query)
        student_count = count_result.scalar() or 0
        
        return {
            "id": tag.id,
            "tag_name": tag.tag_name,
            "category": tag.category,
            "description": tag.description,
            "display_color": tag.display_color,
            "requires_documentation": tag.requires_documentation,
            "is_confidential": tag.is_confidential,
            "school_id": tag.school_id,
            "is_active": tag.is_active,
            "student_count": student_count
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tag ID format")
    except Exception as e:
        print(f"Error getting service tag: {e}")
        raise HTTPException(status_code=500, detail="Failed to get service tag")

@router.post("/tags", response_model=StudentServiceTagOut, status_code=status.HTTP_201_CREATED)
async def create_service_tag(
    payload: StudentServiceTagCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Create a new student service tag"""
    try:
        # Check for duplicate tag name within school
        existing = await session.execute(
            select(SpecialNeedsTagLibrary).where(
                and_(
                    SpecialNeedsTagLibrary.school_id == UUID(payload.school_id),
                    SpecialNeedsTagLibrary.tag_name == payload.tag_name,
                    SpecialNeedsTagLibrary.is_active == True
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="A service tag with this name already exists")
        
        tag = SpecialNeedsTagLibrary(
            id=uuid.uuid4(),
            school_id=UUID(payload.school_id),
            tag_name=payload.tag_name,
            category=payload.category.upper(),
            description=payload.description,
            display_color=payload.display_color,
            requires_documentation=payload.requires_documentation,
            is_confidential=payload.is_confidential,
            is_active=True
        )
        
        session.add(tag)
        await session.commit()
        await session.refresh(tag)
        
        return {
            "id": tag.id,
            "tag_name": tag.tag_name,
            "category": tag.category,
            "description": tag.description,
            "display_color": tag.display_color,
            "requires_documentation": tag.requires_documentation,
            "is_confidential": tag.is_confidential,
            "school_id": tag.school_id,
            "is_active": tag.is_active,
            "student_count": 0
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        print(f"Error creating service tag: {e}")
        raise HTTPException(status_code=500, detail="Failed to create service tag")

@router.put("/tags/{tag_id}", response_model=StudentServiceTagOut)
async def update_service_tag(
    tag_id: str,
    payload: StudentServiceTagUpdate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Update a student service tag"""
    try:
        tag = await session.get(SpecialNeedsTagLibrary, UUID(tag_id))
        if not tag:
            raise HTTPException(status_code=404, detail="Service tag not found")
        
        # Check for duplicate name if changing
        if payload.tag_name and payload.tag_name != tag.tag_name:
            existing = await session.execute(
                select(SpecialNeedsTagLibrary).where(
                    and_(
                        SpecialNeedsTagLibrary.school_id == tag.school_id,
                        SpecialNeedsTagLibrary.tag_name == payload.tag_name,
                        SpecialNeedsTagLibrary.id != UUID(tag_id),
                        SpecialNeedsTagLibrary.is_active == True
                    )
                )
            )
            if existing.scalar_one_or_none():
                raise HTTPException(status_code=400, detail="A service tag with this name already exists")
        
        # Update fields
        update_data = payload.dict(exclude_unset=True)
        for field, value in update_data.items():
            if field == "category" and value:
                value = value.upper()
            setattr(tag, field, value)
        
        await session.commit()
        await session.refresh(tag)
        
        # Get student count
        count_query = select(func.count(StudentSpecialNeed.id)).where(
            and_(
                StudentSpecialNeed.tag_library_id == tag.id,
                StudentSpecialNeed.is_active == True
            )
        )
        count_result = await session.execute(count_query)
        student_count = count_result.scalar() or 0
        
        return {
            "id": tag.id,
            "tag_name": tag.tag_name,
            "category": tag.category,
            "description": tag.description,
            "display_color": tag.display_color,
            "requires_documentation": tag.requires_documentation,
            "is_confidential": tag.is_confidential,
            "school_id": tag.school_id,
            "is_active": tag.is_active,
            "student_count": student_count
        }
        
    except HTTPException:
        raise
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tag ID format")
    except Exception as e:
        await session.rollback()
        print(f"Error updating service tag: {e}")
        raise HTTPException(status_code=500, detail="Failed to update service tag")

@router.delete("/tags/{tag_id}")
async def delete_service_tag(
    tag_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Soft delete a student service tag"""
    try:
        tag = await session.get(SpecialNeedsTagLibrary, UUID(tag_id))
        if not tag:
            raise HTTPException(status_code=404, detail="Service tag not found")
        
        # Soft delete by setting is_active = False
        tag.is_active = False
        await session.commit()
        
        return {"message": "Service tag deleted successfully"}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tag ID format")
    except Exception as e:
        await session.rollback()
        print(f"Error deleting service tag: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete service tag")

# Student service assignment endpoints
@router.get("/students/{student_id}/services", response_model=List[StudentServiceAssignmentOut])
async def get_student_services(
    student_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get all active service assignments for a student"""
    try:
        query = select(StudentSpecialNeed).options(
            joinedload(StudentSpecialNeed.tag_library)
        ).where(
            and_(
                StudentSpecialNeed.student_id == UUID(student_id),
                StudentSpecialNeed.is_active == True
            )
        ).order_by(StudentSpecialNeed.start_date.desc())
        
        result = await session.execute(query)
        assignments = result.scalars().all()
        
        return [
            {
                "id": assignment.id,
                "student_id": assignment.student_id,
                "tag_id": assignment.tag_library_id,
                "tag_name": assignment.tag_library.tag_name,
                "category": assignment.tag_library.category,
                "severity_level": assignment.severity_level,
                "notes": assignment.notes,
                "start_date": assignment.start_date,
                "end_date": assignment.end_date,
                "review_date": assignment.review_date,
                "is_active": assignment.is_active
            }
            for assignment in assignments
        ]
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid student ID format")
    except Exception as e:
        print(f"Error getting student services: {e}")
        raise HTTPException(status_code=500, detail="Failed to get student services")

@router.post("/students/{student_id}/services", response_model=StudentServiceAssignmentOut, status_code=status.HTTP_201_CREATED)
async def assign_service_to_student(
    student_id: str,
    payload: StudentServiceAssignmentCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Assign a service tag to a student"""
    try:
        # Check if assignment already exists
        existing = await session.execute(
            select(StudentSpecialNeed).where(
                and_(
                    StudentSpecialNeed.student_id == UUID(student_id),
                    StudentSpecialNeed.tag_library_id == UUID(payload.tag_id),
                    StudentSpecialNeed.is_active == True
                )
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="This service is already assigned to the student")
        
        assignment = StudentSpecialNeed(
            id=uuid.uuid4(),
            student_id=UUID(student_id),
            tag_library_id=UUID(payload.tag_id),
            severity_level=payload.severity_level,
            notes=payload.notes,
            start_date=payload.start_date,
            end_date=payload.end_date,
            review_date=payload.review_date,
            is_active=True
        )
        
        session.add(assignment)
        await session.commit()
        await session.refresh(assignment)
        
        # Load the tag for response
        tag = await session.get(SpecialNeedsTagLibrary, assignment.tag_library_id)
        
        return {
            "id": assignment.id,
            "student_id": assignment.student_id,
            "tag_id": assignment.tag_library_id,
            "tag_name": tag.tag_name if tag else "Unknown",
            "category": tag.category if tag else "OTHER",
            "severity_level": assignment.severity_level,
            "notes": assignment.notes,
            "start_date": assignment.start_date,
            "end_date": assignment.end_date,
            "review_date": assignment.review_date,
            "is_active": assignment.is_active
        }
        
    except HTTPException:
        raise
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID format")
    except Exception as e:
        await session.rollback()
        print(f"Error assigning service: {e}")
        raise HTTPException(status_code=500, detail="Failed to assign service")

@router.delete("/assignments/{assignment_id}")
async def remove_service_assignment(
    assignment_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Remove a service assignment from a student"""
    try:
        assignment = await session.get(StudentSpecialNeed, UUID(assignment_id))
        if not assignment:
            raise HTTPException(status_code=404, detail="Service assignment not found")
        
        # Soft delete
        assignment.is_active = False
        await session.commit()
        
        return {"message": "Service assignment removed successfully"}
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid assignment ID format")
    except Exception as e:
        await session.rollback()
        print(f"Error removing service assignment: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove service assignment")