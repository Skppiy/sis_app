from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .db import get_session
from .security import decode_access_token
from .models.user import User
from .models.user_role import UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_db(session: AsyncSession = Depends(get_session)) -> AsyncSession:
    return session


async def get_current_user(token: str = Depends(oauth2_scheme),
                           session: AsyncSession = Depends(get_db)) -> User:
    email = decode_access_token(token)
    if not email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user


async def require_admin(user: User = Depends(get_current_user), 
                       session: AsyncSession = Depends(get_db)) -> User:
    # Check if user has any admin role - be more flexible with role names
    result = await session.execute(
        select(UserRole).where(
            UserRole.user_id == user.id,
            UserRole.is_active == True
        )
    )
    user_roles = result.scalars().all()
    
    # Check if any role contains 'admin' in the name
    admin_roles = [role for role in user_roles if 'admin' in role.role.lower()]
    
    if not admin_roles:
        # For debugging, let's also check if the user has any roles at all
        if not user_roles:
            print(f"User {user.email} has no roles assigned")
        else:
            print(f"User {user.email} has roles: {[r.role for r in user_roles]}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    
    return user


def require_role(*required_roles: str):
    async def _inner(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_db)) -> User:
        result = await session.execute(
            select(UserRole).where(UserRole.user_id == user.id, UserRole.is_active == True)
        )
        roles = [r.role.lower() for r in result.scalars().all()]
        if required_roles:
            if not any(any(req.lower() in role for role in roles) for req in required_roles):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Required role missing")
        return user
    return _inner
