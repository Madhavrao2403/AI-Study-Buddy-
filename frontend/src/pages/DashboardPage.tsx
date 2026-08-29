import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { courseAPI, adaptiveAPI, studyPlanAPI, progressAPI } from '../services/api';
import type { Course, StudyTask } from '../types';
import Layout from '../layouts/Layout';
import { getMasteryColor } from '../utils/helpers';

const S = {
  page: { padding: '1.75rem', maxWidth: 1100, margin: '0 auto' } as React.CSSProperties,
  header: { marginBottom: '1.75rem' } as React.CSSProperties,
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' } as React.CSSProperties,
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' } as React.CSSProperties,
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' } as React.CSSProperties,
};

const activityLabel: Record<string, { icon: string; color: string }> = {
  learn: { icon: '📖', color: 'var(--accent-blue)' },
  practice: { icon: '✏️', color: 'var(--accent-purple)' },
  quiz: { icon: '🧪', color: 'var(--accent-cyan)' },
  revise: { icon: '🔄', color: 'var(--accent-orange)' },
  review_mistakes: { icon: '🎯', color: 'var(--accent-red)' },
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [todayTasks, setTodayTasks] = useState<StudyTask[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const coursesResp = await courseAPI.list();
      const courseList: Course[] = coursesResp.data;
      setCourses(courseList);

      if (courseList.length > 0) {
        const main = courseList[0];
        await Promise.allSettled([
          studyPlanAPI.get(main.id).then(r => {
            if (r.data.exists && r.data.tasks) {
              const today = new Date().toDateString();
              setTodayTasks(r.data.tasks.filter((t: StudyTask) =>
                t.scheduled_date && new Date(t.scheduled_date).toDateString() === today
              ).slice(0, 5));
            }
          }),
          adaptiveAPI.dashboardRecommendation(main.id).then(r => setRecommendation(r.data)),
          progressAPI.get(main.id).then(r => setProgress(r.data)),
        ]);
      }
    } catch {}
    setLoading(false);
  };

  const overallMastery = courses.length > 0
    ? Math.round(courses.reduce((s, c) => s + c.overall_mastery, 0) / courses.length)
    : 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  if (loading) return (
    <Layout>
      <div style={{ ...S.page }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 90, flex: 1, borderRadius: 16 }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
          <div className="skeleton" style={{ height: 240, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 240, borderRadius: 16 }} />
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div style={S.page} className="animate-fade-in">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>{greeting} ☀️</p>
              <h1 style={{ fontSize: '1.625rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                {firstName}<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>'s Dashboard</span>
              </h1>
            </div>
            {courses.length > 0 && (
              <Link to={`/courses/${courses[0].id}/tutor`} className="btn-primary" style={{ fontSize: '0.8125rem' }}>
                🤖 Open AI Tutor
              </Link>
            )}
          </div>
        </div>

        {/* Stat cards */}
        <div style={S.grid4}>
          {[
            { label: 'Overall Mastery', value: `${overallMastery}%`, sub: `${courses.length} course${courses.length !== 1 ? 's' : ''}`, accent: 'stat-card-blue', color: 'var(--accent-blue)' },
            { label: 'Today\'s Tasks', value: `${todayTasks.filter(t => t.status === 'completed').length}/${todayTasks.length}`, sub: todayTasks.length > 0 ? 'completed' : 'no tasks today', accent: 'stat-card-green', color: 'var(--accent-green)' },
            { label: 'Quiz Avg Score', value: progress ? `${progress.average_quiz_score}%` : '—', sub: `${progress?.quiz_attempts || 0} attempts`, accent: 'stat-card-purple', color: 'var(--accent-purple)' },
            { label: 'Study Streak', value: `${progress?.study_streak_days || 0}`, sub: 'days 🔥', accent: 'stat-card-orange', color: 'var(--accent-orange)' },
          ].map((s, i) => (
            <div key={i} className={`stat-card ${s.accent}`} style={{ animationDelay: `${i * 60}ms` }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{s.label}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          {/* Today's Plan */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <div className="section-title">Today's Learning</div>
                <div className="section-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
              </div>
              {courses.length > 0 && (
                <Link to={`/courses/${courses[0].id}/study-plan`} className="btn-ghost" style={{ fontSize: '0.75rem' }}>View all →</Link>
              )}
            </div>
            {todayTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📅</div>
                <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>No tasks scheduled</div>
                {courses.length > 0 ? (
                  <Link to={`/courses/${courses[0].id}/study-plan`} style={{ color: 'var(--accent-blue)', fontSize: '0.8125rem' }}>Generate study plan →</Link>
                ) : (
                  <Link to="/courses" style={{ color: 'var(--accent-blue)', fontSize: '0.8125rem' }}>Create a course →</Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {todayTasks.map(task => {
                  const act = activityLabel[task.activity_type] || { icon: '📌', color: 'var(--text-secondary)' };
                  const done = task.status === 'completed';
                  return (
                    <div key={task.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.75rem', borderRadius: 'var(--radius-md)',
                      background: done ? 'rgba(16,185,129,0.06)' : 'var(--bg-glass)',
                      border: `1px solid ${done ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
                    }}>
                      <span style={{ fontSize: '1.125rem', flexShrink: 0 }}>{act.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {task.title}
                        </div>
                        {task.topic_name && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.topic_name} · {task.duration_minutes}min</div>}
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: done ? 'var(--accent-green)' : task.status === 'in_progress' ? 'var(--accent-blue)' : 'var(--text-muted)', boxShadow: done ? '0 0 6px var(--accent-green)' : 'none' }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Recommendation */}
          <div className="card card-glow-purple" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(79,142,247,0.05) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🤖</div>
              <div>
                <div className="section-title" style={{ fontSize: '0.9375rem' }}>AI Recommendation</div>
                <div className="section-subtitle">Based on your performance</div>
              </div>
            </div>
            {recommendation ? (
              <>
                <div style={{ marginBottom: '0.625rem' }}>
                  <span style={{
                    display: 'inline-block', padding: '0.2rem 0.625rem', borderRadius: 'var(--radius-pill)',
                    fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                    background: recommendation.urgency === 'high' ? 'rgba(239,68,68,0.15)' : recommendation.urgency === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.12)',
                    color: recommendation.urgency === 'high' ? '#f87171' : recommendation.urgency === 'medium' ? '#fbbf24' : '#34d399',
                    border: `1px solid ${recommendation.urgency === 'high' ? 'rgba(239,68,68,0.25)' : recommendation.urgency === 'medium' ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.2)'}`,
                  }}>{recommendation.urgency} priority</span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', lineHeight: 1.3 }}>{recommendation.title}</h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>{recommendation.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  {courses.length > 0 && (
                    <Link to={`/courses/${courses[0].id}/tutor`} className="btn-primary" style={{ fontSize: '0.8125rem', flex: 1, justifyContent: 'center' }}>
                      Start Session →
                    </Link>
                  )}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>~{recommendation.estimated_minutes}min</span>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {courses.length === 0 ? 'Create a course to unlock AI recommendations' : 'Take your diagnostic assessment to get recommendations'}
              </div>
            )}
          </div>
        </div>

        {/* Courses + Mastery */}
        {courses.length > 0 ? (
          <div style={S.grid3}>
            {courses.slice(0, 3).map(course => (
              <Link key={course.id} to={`/courses/${course.id}`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.5rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.name}</div>
                      {course.subject && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{course.subject}</div>}
                    </div>
                    <div style={{
                      flexShrink: 0, fontSize: '0.6875rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-pill)',
                      background: course.status === 'ready' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                      color: course.status === 'ready' ? '#34d399' : '#fbbf24',
                      border: `1px solid ${course.status === 'ready' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    }}>{course.status}</div>
                  </div>
                  <div style={{ marginBottom: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overall Mastery</span>
                      <span style={{ fontSize: '0.875rem', fontWeight: 800, color: getMasteryColor(course.overall_mastery) }}>{Math.round(course.overall_mastery)}%</span>
                    </div>
                    <div className="mastery-bar-track">
                      <div className="mastery-bar-fill mastery-bar-mastered" style={{ width: `${course.overall_mastery}%` }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>📄 {course.document_count || 0}</span>
                    <span>📌 {course.topic_count || 0} topics</span>
                    {(course.weak_topics?.length || 0) > 0 && (
                      <span style={{ color: '#f87171' }}>⚠ {course.weak_topics?.length} weak</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', borderStyle: 'dashed' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>Start your learning journey</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 360, margin: '0 auto 1.5rem' }}>
              Create your first course, upload study materials, and let AI build your personalized learning path.
            </p>
            <Link to="/courses" className="btn-primary">Create Your First Course</Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
