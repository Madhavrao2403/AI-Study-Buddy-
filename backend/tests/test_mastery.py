from app.services.mastery_service import mastery_service, get_weakness_level
from app.core.database import Base
from app.models import *  # noqa


def test_weakness_level():
    assert get_weakness_level(0) == "critical"
    assert get_weakness_level(25) == "critical"
    assert get_weakness_level(40) == "needs_attention"
    assert get_weakness_level(60) == "developing"
    assert get_weakness_level(80) == "good"
    assert get_weakness_level(95) == "mastered"


def test_mastery_update():
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    import tempfile, os

    # Use a temp file for the db so Windows can release it
    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.close()
    db_path = tmp.name

    engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    Session = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = Session()

    try:
        user = User(email="mastery@test.com", hashed_password="hashed", full_name="Test")
        db.add(user)
        db.flush()
        course = Course(user_id=user.id, name="Test Course")
        db.add(course)
        db.flush()
        topic = Topic(course_id=course.id, name="Test Topic")
        db.add(topic)
        db.flush()
        db.commit()

        # First update from 0 to 80% score
        mastery = mastery_service.update_mastery(db, user.id, course.id, topic.id, 80.0, "quiz")
        assert mastery.mastery_score > 0
        assert mastery.quiz_count == 1
        assert mastery.weakness_level in ["critical", "needs_attention", "developing", "good", "mastered"]

        first_score = mastery.mastery_score

        # Second update - poor score
        mastery2 = mastery_service.update_mastery(db, user.id, course.id, topic.id, 20.0, "quiz")
        assert mastery2.quiz_count == 2
        expected = first_score * 0.6 + 20.0 * 0.4
        assert abs(mastery2.mastery_score - expected) < 1.0

    finally:
        db.close()
        engine.dispose()
        try:
            os.unlink(db_path)
        except Exception:
            pass
