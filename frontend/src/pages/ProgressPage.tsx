import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { progressAPI } from '../services/api';
import type { ProgressData } from '../types';
import Layout from '../layouts/Layout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

const WEAKNESS_BADGE: Record<string, { className: string }> = {
  critical:        { className: 'badge badge-critical' },
  needs_attention: { className: 'badge badge-needs-attention' },
  developing:      { className: 'badge badge-developing' },
  good:            { className: 'badge badge-good' },
  mastered:        { className: 'badge badge-mastered' },
};

const getMasteryBarClass = (s: number) => {
  if (s >= 86) return 'mastery-bar-mastered';
  if (s >= 71) return 'mastery-bar-good';
  if (s >= 51) return 'mastery-bar-developing';
  if (s >= 31) return 'mastery-bar-needs-attention';
  return 'mastery-bar-critical';
};

const ProgressPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id!);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressAPI.get(courseId).then(r => setProgress(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />
          <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)' }} />
        </div>
      </div>
    </Layout>
  );

  if (!progress) return (
    <Layout>
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        No progress data yet. Start studying and taking quizzes!
      </div>
    </Layout>
  );

  const radarData = progress.mastery_by_topic.slice(0, 6).map(m => ({
    topic: m.topic_name.length > 12 ? m.topic_name.substring(0, 12) + '…' : m.topic_name,
    mastery: Math.round(m.mastery_score),
  }));

  const quizScoreData = [...progress.recent_quiz_scores].reverse();

  return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '1.75rem' }}>
          📊 Learning Progress
        </h1>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          <div className="stat-card stat-card-blue" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--accent-blue)', lineHeight: 1 }}>{progress.overall_mastery}%</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>Overall Mastery</div>
          </div>
          <div className="stat-card stat-card-green" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--accent-green)', lineHeight: 1 }}>{progress.topics_mastered}/{progress.total_topics}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>Topics Mastered</div>
          </div>
          <div className="stat-card stat-card-purple" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--accent-purple)', lineHeight: 1 }}>{progress.average_quiz_score}%</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>Avg Quiz Score</div>
          </div>
          <div className="stat-card stat-card-orange" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--accent-orange)', lineHeight: 1 }}>{progress.study_streak_days}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>Day Streak 🔥</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
          {/* Topic Mastery bars */}
          <div className="card">
            <div className="section-title" style={{ marginBottom: '1.125rem' }}>Topic Mastery</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {progress.mastery_by_topic.map(m => (
                <div key={m.topic_id}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>{m.topic_name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <span className={(WEAKNESS_BADGE[m.weakness_level] || WEAKNESS_BADGE.developing).className}>
                        {m.weakness_level.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', minWidth: 36, textAlign: 'right' }}>{Math.round(m.mastery_score)}%</span>
                    </div>
                  </div>
                  <div className="mastery-bar-track">
                    <div className={`mastery-bar-fill ${getMasteryBarClass(m.mastery_score)}`} style={{ width: `${m.mastery_score}%` }} />
                  </div>
                </div>
              ))}
              {progress.mastery_by_topic.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>Complete your assessment to see mastery</div>
              )}
            </div>
          </div>

          {/* Quiz Score History */}
          <div className="card">
            <div className="section-title" style={{ marginBottom: '1.125rem' }}>Quiz Score History</div>
            {quizScoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={quizScoreData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }}
                    formatter={(val) => [`${val}%`, 'Score']}
                  />
                  <Line type="monotone" dataKey="score" stroke="var(--accent-blue)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--accent-blue)' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem' }}>Take some quizzes to see score history</div>
            )}
          </div>
        </div>

        {/* Weak Topics */}
        {progress.weak_topics.length > 0 && (
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="section-title" style={{ marginBottom: '1rem' }}>⚠️ Areas Needing Attention</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.875rem' }}>
              {progress.weak_topics.map(m => (
                <div key={m.topic_id} style={{ padding: '1rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{m.topic_name}</span>
                    <span style={{ color: 'var(--accent-red)', fontWeight: 800, fontSize: '1rem' }}>{Math.round(m.mastery_score)}%</span>
                  </div>
                  <span className={(WEAKNESS_BADGE[m.weakness_level] || WEAKNESS_BADGE.critical).className}>
                    {m.weakness_level.replace('_', ' ')}
                  </span>
                  {m.quiz_count > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{m.quiz_count} quizzes taken</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mastery Radar */}
        {radarData.length > 2 && (
          <div className="card">
            <div className="section-title" style={{ marginBottom: '1rem' }}>Mastery Overview (Radar)</div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.07)" />
                <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Radar name="Mastery" dataKey="mastery" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProgressPage;
