from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional, List
from datetime import datetime
from app.models.study_plan import StudyPlan, StudyTask, TaskStatus
from app.models.topic import Topic
from app.models.mastery import TopicMastery
from app.models.student_profile import StudentProfile
from app.ai.agents.study_planner import StudyPlannerAgent
from app.services.mastery_service import mastery_service
import logging

logger = logging.getLogger(__name__)


class StudyPlanService:
    def get_active_plan(self, db: Session, course_id: int, user_id: int) -> Optional[StudyPlan]:
        return db.query(StudyPlan).filter(
            StudyPlan.course_id == course_id,
            StudyPlan.user_id == user_id,
            StudyPlan.is_active == True,
        ).order_by(StudyPlan.created_at.desc()).first()

    def generate_plan(self, db: Session, course_id: int, user_id: int) -> StudyPlan:
        topics = db.query(Topic).filter(Topic.course_id == course_id).all()
        if not topics:
            raise HTTPException(400, "Course must be analyzed first. No topics found.")

        profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
        student_profile = {
            "daily_study_time_minutes": profile.daily_study_time_minutes if profile else 60,
            "preferred_explanation_style": profile.preferred_explanation_style.value if profile and profile.preferred_explanation_style else "simple",
        }
        exam_date = profile.exam_date.strftime("%Y-%m-%d") if profile and profile.exam_date else None

        mastery_data = mastery_service.get_course_mastery(db, user_id, course_id)
        weak_topics = [m["topic_name"] for m in mastery_data if m["mastery_score"] < 50]

        topics_data = [
            {
                "name": t.name,
                "difficulty": t.difficulty.value if hasattr(t.difficulty, 'value') else t.difficulty,
                "prerequisites": t.prerequisites or [],
            }
            for t in topics
        ]

        from app.models.course import Course
        course = db.query(Course).filter(Course.id == course_id).first()

        agent = StudyPlannerAgent()
        result = agent.generate_plan(
            course_name=course.name,
            topics=topics_data,
            mastery_data=mastery_data,
            student_profile=student_profile,
            exam_date=exam_date,
            existing_weak_topics=weak_topics,
        )

        # Deactivate old plans
        db.query(StudyPlan).filter(
            StudyPlan.course_id == course_id,
            StudyPlan.user_id == user_id,
            StudyPlan.is_active == True,
        ).update({"is_active": False})

        plan = StudyPlan(
            course_id=course_id,
            user_id=user_id,
            title=result.title,
            description=result.description,
            start_date=datetime.utcnow(),
            is_active=True,
        )
        db.add(plan)
        db.flush()

        topic_map = {t.name.lower(): t.id for t in topics}

        for task_data in result.tasks:
            topic_id = None
            if task_data.topic_name:
                topic_id = next(
                    (v for k, v in topic_map.items() if task_data.topic_name.lower() in k or k in task_data.topic_name.lower()),
                    None
                )

            scheduled_date = None
            if task_data.scheduled_date:
                try:
                    scheduled_date = datetime.strptime(task_data.scheduled_date, "%Y-%m-%d")
                except ValueError:
                    pass

            task = StudyTask(
                study_plan_id=plan.id,
                topic_id=topic_id,
                title=task_data.title,
                description=task_data.description,
                activity_type=task_data.activity_type,
                scheduled_date=scheduled_date,
                duration_minutes=task_data.duration_minutes,
                priority=task_data.priority,
                learning_objective=task_data.learning_objective,
            )
            db.add(task)

        db.commit()
        db.refresh(plan)
        return plan

    def update_task_status(
        self, db: Session, task_id: int, user_id: int, new_status: str
    ) -> StudyTask:
        task = db.query(StudyTask).filter(StudyTask.id == task_id).first()
        if not task:
            raise HTTPException(404, "Task not found")

        # Verify ownership
        plan = db.query(StudyPlan).filter(
            StudyPlan.id == task.study_plan_id,
            StudyPlan.user_id == user_id,
        ).first()
        if not plan:
            raise HTTPException(403, "Not authorized")

        valid_statuses = [s.value for s in TaskStatus]
        if new_status not in valid_statuses:
            raise HTTPException(400, f"Invalid status. Must be one of: {valid_statuses}")

        task.status = new_status
        if new_status == "completed":
            task.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
        return task

    def adapt_plan(self, db: Session, course_id: int, user_id: int, topic_id: int, action: str):
        """Adapt the study plan based on adaptive agent recommendation."""
        plan = self.get_active_plan(db, course_id, user_id)
        if not plan:
            return

        topic = db.query(Topic).filter(Topic.id == topic_id).first()
        if not topic:
            return

        if action in ["RETEACH", "REVIEW_MISTAKES"]:
            # Add urgent revision tasks
            from datetime import timedelta
            for i in range(2):
                task = StudyTask(
                    study_plan_id=plan.id,
                    topic_id=topic_id,
                    title=f"{'Re-study' if action == 'RETEACH' else 'Review Mistakes'}: {topic.name}",
                    description=f"AI detected weakness. Focus on: {topic.name}",
                    activity_type="revise" if action == "RETEACH" else "review_mistakes",
                    scheduled_date=datetime.utcnow() + timedelta(days=i),
                    duration_minutes=20,
                    priority=1,
                    learning_objective=f"Strengthen understanding of {topic.name}",
                )
                db.add(task)

        elif action == "INCREASE_DIFFICULTY":
            task = StudyTask(
                study_plan_id=plan.id,
                topic_id=topic_id,
                title=f"Advanced Practice: {topic.name}",
                description="Ready for harder challenges!",
                activity_type="practice",
                scheduled_date=datetime.utcnow(),
                duration_minutes=30,
                priority=3,
            )
            db.add(task)

        db.commit()


study_plan_service = StudyPlanService()
