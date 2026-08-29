import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseAPI, documentAPI, assessmentAPI } from '../services/api';
import type { Course, Topic, Document } from '../types';
import Layout from '../layouts/Layout';

const getMasteryClass = (m: number) => {
  if (m >= 86) return 'mastery-bar-mastered';
  if (m >= 71) return 'mastery-bar-good';
  if (m >= 51) return 'mastery-bar-developing';
  if (m >= 31) return 'mastery-bar-needs-attention';
  return 'mastery-bar-critical';
};

const difficultyPill: Record<string, string> = {
  easy: 'pill-easy', medium: 'pill-medium', hard: 'pill-hard',
};

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id!);
  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadAll(); }, [courseId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [courseResp, docsResp, assessResp] = await Promise.all([
        courseAPI.get(courseId),
        documentAPI.list(courseId),
        assessmentAPI.get(courseId).catch(() => ({ data: { exists: false } })),
      ]);
      setCourse(courseResp.data);
      setDocuments(docsResp.data);
      setAssessment(assessResp.data);
      if (courseResp.data.status === 'ready') {
        const topicsResp = await courseAPI.getTopics(courseId);
        setTopics(topicsResp.data);
      }
    } catch {}
    setLoading(false);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true); setError('');
    try { await courseAPI.analyze(courseId); await loadAll(); }
    catch (err: any) { setError(err.response?.data?.detail || 'Analysis failed'); }
    setAnalyzing(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { await documentAPI.upload(courseId, file); await loadAll(); }
    catch (err: any) { setError(err.response?.data?.detail || 'Upload failed'); }
    setUploading(false);
    e.target.value = '';
  };

  const handleDeleteDoc = async (docId: number) => {
    try { await documentAPI.delete(docId); await loadAll(); } catch {}
  };

  if (loading) return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
          <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
        </div>
      </div>
    </Layout>
  );
  if (!course) return <Layout><div style={{ padding: '2rem', textAlign: 'center', color: 'var(--accent-red)' }}>Course not found</div></Layout>;

  return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
        {/* Breadcrumb + Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            <Link to="/courses" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Courses</Link>
            <span>/</span>
            <span style={{ color: 'var(--text-primary)' }}>{course.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                {course.name}
              </h1>
              {course.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{course.description}</p>}
            </div>
            <span style={{
              fontSize: '0.75rem', padding: '0.3rem 0.875rem', borderRadius: 'var(--radius-pill)',
              background: course.status === 'ready' ? 'rgba(16,185,129,0.12)' : course.status === 'analyzing' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
              color: course.status === 'ready' ? 'var(--accent-green)' : course.status === 'analyzing' ? 'var(--accent-orange)' : 'var(--text-muted)',
              border: `1px solid ${course.status === 'ready' ? 'rgba(16,185,129,0.25)' : course.status === 'analyzing' ? 'rgba(245,158,11,0.25)' : 'var(--border)'}`,
              fontWeight: 600, textTransform: 'capitalize'
            }}>{course.status}</span>
          </div>
        </div>

        {/* Mastery Banner */}
        <div className="card card-glow-blue" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-blue)', lineHeight: 1 }}>{Math.round(course.overall_mastery)}%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Overall Mastery</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="mastery-bar-track" style={{ height: 8 }}>
              <div className={`mastery-bar-fill ${getMasteryClass(course.overall_mastery)}`} style={{ width: `${course.overall_mastery}%` }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to={`/courses/${courseId}/progress`} className="btn-secondary" style={{ fontSize: '0.8125rem' }}>📊 Progress</Link>
            <Link to={`/courses/${courseId}/study-plan`} className="btn-secondary" style={{ fontSize: '0.8125rem' }}>📅 Study Plan</Link>
            <Link to={`/courses/${courseId}/tutor`} className="btn-primary" style={{ fontSize: '0.8125rem' }}>🤖 AI Tutor</Link>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
          {/* Left sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Documents */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: '1rem' }}>📄 Study Materials</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {documents.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.75rem', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: '1.1rem' }}>{doc.file_type === 'pdf' ? '📕' : doc.file_type === 'docx' ? '📘' : '📄'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.original_filename}</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                        {doc.total_chunks} chunks · {(doc.file_size / 1024).toFixed(0)}KB ·{' '}
                        <span style={{ color: doc.processing_status === 'ready' ? 'var(--accent-green)' : doc.processing_status === 'error' ? 'var(--accent-red)' : 'var(--accent-orange)' }}>
                          {doc.processing_status}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteDoc(doc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '0.125rem' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-red)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >✕</button>
                  </div>
                ))}
                {documents.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '1.5rem 0' }}>No documents uploaded yet</div>
                )}
              </div>
              <label className="btn-secondary" style={{ width: '100%', textAlign: 'center', cursor: 'pointer', display: 'block', fontSize: '0.8125rem' }}>
                {uploading ? '⏳ Uploading...' : '+ Upload Document'}
                <input type="file" accept=".pdf,.txt,.docx" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>

            {/* Actions */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: '1rem' }}>🚀 Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <button onClick={handleAnalyze} disabled={analyzing || documents.length === 0} className="btn-primary" style={{ width: '100%', fontSize: '0.8125rem' }}>
                  {analyzing ? '🔄 Analyzing Course...' : '🔬 Analyze Course'}
                </button>
                {course.status === 'ready' && (
                  <>
                    <Link to={`/courses/${courseId}/assessment`} className="btn-secondary" style={{ width: '100%', textAlign: 'center', fontSize: '0.8125rem' }}>📋 Take Assessment</Link>
                    <Link to={`/courses/${courseId}/study-plan`} className="btn-secondary" style={{ width: '100%', textAlign: 'center', fontSize: '0.8125rem' }}>📅 View Study Plan</Link>
                    <Link to={`/courses/${courseId}/mistakes`} className="btn-secondary" style={{ width: '100%', textAlign: 'center', fontSize: '0.8125rem' }}>❌ Review Mistakes</Link>
                  </>
                )}
              </div>
              {documents.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>Upload documents first to analyze</p>
              )}
            </div>

            {/* Assessment Results */}
            {assessment?.exists && assessment.status === 'completed' && (
              <div className="card" style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}>
                <div className="section-title" style={{ marginBottom: '0.75rem', color: 'var(--accent-green)' }}>📊 Assessment Results</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '0.75rem' }}>{Math.round(assessment.overall_score || 0)}%</div>
                {assessment.strong_topics?.length > 0 && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-green)', marginBottom: '0.25rem' }}>✅ Strong:</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{assessment.strong_topics.slice(0, 3).join(', ')}</div>
                  </div>
                )}
                {assessment.weak_topics?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-red)', marginBottom: '0.25rem' }}>⚠️ Needs work:</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{assessment.weak_topics.slice(0, 3).join(', ')}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Topics grid */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div className="section-title">📌 Course Topics</div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{topics.length} topics</span>
            </div>
            {topics.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                {course.status === 'ready' ? 'No topics found' : 'Analyze the course to generate topics'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {topics.map((topic, idx) => (
                  <div key={topic.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', transition: 'border-color 0.2s', background: 'var(--bg-glass)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-accent)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{idx + 1}</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{topic.name}</span>
                          <span className={difficultyPill[topic.difficulty] || 'pill-medium'}>{topic.difficulty}</span>
                        </div>
                        {topic.description && (
                          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{topic.description}</p>
                        )}
                        {topic.subtopics && topic.subtopics.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.375rem' }}>
                            {topic.subtopics.slice(0, 4).map(sub => (
                              <span key={sub.id} className="tag">{sub.name}</span>
                            ))}
                            {topic.subtopics.length > 4 && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{topic.subtopics.length - 4} more</span>
                            )}
                          </div>
                        )}
                        {topic.prerequisites && topic.prerequisites.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Requires: {topic.prerequisites.join(', ')}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', flexShrink: 0 }}>
                        <Link to={`/courses/${courseId}/tutor?topic=${topic.id}`}
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', background: 'rgba(79,142,247,0.1)', color: 'var(--accent-blue)', borderRadius: 'var(--radius-md)', textDecoration: 'none', textAlign: 'center', border: '1px solid rgba(79,142,247,0.2)', whiteSpace: 'nowrap' }}>
                          Ask AI
                        </Link>
                        <Link to={`/courses/${courseId}/quiz?topic=${topic.id}`}
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', background: 'rgba(139,92,246,0.1)', color: 'var(--accent-purple)', borderRadius: 'var(--radius-md)', textDecoration: 'none', textAlign: 'center', border: '1px solid rgba(139,92,246,0.2)', whiteSpace: 'nowrap' }}>
                          Take Quiz
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetailPage;
