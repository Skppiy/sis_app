# backend/app/main.py - Correct version with prefixes added in include_router

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

# Fixed CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000", 
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health") 
async def health(session: AsyncSession = Depends(get_session)):
    await session.execute(text("SELECT 1"))
    return {"status": "ok"}

# Include routers with prefixes added HERE (not in router definitions)
app.include_router(auth_router.router, prefix="/auth")
app.include_router(schools_router.router, prefix="/schools")
app.include_router(admin_router.router, prefix="/admin")
app.include_router(dashboard_router.router, prefix="/dashboard")
app.include_router(classrooms_router.router, prefix="/classrooms")
app.include_router(students_router.router, prefix="/students")
app.include_router(academic_years_router.router, prefix="/academic-years")
app.include_router(subjects_router.router, prefix="/subjects")
app.include_router(rooms_router.router, prefix="/rooms")
app.include_router(special_needs_router.router, prefix="/special-needs")
app.include_router(parents_router.router, prefix="/parents")