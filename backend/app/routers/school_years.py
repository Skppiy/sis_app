from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional

from ..deps import get_db, require_admin
from ..models.school_year import SchoolYear
from ..models.enrollment import Enrollment
from ..schemas.school_year import SchoolYearCreate, SchoolYearOut

router = APIRouter(prefix="/school_years", tags=["school_years"])


@router.get("/", response_model=List[SchoolYearOut])
async def list_years(
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    years = (await session.execute(select(SchoolYear).order_by(SchoolYear.start_date.desc()))).scalars().all()
    return years


@router.post("/", response_model=SchoolYearOut)
async def create_year(
    payload: SchoolYearCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    year = SchoolYear(
        name=payload.name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_active=payload.is_active or False,
    )
    session.add(year)
    await session.commit()
    await session.refresh(year)

    # If marked active, deactivate others
    if year.is_active:
        await session.execute(SchoolYear.__table__.update().where(SchoolYear.id != year.id).values(is_active=False))
        await session.commit()

    return year


@router.post("/set_active", response_model=SchoolYearOut)
async def set_active(year_id: str, session: AsyncSession = Depends(get_db), _: any = Depends(require_admin)):
    year = (await session.execute(select(SchoolYear).where(SchoolYear.id == year_id))).scalar_one_or_none()
    if not year:
        raise HTTPException(status_code=404, detail="SchoolYear not found")
    # Activate this year and deactivate others globally
    await session.execute(SchoolYear.__table__.update().values(is_active=False))
    await session.execute(
        SchoolYear.__table__.update().where(SchoolYear.id == year.id).values(is_active=True)
    )
    await session.commit()
    await session.refresh(year)
    return year


@router.delete("/{year_id}")
async def delete_year(year_id: str, session: AsyncSession = Depends(get_db), _: any = Depends(require_admin)):
    year = (await session.execute(select(SchoolYear).where(SchoolYear.id == year_id))).scalar_one_or_none()
    if not year:
        raise HTTPException(status_code=404, detail="SchoolYear not found")
    if year.is_active:
        raise HTTPException(status_code=400, detail="Cannot delete active year. Set another year active first.")
    # Prevent deletion if there are enrollments (or grades later)
    used = (await session.execute(
        select(func.count()).select_from(Enrollment).where(Enrollment.school_year_id == year_id)
    )).scalar_one()
    if used and used > 0:
        raise HTTPException(status_code=400, detail="Cannot delete a year that has enrollments. Archive instead or move data.")
    await session.delete(year)
    await session.commit()
    return {"status": "deleted", "id": year_id}

