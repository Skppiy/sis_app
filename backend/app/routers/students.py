from fastapi import APIRouter, Depends, HTTPException, Query, Body
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
import sqlalchemy as sa
from sqlalchemy import select
from typing import List, Optional

from ..deps import get_db, require_admin
from ..models.student import Student
from ..models.school import School
from ..models.classroom import Classroom
from ..models.enrollment import Enrollment
from ..models.user_role import UserRole
from ..models.school_year import SchoolYear
from ..schemas.student import StudentCreate, StudentOut, StudentWithTeacherOut

router = APIRouter(prefix="/students", tags=["students"])


@router.get("/", response_model=List[StudentOut])
@router.get("", response_model=List[StudentOut])
async def list_students(
    session: AsyncSession = Depends(get_db),
    school_id: Optional[str] = Query(default=None),
    _: any = Depends(require_admin),
):
    stmt = select(Student).where(Student.is_active == True)
    if school_id:
        try:
            school_uuid = uuid.UUID(str(school_id))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid school_id format")
        stmt = stmt.where(Student.school_id == school_uuid)
    result = await session.execute(stmt)
    from ..schemas.student import StudentOut as StudentOutSchema
    students = result.scalars().all()
    return [StudentOutSchema.from_orm(s).dict() for s in students]


@router.get("/with_teachers", response_model=List[StudentWithTeacherOut])
async def list_students_with_teachers(
    session: AsyncSession = Depends(get_db),
    school_id: Optional[str] = Query(default=None),
    school_year_id: Optional[str] = Query(default=None),
    _: any = Depends(require_admin),
):
    stmt = select(Student).where(Student.is_active == True)
    if school_id:
        try:
            school_uuid = uuid.UUID(str(school_id))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid school_id format")
        stmt = stmt.where(Student.school_id == school_uuid)
    students = (await session.execute(stmt)).scalars().all()

    out: List[StudentWithTeacherOut] = []
    # Resolve year filter
    year_uuid: Optional[uuid.UUID] = None
    if school_year_id:
        try:
            year_uuid = uuid.UUID(str(school_year_id))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid school_year_id format")
    elif True:
        # try globally active year
        active_year = (await session.execute(
            select(SchoolYear).where(SchoolYear.is_active == True)
        )).scalar_one_or_none()
        if active_year:
            year_uuid = active_year.id
    for s in students:
        teacher_user_id = None
        teacher_name = None
        teacher_email = None

        enr_row = (await session.execute(
            select(Enrollment, Classroom)
            .join(Classroom, Classroom.id == Enrollment.classroom_id)
            .where(
                Enrollment.student_id == s.id,
                Classroom.name.ilike('%Homeroom%'),
                (Enrollment.school_year_id == year_uuid) if year_uuid is not None else sa.true(),
            )
            .limit(1)
        )).first()
        # Fallback: if no homeroom enrollment for the active year, use any homeroom enrollment
        if not enr_row and year_uuid is None:
            enr_row = (await session.execute(
                select(Enrollment, Classroom)
                .join(Classroom, Classroom.id == Enrollment.classroom_id)
                .where(
                    Enrollment.student_id == s.id,
                    Classroom.name.ilike('%Homeroom%'),
                )
                .limit(1)
            )).first()
        if enr_row:
            _, classroom = enr_row
            teacher_user_id = classroom.teacher_user_id
            if teacher_user_id:
                from ..models.user import User
                teacher = (await session.execute(select(User).where(User.id == teacher_user_id))).scalar_one_or_none()
                if teacher:
                    teacher_name = f"{teacher.first_name} {teacher.last_name}"
                    teacher_email = teacher.email

        out.append(StudentWithTeacherOut(
            id=s.id,
            school_id=s.school_id,
            first_name=s.first_name,
            last_name=s.last_name,
            email=s.email,
            is_active=s.is_active,
            teacher_user_id=teacher_user_id,
            teacher_name=teacher_name,
            teacher_email=teacher_email,
        ))

    return out


