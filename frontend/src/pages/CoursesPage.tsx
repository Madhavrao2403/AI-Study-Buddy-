import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseAPI } from '../services/api';
import type { Course } from '../types';
import Layout from '../layouts/Layout';

const statusDot = (status: string) => {
  if (status === 'ready') return <span className="status-dot status-dot-green" />;
  if (status === 'analyzing') return <span className="status-dot status-dot-yellow" />;
  return <span className="status-dot status-dot-red" />;
};

const getMasteryClass = (m: number) => {
  if (m >= 86) return 'mastery-bar-mastered';
  if (m >= 71) return 'mastery-bar-good';
  if (m >= 51) return 'mastery-bar-developing';
  if (m >= 31) return 'mastery-bar-needs-attention';
  return 'mastery-bar-critical';
};

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', subject: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async () => {
    setLoading(true);
    try { const resp = await courseAPI.list(); setCourses(resp.data); } catch {}
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true); setError('');
    try {
      await courseAPI.create(form);
      setShowCreate(false);
      setForm({ name: '', description: '', subject: '' });
      await loadCourses();
    } catch (err: any) { setError(err.response?.data?.detail || 'Failed to create course'); }
    setCreating(false);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm('Delete this course and all its data?')) return;
    try { await courseAPI.delete(id); await loadCourses(); } catch {}
  };

  return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              My Courses
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Your personalized AI-powered learning library</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">+ New Course</button>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Create New Course</h2>
              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Course Name *</label>
                  <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="e.g., Python Programming" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Subject</label>
                  <input className="input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g., Computer Science" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Description</label>
                  <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What will you learn in this course?" />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button type="submit" className="btn-primary" disabled={creating} style={{ flex: 1 }}>
                    {creating ? 'Creating...' : 'Create Course'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📚</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No courses yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Create your first course to begin your personalized AI learning journey</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">Create Your First Course</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {courses.map(course => (
              <div key={course.id} className="course-card-wrap animate-fade-in">
                <Link to={`/courses/${course.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div className="card" style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ flex: 1, minWidth: 0, marginRight: '0.75rem' }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {course.name}
                        </h3>
                        {course.subject && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{course.subject}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexShrink: 0 }}>
                        {statusDot(course.status)}
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{course.status}</span>
                      </div>
                    </div>

                    {course.description && (
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {course.description}
                      </p>
                    )}

                    {/* Mastery */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mastery Progress</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{Math.round(course.overall_mastery)}%</span>
                      </div>
                      <div className="mastery-bar-track">
                        <div className={`mastery-bar-fill ${getMasteryClass(course.overall_mastery)}`} style={{ width: `${course.overall_mastery}%` }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>📄 {course.document_count || 0} docs</span>
                      <span>📌 {course.topic_count || 0} topics</span>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={(e) => handleDelete(course.id, e)}
                  className="btn-danger delete-btn"
                  style={{ padding: '0.25rem 0.625rem', fontSize: '0.6875rem' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CoursesPage;
