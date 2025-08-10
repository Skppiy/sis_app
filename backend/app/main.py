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

app.include_router(auth_router.router)
app.include_router(schools_router.router)
app.include_router(admin_router.router)
app.include_router(dashboard_router.router)
app.include_router(classrooms_router.router)
app.include_router(students_router.router)
