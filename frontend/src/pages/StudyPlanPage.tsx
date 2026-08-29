import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studyPlanAPI } from '../services/api';
import type { StudyTask } from '../types';
import Layout from '../layouts/Layout';

const activityIcon: Record<string, string> = {
  learn: '📖', practice: '✏️', quiz: '🧪', revise: '🔄', review_mistakes: '❌'
};

const activityColor: Record<string, string> = {
  learn: 'rgba(79,142,247,0.1)',
  practice: 'rgba(34,211,238,0.1)',
  quiz: 'rgba(139,92,246,0.1)',
  revise: 'rgba(245,158,11,0.1)',
  review_mistakes: 'rgba(239,68,68,0.1)',
};
const activityBorder: Record<string, string> = {
  learn: 'rgba(79,142,247,0.25)',
  practice: 'rgba(34,211,238,0.25)',
  quiz: 'rgba(139,92,246,0.25)',
  revise: 'rgba(245,158,11,0.25)',
  review_mistakes: 'rgba(239,68,68,0.25)',
};

const STATUS_COLORS: Record<string, { bg: string; border: string; dot: string }> = {
  pending:     { bg: 'transparent',               border: 'var(--border)',                dot: 'var(--text-muted)' },
  in_progress: { bg: 'rgba(79,142,247,0.05)',      border: 'rgba(79,142,247,0.3)',        dot: 'var(--accent-blue)' },
  completed:   { bg: 'rgba(16,185,129,0.05)',      border: 'rgba(16,185,129,0.25)',       dot: 'var(--accent-green)' },
  missed:      { bg: 'rgba(239,68,68,0.05)',       border: 'rgba(239,68,68,0.25)',        dot: 'var(--accent-red)' },
};

const StudyPlanPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id!);
  const navigate = useNavigate();

  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => { loadPlan(); }, [courseId]);

  const loadPlan = async () => {
    setLoading(true);
    try { const resp = await studyPlanAPI.get(courseId); setPlan(resp.data); } catch {}
    setLoading(false);
  };

  const generate = async () => {
    setGenerating(true); setError('');
    try { await studyPlanAPI.generate(courseId); await loadPlan(); }
    catch (err: any) { setError(err.response?.data?.detail || 'Failed to generate plan'); }
    setGenerating(false);
  };

  const updateTaskStatus = async (taskId: number, status: string) => {
    try { await studyPlanAPI.updateTask(taskId, status); await loadPlan(); } catch {}
  };

  if (loading) return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }} />
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)', marginBottom: '0.75rem' }} />)}
      </div>
    </Layout>
  );

  const tasks: StudyTask[] = plan?.tasks || [];
  const today = new Date().toDateString();

  const filteredTasks = filter === 'all' ? tasks
    : filter === 'today' ? tasks.filter(t => t.scheduled_date && new Date(t.scheduled_date).toDateString() === today)
    : filter === 'pending' ? tasks.filter(t => t.status === 'pending' || t.status === 'in_progress')
    : tasks.filter(t => t.status === filter);

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const totalCount = tasks.length;
  const completionPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const FILTERS = ['all', 'today', 'pending', 'completed', 'missed'];

  return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>📅 Study Plan</h1>
            {plan?.title && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{plan.title}</p>}
          </div>
          <button onClick={generate} disabled={generating} className="btn-primary">
            {generating ? '🔄 Generating...' : '✨ Generate New Plan'}
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {!plan?.exists ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📅</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No study plan yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Complete the diagnostic assessment first, then generate your personalized study plan.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate(`/courses/${courseId}/assessment`)} className="btn-secondary">Take Assessment First</button>
              <button onClick={generate} disabled={generating} className="btn-primary">
                {generating ? 'Generating...' : 'Generate Plan Anyway'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress card */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Overall Progress</span>
                <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{completedCount}/{totalCount} tasks</span>
              </div>
              <div className="mastery-bar-track" style={{ height: 8, marginBottom: '0.875rem' }}>
                <div className="mastery-bar-fill mastery-bar-good" style={{ width: `${completionPct}%`, transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8125rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--accent-green)' }}>✓ {completedCount} done</span>
                <span style={{ color: 'var(--accent-blue)' }}>→ {tasks.filter(t => t.status === 'in_progress').length} in progress</span>
                <span style={{ color: 'var(--text-muted)' }}>○ {tasks.filter(t => t.status === 'pending').length} pending</span>
                <span style={{ color: 'var(--accent-red)' }}>✗ {tasks.filter(t => t.status === 'missed').length} missed</span>
              </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{
                    padding: '0.4rem 0.875rem', borderRadius: 'var(--radius-pill)', fontSize: '0.8125rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                    background: filter === f ? 'var(--accent-blue)' : 'var(--bg-glass)',
                    color: filter === f ? '#fff' : 'var(--text-secondary)',
                    boxShadow: filter === f ? '0 2px 12px rgba(79,142,247,0.3)' : 'none'
                  }}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Tasks */}
            {filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No tasks for this filter</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredTasks.map(task => {
                  const sc = STATUS_COLORS[task.status] || STATUS_COLORS.pending;
                  return (
                    <div key={task.id} style={{ border: `1px solid ${sc.border}`, borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', background: sc.bg, transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', flexShrink: 0,
                          background: activityColor[task.activity_type] || 'var(--bg-glass)', border: `1px solid ${activityBorder[task.activity_type] || 'var(--border)'}` }}>
                          {activityIcon[task.activity_type] || '📌'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1 }}>
                              <h3 style={{ fontWeight: 700, color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: '0.9375rem', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                                {task.title}
                              </h3>
                              {task.topic_name && (
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>📌 {task.topic_name}</div>
                              )}
                              {task.learning_objective && (
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>🎯 {task.learning_objective}</div>
                              )}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {task.scheduled_date && <span>📅 {new Date(task.scheduled_date).toLocaleDateString()}</span>}
                                <span>⏱ {task.duration_minutes}min</span>
                                <span style={{ color: sc.dot }}>● Priority {task.priority}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flexShrink: 0 }}>
                              {task.status !== 'completed' && (
                                <button onClick={() => updateTaskStatus(task.id, 'completed')}
                                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                  Mark Done
                                </button>
                              )}
                              {task.status === 'pending' && (
                                <button onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', background: 'rgba(79,142,247,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                  Start
                                </button>
                              )}
                              {task.activity_type === 'quiz' && task.topic_id && (
                                <button onClick={() => navigate(`/courses/${courseId}/quiz?topic=${task.topic_id}`)}
                                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', background: 'rgba(139,92,246,0.1)', color: 'var(--accent-purple)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                  Take Quiz
                                </button>
                              )}
                              {(task.activity_type === 'learn' || task.activity_type === 'revise') && task.topic_id && (
                                <button onClick={() => navigate(`/courses/${courseId}/tutor?topic=${task.topic_id}`)}
                                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', background: 'rgba(79,142,247,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                  Study
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default StudyPlanPage;
