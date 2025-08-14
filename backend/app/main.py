# backend/app/main.py - Updated with new routers

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from .db import get_session
from .routers import auth as auth_router
from .routers import schools as schools_router
from .routers import admin as admin_router
from .routers import dashboard as dashboard_router
from .routers import classrooms as classrooms_router
from .routers import students as students_router
from .routers import academic_years as academic_years_router
from .routers import subjects as subjects_router
from .routers import rooms as rooms_router
from .routers import special_needs as special_needs_router
from .routers import parents as parents_router

app = FastAPI(title="SIS API - Phase A")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health") 
async def health(session: AsyncSession = Depends(get_session)):
    await session.execute(text("SELECT 1"))
    return {"status": "ok"}

# Include all routers
app.include_router(auth_router.router)
app.include_router(schools_router.router)
app.include_router(admin_router.router)
app.include_router(dashboard_router.router)
app.include_router(classrooms_router.router)
app.include_router(students_router.router)
app.include_router(academic_years_router.router)
app.include_router(subjects_router.router)
app.include_router(rooms_router.router)
app.include_router(special_needs_router.router)
app.include_router(parents_router.router)


# backend/app/routers/__init__.py - Updated

# All router modules are imported by main.py


#