@router.post("/", response_model=StudentOut)
@router.post("", response_model=StudentOut)
async def create_student(
    payload: StudentCreate,
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    try:
        # Normalize and validate school_id
        school_uuid = uuid.UUID(str(payload.school_id))

        # Verify school exists
        school = (await session.execute(select(School).where(School.id == school_uuid))).scalar_one_or_none()
        if not school:
            raise HTTPException(status_code=400, detail="School not found")

        student = Student(
            school_id=school_uuid,
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
        )
        session.add(student)
        await session.commit()
        await session.refresh(student)
        from ..schemas.student import StudentOut as StudentOutSchema
        return StudentOutSchema.from_orm(student).dict()
    except HTTPException:
        # Re-raise HTTP errors as-is
        raise
    except Exception as exc:
        # Surface useful error details during development
        raise HTTPException(status_code=500, detail=f"create_student failed: {type(exc).__name__}: {exc}")


@router.post("/create_and_assign", response_model=StudentOut)
async def create_and_assign(
    payload: dict = Body(...),
    teacher_user_id: str = Query(...),
    school_year_id: Optional[str] = Query(default=None),
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    # Normalize input
    first_name = (payload.get('first_name') or '').strip()
    last_name = (payload.get('last_name') or '').strip()
    email = (payload.get('email') or None)
    school_id = (payload.get('school_id') or None)
    if not first_name or not last_name:
        raise HTTPException(status_code=400, detail="first_name and last_name are required")

    # Ensure school exists; if missing, infer from teacher role
    if not school_id:
        teacher_role_any = (await session.execute(
            select(UserRole).where(
                UserRole.user_id == teacher_user_id,
                UserRole.role.ilike('%teacher%'),
                UserRole.is_active == True,
            )
        )).scalar_one_or_none()
        if teacher_role_any:
            school_id = str(teacher_role_any.school_id)
    if not school_id:
        raise HTTPException(status_code=400, detail="school_id is required")

    # Coerce to UUID for comparisons
    try:
        school_uuid = uuid.UUID(str(school_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid school_id format")

    school = (await session.execute(select(School).where(School.id == school_uuid))).scalar_one_or_none()
    if not school:
        raise HTTPException(status_code=400, detail="School not found")

    # Ensure teacher has teacher role in this school
    teacher_role = (await session.execute(
        select(UserRole).where(
            UserRole.user_id == uuid.UUID(str(teacher_user_id)),
            UserRole.school_id == school_uuid,
            UserRole.role.ilike('%teacher%'),
            UserRole.is_active == True,
        )
    )).scalar_one_or_none()
    if not teacher_role:
        raise HTTPException(status_code=400, detail="Selected teacher is not a teacher at this school")

    # Create or locate student by email+school (if email provided)
    student = None
    if email and '@' in email:  # Basic email validation
        student = (
            await session.execute(select(Student).where(Student.email == email, Student.school_id == school_uuid))
        ).scalar_one_or_none()
    if not student:
        student = Student(
            school_id=school_uuid,
            first_name=first_name,
            last_name=last_name,
            email=email if email and '@' in email else None,  # Only set valid emails
        )
        session.add(student)
        await session.commit()
        await session.refresh(student)

    # Create or locate a homeroom classroom for this teacher@school
    # Determine school year
    year_uuid: Optional[uuid.UUID] = None
    if school_year_id:
        try:
            year_uuid = uuid.UUID(str(school_year_id))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid school_year_id format")
    else:
        active_year = (await session.execute(select(SchoolYear).where(SchoolYear.is_active == True))).scalar_one_or_none()
        if active_year:
            year_uuid = active_year.id

    classroom = (
        await session.execute(
            select(Classroom).where(
                Classroom.school_id == school_uuid,
                Classroom.teacher_user_id == uuid.UUID(str(teacher_user_id)),
                Classroom.name.ilike('%Homeroom%'),
            )
        )
    ).scalar_one_or_none()
    if not classroom:
        classroom = Classroom(
            school_id=school_uuid,
            name=f"Homeroom - {teacher_user_id[:8]}",
            teacher_user_id=uuid.UUID(str(teacher_user_id)),
        )
        session.add(classroom)
        await session.commit()
        await session.refresh(classroom)

    # Enroll student if not already
    # Remove any existing homeroom enrollment for this school and year with other teachers
    other_enrollments = (
        await session.execute(
            select(Enrollment, Classroom)
            .join(Classroom, Classroom.id == Enrollment.classroom_id)
            .where(
                Enrollment.student_id == student.id,
                Classroom.school_id == school_uuid,
                Classroom.name.ilike('%Homeroom%'),
                Classroom.teacher_user_id != uuid.UUID(str(teacher_user_id)),
                (Enrollment.school_year_id == year_uuid) if year_uuid is not None else sa.true(),
            )
        )
    ).all()
    for enr, _cls in other_enrollments:
        await session.delete(enr)
    if other_enrollments:
        await session.commit()

    exists = (
        await session.execute(
            select(Enrollment).where(
                Enrollment.classroom_id == classroom.id,
                Enrollment.student_id == student.id,
                (Enrollment.school_year_id == year_uuid) if year_uuid is not None else sa.true(),
            )
        )
    ).scalar_one_or_none()
    if not exists:
        session.add(Enrollment(classroom_id=classroom.id, student_id=student.id, school_year_id=year_uuid))
        await session.commit()

    from ..schemas.student import StudentOut as StudentOutSchema
    return StudentOutSchema.from_orm(student).dict()


@router.post("/assign_teacher", response_model=StudentOut)
async def assign_teacher(
    student_id: str,
    teacher_user_id: str,
    school_year_id: Optional[str] = Query(default=None),
    session: AsyncSession = Depends(get_db),
    _: any = Depends(require_admin),
):
    try:
        student_uuid = uuid.UUID(str(student_id))
        teacher_uuid = uuid.UUID(str(teacher_user_id))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id format")

    student = (await session.execute(select(Student).where(Student.id == student_uuid))).scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    tr = (await session.execute(
        select(UserRole).where(
            UserRole.user_id == teacher_uuid,
            UserRole.school_id == student.school_id,
            UserRole.role.ilike('%teacher%'),
            UserRole.is_active == True,
        )
    )).scalar_one_or_none()
    if not tr:
        raise HTTPException(status_code=400, detail="User is not a teacher at the student's school")

    # Determine school year
    year_uuid: Optional[uuid.UUID] = None
    if school_year_id:
        try:
            year_uuid = uuid.UUID(str(school_year_id))
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid school_year_id format")
    else:
        active_year = (await session.execute(select(SchoolYear).where(SchoolYear.is_active == True))).scalar_one_or_none()
        if active_year:
            year_uuid = active_year.id

    classroom = (
        await session.execute(
            select(Classroom).where(
                Classroom.school_id == student.school_id,
                Classroom.teacher_user_id == teacher_uuid,
                Classroom.name.ilike('%Homeroom%'),
            )
        )
    ).scalar_one_or_none()
    if not classroom:
        classroom = Classroom(
            school_id=student.school_id,
            name=f"Homeroom - {str(teacher_uuid)[:8]}",
            teacher_user_id=teacher_uuid,
        )
        session.add(classroom)
        await session.commit()
        await session.refresh(classroom)

    # Remove any existing homeroom enrollment at this school for other teachers
    other_enrollments = (
        await session.execute(
            select(Enrollment, Classroom)
            .join(Classroom, Classroom.id == Enrollment.classroom_id)
            .where(
                Enrollment.student_id == student.id,
                Classroom.school_id == student.school_id,
                Classroom.name.ilike('%Homeroom%'),
                Classroom.teacher_user_id != teacher_uuid,
                (Enrollment.school_year_id == year_uuid) if year_uuid is not None else sa.true(),
            )
        )
    ).all()
    for enr, _cls in other_enrollments:
        await session.delete(enr)
    if other_enrollments:
        await session.commit()

    exists = (
        await session.execute(
            select(Enrollment).where(
                Enrollment.classroom_id == classroom.id,
                Enrollment.student_id == student.id,
                (Enrollment.school_year_id == year_uuid) if year_uuid is not None else sa.true(),
            )
        )
    ).scalar_one_or_none()
    if not exists:
        session.add(Enrollment(classroom_id=classroom.id, student_id=student.id, school_year_id=year_uuid))
        await session.commit()

    from ..schemas.student import StudentOut as StudentOutSchema
    return StudentOutSchema.from_orm(student).dict()


