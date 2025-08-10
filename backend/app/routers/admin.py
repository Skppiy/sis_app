from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from ..deps import get_db, require_admin
from ..models.user import User
from ..models.school import School
from ..schemas.user import UserCreate, UserOut
from ..security import get_password_hash

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=List[UserOut])
async def list_users(session: AsyncSession = Depends(get_db), _: any = Depends(require_admin)):
    result = await session.execute(select(User).order_by(User.last_name, User.first_name))
    return result.scalars().all()

@router.post("/users", response_model=UserOut)
async def create_user(
    user_data: UserCreate, 
    session: AsyncSession = Depends(get_db), 
    _: any = Depends(require_admin)
):
    # Check if user already exists
    existing = await session.execute(select(User).where(User.email == user_data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Create new user
    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
