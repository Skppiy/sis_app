# backend/app/routers/rooms.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from ..deps import get_db, require_admin, get_current_user
from ..models.room import Room
from ..schemas.room import RoomCreate, RoomOut, RoomUpdate

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.get("", response_model=List[RoomOut])
async def list_rooms(
    school_id: Optional[str] = None,
    room_type: Optional[str] = None,
    bookable_only: bool = False,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get rooms with optional filtering"""
    query = select(Room).where(Room.is_active == True).order_by(Room.name)
    
    if school_id:
        from uuid import UUID
        query = query.where(Room.school_id == UUID(school_id))
    
    if room_type:
        query = query.where(Room.room_type == room_type.upper())
    
    if bookable_only:
        query = query.where(Room.is_bookable == True)
    
    result = await session.execute(query)
    return result.scalars().all()

@router.post("", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
async def create_room(
    payload: RoomCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Create a new room"""
    from uuid import UUID
    from ..models.school import School
    
    # Validate school exists
    school = await session.get(School, UUID(payload.school_id))
    if not school:
        raise HTTPException(status_code=400, detail="School not found")
    
    # Check for duplicate room code at school
    existing = await session.execute(
        select(Room).where(Room.school_id == UUID(payload.school_id), Room.room_code == payload.room_code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Room code already exists at this school")
    
    room = Room(
        name=payload.name,
        room_code=payload.room_code.upper(),
        room_type=payload.room_type.upper(),
        capacity=payload.capacity,
        has_projector=payload.has_projector,
        has_computers=payload.has_computers,
        has_smartboard=payload.has_smartboard,
        has_sink=payload.has_sink,
        is_bookable=payload.is_bookable,
        school_id=UUID(payload.school_id),
    )
    
    session.add(room)
    await session.commit()
    await session.refresh(room)
    return room

@router.get("/{room_id}", response_model=RoomOut)
async def get_room(
    room_id: str,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(get_current_user),
):
    """Get a specific room"""
    from uuid import UUID
    
    room = await session.get(Room, UUID(room_id))
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room

@router.patch("/{room_id}", response_model=RoomOut)
async def update_room(
    room_id: str,
    payload: RoomUpdate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    """Update a room"""
    from uuid import UUID
    
    room = await session.get(Room, UUID(room_id))
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Update fields
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == 'room_type' and value:
            value = value.upper()
        setattr(room, field, value)
    
    await session.commit()
    await session.refresh(room)
    return room