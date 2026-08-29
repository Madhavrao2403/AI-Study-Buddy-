from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.study_plan_service import study_plan_service
from app.schemas.study_plan import TaskUpdate

router = APIRouter(prefix="/api/study-plan", tags=["study-plan"])


@router.get("/{course_id}")
def get_study_plan(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = study_plan_service.get_active_plan(db, course_id, current_user.id)
    if not plan:
        return {"exists": False}

    from app.models.study_plan import StudyTask
    from app.models.topic import Topic
    tasks = db.query(StudyTask).filter(StudyTask.study_plan_id == plan.id).order_by(
        StudyTask.scheduled_date, StudyTask.priority
    ).all()

    tasks_data = []
    for t in tasks:
        topic_name = None
        if t.topic_id:
            topic = db.query(Topic).filter(Topic.id == t.topic_id).first()
            topic_name = topic.name if topic else None
        tasks_data.append({
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "topic_id": t.topic_id,
            "topic_name": topic_name,
            "activity_type": t.activity_type.value if hasattr(t.activity_type, 'value') else t.activity_type,
            "scheduled_date": t.scheduled_date,
            "duration_minutes": t.duration_minutes,
            "priority": t.priority,
            "status": t.status.value if hasattr(t.status, 'value') else t.status,
            "learning_objective": t.learning_objective,
            "completed_at": t.completed_at,
        })

    return {
        "exists": True,
        "id": plan.id,
        "title": plan.title,
        "description": plan.description,
        "start_date": plan.start_date,
        "is_active": plan.is_active,
        "tasks": tasks_data,
    }


@router.post("/{course_id}/generate")
def generate_study_plan(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    plan = study_plan_service.generate_plan(db, course_id, current_user.id)
    return {"message": "Study plan generated", "plan_id": plan.id}


@router.put("/tasks/{task_id}")
def update_task(
    task_id: int,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = study_plan_service.update_task_status(db, task_id, current_user.id, data.status)
    return {
        "id": task.id,
        "status": task.status.value if hasattr(task.status, 'value') else task.status,
        "completed_at": task.completed_at,
    }
