import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { quizAPI, courseAPI } from '../services/api';
import type { Quiz, Topic } from '../types';
import Layout from '../layouts/Layout';

const letterLabels = ['A', 'B', 'C', 'D', 'E'];

const QuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const courseId = parseInt(id!);
  const topicIdParam = searchParams.get('topic');
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');

  const [selectedTopic, setSelectedTopic] = useState<string>(topicIdParam || '');
  const [difficulty, setDifficulty] = useState('');
  const [numQ, setNumQ] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(!!topicIdParam);

  useEffect(() => {
    courseAPI.getTopics(courseId).then(r => {
      setTopics(r.data);
      // Auto-generate when topic param is present
      if (topicIdParam && r.data.length > 0) {
        generateQuiz(topicIdParam, '', 10);
      }
    }).catch(() => { setAutoGenerate(false); });
  }, [courseId]);

  const generateQuiz = async (topicId = selectedTopic, diff = difficulty, count = numQ) => {
    setGenerating(true);
    setError('');
    try {
      const resp = await quizAPI.generate(
        courseId,
        topicId ? parseInt(topicId) : undefined,
        diff || undefined,
        count,
      );
      setQuiz(resp.data);
      setAnswers({});
      setCurrent(0);
      setResults(null);
      setAutoGenerate(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate quiz. Make sure the course has been analyzed first.');
      setAutoGenerate(false);
    }
    setGenerating(false);
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const resp = await quizAPI.submit(quiz.id, {
        answers: quiz.questions.map(q => ({
          question_id: q.id,
          student_answer: answers[q.id] || '',
        })),
      });
      setResults(resp.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Submission failed');
    }
    setSubmitting(false);
  };

  // Auto-generating state
  if (autoGenerate || (generating && !quiz)) {
    return (
      <Layout>
        <div style={{ padding: '3rem', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: '0 8px 24px rgba(139,92,246,0.3)' }}>🧪</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Generating Your Quiz</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            AI is crafting questions{topicIdParam && topics.find(t => t.id === parseInt(topicIdParam)) ? ` for ${topics.find(t => t.id === parseInt(topicIdParam))!.name}` : ''}…
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
          </div>
          {error && (
            <div style={{ marginTop: '1.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.875rem' }}>
              {error}
              <br />
              <button onClick={() => { setAutoGenerate(false); setError(''); }} style={{ color: 'var(--accent-blue)', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.8125rem' }}>Configure manually →</button>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Results view
  if (results) {
    const rec = results.adaptive_recommendation;
    const score = Math.round(results.score);
    const scoreColor = score >= 80 ? 'var(--accent-green)' : score >= 60 ? 'var(--accent-blue)' : 'var(--accent-orange)';
    const scoreEmoji = score >= 80 ? '🎉' : score >= 60 ? '👍' : '📚';

    return (
      <Layout>
        <div style={{ padding: '1.75rem', maxWidth: 760, margin: '0 auto' }} className="animate-fade-in">
          {/* Score card */}
          <div className="card card-glow-blue" style={{ textAlign: 'center', padding: '2.5rem', marginBottom: '1.25rem', background: 'linear-gradient(135deg, rgba(79,142,247,0.06) 0%, rgba(139,92,246,0.04) 100%)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{scoreEmoji}</div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '1rem' }}>Quiz Complete!</h1>
            <div style={{ fontSize: '4rem', fontWeight: 900, color: scoreColor, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '0.5rem' }}>
              {score}%
            </div>
            <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--accent-green)' }}>{results.correct_count}</div>
                <div style={{ color: 'var(--text-muted)' }}>Correct</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--accent-red)' }}>{results.incorrect_count}</div>
                <div style={{ color: 'var(--text-muted)' }}>Wrong</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.375rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{results.total_questions}</div>
                <div style={{ color: 'var(--text-muted)' }}>Total</div>
              </div>
            </div>
          </div>

          {/* AI Learning Status */}
          {rec && (
            <div className="card card-glow-purple" style={{ marginBottom: '1.25rem', background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(79,142,247,0.05) 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem' }}>🤖</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>AI Learning Status</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Adaptive recommendation</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '0.875rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>AI Decision</div>
                  <div style={{
                    fontSize: '1.125rem', fontWeight: 900,
                    color: rec.action === 'RETEACH' ? 'var(--accent-red)' : rec.action === 'MOVE_TO_NEXT_TOPIC' ? 'var(--accent-green)' : 'var(--accent-blue)'
                  }}>
                    {rec.action.replace(/_/g, ' ')}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '0.875rem', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Next Difficulty</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 900, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{rec.difficulty}</div>
                </div>
              </div>
              <div style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: '0.875rem', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Reason</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{rec.reason}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => navigate(`/courses/${courseId}/tutor`)} className="btn-primary" style={{ flex: 1 }}>
                  {rec.action === 'RETEACH' ? '📖 Study with AI Tutor' : '🚀 Continue Learning'}
                </button>
                <button onClick={() => { setQuiz(null); setResults(null); setAutoGenerate(false); }} className="btn-secondary">
                  New Quiz
                </button>
              </div>
            </div>
          )}

          {/* Answer Review */}
          <div className="card">
            <div className="section-title" style={{ marginBottom: '1rem' }}>Answer Review</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {results.answers?.map((ans: any, idx: number) => (
                <div key={idx} style={{
                  padding: '1rem', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${ans.is_correct ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}`,
                  background: ans.is_correct ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.04)',
                }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700,
                      background: ans.is_correct ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.15)',
                      color: ans.is_correct ? '#34d399' : '#f87171',
                    }}>
                      {ans.is_correct ? '✓' : '✗'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{ans.question_text}</div>
                      <div style={{ fontSize: '0.8125rem', marginBottom: '0.25rem', color: ans.is_correct ? '#34d399' : '#f87171' }}>
                        Your answer: <strong>{ans.student_answer || '(no answer)'}</strong>
                      </div>
                      {!ans.is_correct && (
                        <div style={{ fontSize: '0.8125rem', color: '#34d399', marginBottom: '0.25rem' }}>
                          Correct: <strong>{ans.correct_answer}</strong>
                        </div>
                      )}
                      {ans.explanation && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, padding: '0.625rem 0.875rem', background: 'rgba(79,142,247,0.05)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-blue)' }}>
                          💡 {ans.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Generation form (when no topic param auto-triggers)
  if (!quiz) {
    return (
      <Layout>
        <div style={{ padding: '1.75rem', maxWidth: 560, margin: '0 auto' }} className="animate-fade-in">
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.625rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '0.375rem' }}>
              <span className="gradient-text">Generate Quiz</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              AI will create personalized questions based on your mastery level
            </p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem', color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>
          )}

          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Topic</label>
                <select className="input" value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>
                  <option value="">All Topics (Mixed)</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Difficulty</label>
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  {[{ v: '', l: 'Adaptive ✨' }, { v: 'easy', l: 'Easy' }, { v: 'medium', l: 'Medium' }, { v: 'hard', l: 'Hard' }].map(({ v, l }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setDifficulty(v)}
                      style={{
                        flex: 1, padding: '0.625rem 0.5rem', borderRadius: 'var(--radius-md)', border: `1px solid ${difficulty === v ? 'var(--accent-blue)' : 'var(--border)'}`,
                        background: difficulty === v ? 'rgba(79,142,247,0.12)' : 'var(--bg-glass)',
                        color: difficulty === v ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >{l}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Number of Questions</label>
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  {[5, 10, 15].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNumQ(n)}
                      style={{
                        flex: 1, padding: '0.625rem', borderRadius: 'var(--radius-md)', border: `1px solid ${numQ === n ? 'var(--accent-blue)' : 'var(--border)'}`,
                        background: numQ === n ? 'rgba(79,142,247,0.12)' : 'var(--bg-glass)',
                        color: numQ === n ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >{n}</button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => generateQuiz()}
                disabled={generating}
                className="btn-primary"
                style={{ width: '100%', padding: '0.875rem', fontSize: '0.9375rem', marginTop: '0.5rem' }}
              >
                {generating ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', justifyContent: 'center' }}>
                    <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                    Generating…
                  </span>
                ) : '🚀 Generate Quiz'}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Quiz taking view
  const q = quiz.questions[current];
  if (!q) return <Layout><div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No questions</div></Layout>;

  const answered = Object.keys(answers).length;
  const progressPct = ((current + 1) / quiz.questions.length) * 100;

  return (
    <Layout>
      <div style={{ padding: '1.75rem', maxWidth: 760, margin: '0 auto' }} className="animate-fade-in">
        {/* Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>{quiz.title}</h1>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Question {current + 1} of {quiz.questions.length} · {answered} answered
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className={`pill-${q.difficulty}`}>{q.difficulty}</span>
              {q.topic_name && <span className="tag">{q.topic_name}</span>}
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg, var(--accent-blue), var(--accent-purple))',
              width: `${progressPct}%`, transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
            }} />
          </div>
        </div>

        {/* Question card */}
        <div className="card card-glow-blue" style={{ padding: '2rem', marginBottom: '1.25rem', minHeight: 280 }}>
          <p style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {q.question_text}
          </p>

          {(q.question_type === 'mcq' || q.question_type === 'true_false') && q.options && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {q.options.map((opt, i) => {
                const isSelected = answers[q.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                    className={`quiz-option ${isSelected ? 'selected' : ''}`}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.75rem', fontWeight: 800,
                      background: isSelected ? 'var(--accent-blue)' : 'rgba(255,255,255,0.06)',
                      color: isSelected ? '#fff' : 'var(--text-muted)',
                      border: `1px solid ${isSelected ? 'var(--accent-blue)' : 'var(--border)'}`,
                    }}>
                      {q.question_type === 'true_false' ? opt[0] : letterLabels[i]}
                    </div>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {q.question_type === 'short_answer' && (
            <textarea
              className="input"
              rows={4}
              placeholder="Write your answer here…"
              value={answers[q.id] || ''}
              onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
            />
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <button
            onClick={() => setCurrent(Math.max(0, current - 1))}
            disabled={current === 0}
            className="btn-secondary"
            style={{ opacity: current === 0 ? 0.4 : 1 }}
          >
            ← Prev
          </button>

          {/* Dot navigation */}
          <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
            {quiz.questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: '0.6875rem', fontWeight: 700, transition: 'all 0.15s',
                  background: idx === current
                    ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))'
                    : answers[quiz.questions[idx].id]
                      ? 'rgba(16,185,129,0.2)'
                      : 'rgba(255,255,255,0.06)',
                  color: idx === current ? '#fff' : answers[quiz.questions[idx].id] ? '#34d399' : 'var(--text-muted)',
                  boxShadow: idx === current ? '0 2px 8px rgba(79,142,247,0.4)' : 'none',
                }}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {current < quiz.questions.length - 1 ? (
            <button onClick={() => setCurrent(current + 1)} className="btn-primary">
              Next →
            </button>
          ) : (
            <button
              onClick={submitQuiz}
              disabled={submitting}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))' }}
            >
              {submitting ? 'Evaluating…' : 'Submit Quiz'}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default QuizPage;
