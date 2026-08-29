import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mistakeAPI, quizAPI } from '../services/api';
import type { Mistake } from '../types';
import Layout from '../layouts/Layout';

const difficultyPill: Record<string, string> = {
  easy: 'pill-easy', medium: 'pill-medium', hard: 'pill-hard',
};

const MistakesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id!);
  const navigate = useNavigate();

  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved');
  const [practiceLoading, setPracticeLoading] = useState<number | null>(null);

  useEffect(() => {
    mistakeAPI.list(courseId).then(r => setMistakes(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [courseId]);

  const handleResolve = async (id: number) => {
    await mistakeAPI.resolve(id);
    setMistakes(prev => prev.map(m => m.id === id ? { ...m, is_resolved: true } : m));
  };

  const handlePracticeAgain = async (mistake: Mistake) => {
    setPracticeLoading(mistake.id);
    try {
      const resp = await quizAPI.generate(courseId, undefined, mistake.difficulty || 'medium', 5);
      navigate(`/courses/${courseId}/quiz?quiz=${resp.data.id}`);
    } catch {}
    setPracticeLoading(null);
  };

  const filtered = filter === 'all' ? mistakes : mistakes.filter(m => !m.is_resolved);
  const unresolvedCount = mistakes.filter(m => !m.is_resolved).length;

  if (loading) return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: 860, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }} />
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-lg)', marginBottom: '0.875rem' }} />)}
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              ❌ Mistake Review
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Learn from your incorrect answers and reinforce weak areas</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setFilter('unresolved')}
              style={{ padding: '0.4rem 0.875rem', borderRadius: 'var(--radius-pill)', fontSize: '0.8125rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: filter === 'unresolved' ? 'var(--accent-red)' : 'var(--bg-glass)', color: filter === 'unresolved' ? '#fff' : 'var(--text-secondary)' }}>
              Unresolved ({unresolvedCount})
            </button>
            <button onClick={() => setFilter('all')}
              style={{ padding: '0.4rem 0.875rem', borderRadius: 'var(--radius-pill)', fontSize: '0.8125rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: filter === 'all' ? 'var(--accent-blue)' : 'var(--bg-glass)', color: filter === 'all' ? '#fff' : 'var(--text-secondary)' }}>
              All ({mistakes.length})
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              {filter === 'unresolved' ? 'All mistakes resolved!' : 'No mistakes yet'}
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {filter === 'unresolved' ? 'Great job! Keep practicing.' : 'Take some quizzes to see your mistakes here.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map(mistake => (
              <div key={mistake.id} className="card"
                style={{ borderLeft: `4px solid ${mistake.is_resolved ? 'var(--accent-green)' : 'var(--accent-red)'}`, opacity: mistake.is_resolved ? 0.6 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Tags row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      {mistake.topic_name && (
                        <span className="tag">{mistake.topic_name}</span>
                      )}
                      {mistake.difficulty && (
                        <span className={difficultyPill[mistake.difficulty] || 'pill-medium'}>{mistake.difficulty}</span>
                      )}
                      {mistake.occurrence_count > 1 && (
                        <span style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-pill)', padding: '0.15rem 0.625rem', fontSize: '0.75rem', fontWeight: 700 }}>
                          ⚠️ Repeated {mistake.occurrence_count}×
                        </span>
                      )}
                      {mistake.is_resolved && (
                        <span style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-pill)', padding: '0.15rem 0.625rem', fontSize: '0.75rem', fontWeight: 700 }}>
                          ✓ Resolved
                        </span>
                      )}
                    </div>

                    {/* Question */}
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem', marginBottom: '0.875rem', lineHeight: 1.6 }}>
                      {mistake.question_text}
                    </p>

                    {/* Answers */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', gap: '0.625rem', padding: '0.625rem 0.875rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ color: 'var(--accent-red)', fontWeight: 700, flexShrink: 0 }}>Your answer:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{mistake.student_answer || '(no answer)'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.625rem', padding: '0.625rem 0.875rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 'var(--radius-md)' }}>
                        <span style={{ color: 'var(--accent-green)', fontWeight: 700, flexShrink: 0 }}>Correct:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{mistake.correct_answer}</span>
                      </div>
                      {mistake.explanation && (
                        <div style={{ padding: '0.75rem 0.875rem', background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.15)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                          💡 {mistake.explanation}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  {!mistake.is_resolved && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                      <button onClick={() => handlePracticeAgain(mistake)} disabled={practiceLoading === mistake.id}
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.875rem', background: 'rgba(139,92,246,0.1)', color: 'var(--accent-purple)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {practiceLoading === mistake.id ? '...' : 'Practice Again'}
                      </button>
                      <button onClick={() => handleResolve(mistake.id)}
                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.875rem', background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Mark Resolved
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MistakesPage;
