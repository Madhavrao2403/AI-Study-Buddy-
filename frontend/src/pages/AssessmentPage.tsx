import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentAPI } from '../services/api';
import Layout from '../layouts/Layout';
import type { Question } from '../types';

const AssessmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id!);
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => { loadOrCreate(); }, [courseId]);

  const loadOrCreate = async () => {
    setLoading(true);
    try {
      const existing = await assessmentAPI.get(courseId);
      if (existing.data.exists && existing.data.status === 'completed') {
        setResults(existing.data); setLoading(false); return;
      }
      const resp = await assessmentAPI.create(courseId);
      setAssessment(resp.data);
      setQuestions(resp.data.questions || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Could not start assessment');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      if (!confirm(`You have ${questions.length - Object.keys(answers).length} unanswered questions. Submit anyway?`)) return;
    }
    setSubmitting(true);
    try {
      const submData = { answers: questions.map(q => ({ question_id: q.id, student_answer: answers[q.id] || '' })) };
      const resp = await assessmentAPI.submit(courseId, assessment.assessment_id, submData);
      setResults(resp.data);
    } catch (err: any) { setError(err.response?.data?.detail || 'Submission failed'); }
    setSubmitting(false);
  };

  if (loading) return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <div className="skeleton" style={{ height: 12, width: '100%', borderRadius: 99, marginBottom: '2rem' }} />
        </div>
        <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ height: 48, borderRadius: 'var(--radius-md)' }} />
        <div style={{ color: 'var(--text-secondary)', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          🤖 Preparing your diagnostic assessment...
        </div>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <div style={{ color: 'var(--accent-red)', marginBottom: '1.5rem' }}>{error}</div>
          <button onClick={() => navigate(`/courses/${courseId}`)} className="btn-secondary">Back to Course</button>
        </div>
      </div>
    </Layout>
  );

  // Results view
  if (results && (results.status === 'completed' || results.overall_score !== undefined)) {
    return (
      <Layout>
        <div style={{ padding: '2rem', maxWidth: 760, margin: '0 auto' }} className="animate-slide-up">
          {/* Score card */}
          <div className="card card-glow-blue" style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '2.5rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎯</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Assessment Complete!</h1>
            <div style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '0.25rem' }}
              className="gradient-text">{Math.round(results.overall_score || 0)}%</div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Your diagnostic assessment score</p>
          </div>

          {results.strong_topics?.length > 0 && (
            <div className="card" style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--accent-green)', marginBottom: '0.75rem' }}>✅ Strong Topics</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {results.strong_topics.map((t: string) => (
                  <span key={t} style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', padding: '0.3rem 0.875rem', borderRadius: 'var(--radius-pill)', fontSize: '0.8125rem', fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {results.weak_topics?.length > 0 && (
            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--accent-red)', marginBottom: '0.75rem' }}>⚠️ Needs Work</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {results.weak_topics.map((t: string) => (
                  <span key={t} style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', padding: '0.3rem 0.875rem', borderRadius: 'var(--radius-pill)', fontSize: '0.8125rem', fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {results.topic_scores && (
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>📊 Topic Performance</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(results.topic_scores).map(([topic, score]) => {
                  const s = Number(score);
                  const barClass = s >= 70 ? 'mastery-bar-good' : s >= 40 ? 'mastery-bar-developing' : 'mastery-bar-critical';
                  return (
                    <div key={topic}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{topic}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{Math.round(s)}%</span>
                      </div>
                      <div className="mastery-bar-track">
                        <div className={`mastery-bar-fill ${barClass}`} style={{ width: `${s}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.875rem' }}>
            <button onClick={() => navigate(`/courses/${courseId}/study-plan`)} className="btn-primary" style={{ flex: 1 }}>
              Generate Personalized Study Plan →
            </button>
            <button onClick={() => navigate(`/courses/${courseId}`)} className="btn-secondary">Back to Course</button>
          </div>
        </div>
      </Layout>
    );
  }

  const q = questions[current];
  if (!q) return <Layout><div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No questions available</div></Layout>;

  const progress = ((current + 1) / questions.length) * 100;

  return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: 760, margin: '0 auto' }}>
        {/* Progress header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>🎯 Diagnostic Assessment</h1>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{current + 1} / {questions.length}</span>
          </div>
          <div className="mastery-bar-track" style={{ height: 8 }}>
            <div className="mastery-bar-fill mastery-bar-good" style={{ width: `${progress}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Question card */}
        <div className="card animate-fade-in" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <span className={q.difficulty === 'easy' ? 'pill-easy' : q.difficulty === 'medium' ? 'pill-medium' : 'pill-hard'}>{q.difficulty}</span>
            {q.topic_name && <span className="tag">{q.topic_name}</span>}
            {q.question_type && <span className="tag">{q.question_type.replace('_', ' ')}</span>}
          </div>

          <p style={{ fontSize: '1.0625rem', color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: '1.5rem', fontWeight: 500 }}>
            {q.question_text}
          </p>

          {q.question_type === 'mcq' && q.options && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {q.options.map((opt, oi) => {
                const letters = ['A', 'B', 'C', 'D'];
                const isSelected = answers[q.id] === opt;
                return (
                  <button key={opt} onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                    className={`quiz-option ${isSelected ? 'selected' : ''}`}>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                      background: isSelected ? 'var(--accent-blue)' : 'rgba(255,255,255,0.06)', color: isSelected ? '#fff' : 'var(--text-secondary)' }}>
                      {letters[oi] || oi + 1}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.question_type === 'true_false' && (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {['True', 'False'].map(opt => (
                <button key={opt} onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                  className={`quiz-option ${answers[q.id] === opt ? 'selected' : ''}`}
                  style={{ flex: 1, justifyContent: 'center', fontWeight: 700 }}>
                  {opt === 'True' ? '✓ True' : '✗ False'}
                </button>
              ))}
            </div>
          )}

          {q.question_type === 'short_answer' && (
            <textarea className="input" rows={4} placeholder="Write your answer here..."
              value={answers[q.id] || ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} />
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} className="btn-secondary"
            style={{ opacity: current === 0 ? 0.4 : 1 }}>← Prev</button>

          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {questions.map((_, idx) => (
              <button key={idx} onClick={() => setCurrent(idx)} style={{
                width: 28, height: 28, borderRadius: '50%', fontSize: '0.6875rem', fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: idx === current ? 'var(--accent-blue)' : answers[questions[idx].id] ? 'rgba(16,185,129,0.2)' : 'var(--bg-glass)',
                color: idx === current ? '#fff' : answers[questions[idx].id] ? '#34d399' : 'var(--text-muted)'
              }}>{idx + 1}</button>
            ))}
          </div>

          {current < questions.length - 1 ? (
            <button onClick={() => setCurrent(current + 1)} className="btn-primary">Next →</button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
              {submitting ? '⏳ Evaluating...' : '✓ Submit Assessment'}
            </button>
          )}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginTop: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AssessmentPage;
