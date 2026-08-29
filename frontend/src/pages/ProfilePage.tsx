import React, { useEffect, useState } from 'react';
import { userAPI } from '../services/api';
import Layout from '../layouts/Layout';
import { useAuth } from '../context/AuthContext';

const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'];
const LEARNING_STYLES = [
  { value: 'simple', label: 'Simple Explanations' },
  { value: 'examples_first', label: 'Examples First' },
  { value: 'theory_first', label: 'Theory First' },
  { value: 'code_examples', label: 'Code Examples' },
  { value: 'exam_focused', label: 'Exam Focused' },
  { value: 'interview_focused', label: 'Interview Focused' },
];

const SKILL_COLORS: Record<string, { bg: string; border: string; color: string }> = {
  beginner:     { bg: 'rgba(34,211,238,0.1)',   border: 'rgba(34,211,238,0.3)',   color: 'var(--accent-cyan)' },
  intermediate: { bg: 'rgba(79,142,247,0.1)',   border: 'rgba(79,142,247,0.3)',   color: 'var(--accent-blue)' },
  advanced:     { bg: 'rgba(139,92,246,0.1)',   border: 'rgba(139,92,246,0.3)',   color: 'var(--accent-purple)' },
};

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState<any>({});
  const [accountForm, setAccountForm] = useState({ full_name: '', current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [saved, setSaved] = useState(false);
  const [accountSaved, setAccountSaved] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getProfile().then(r => {
      setForm({
        learning_goal: r.data.learning_goal || '',
        current_skill_level: r.data.current_skill_level || 'beginner',
        daily_study_time_minutes: r.data.daily_study_time_minutes || 60,
        preferred_explanation_style: r.data.preferred_explanation_style || 'simple',
        exam_date: r.data.exam_date ? r.data.exam_date.split('T')[0] : '',
        bio: r.data.bio || '',
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Pre-fill name from current user
  useEffect(() => {
    if (user?.full_name) {
      setAccountForm(f => ({ ...f, full_name: user.full_name }));
    }
  }, [user]);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userAPI.updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError('');
    if (accountForm.new_password && accountForm.new_password !== accountForm.confirm_password) {
      setAccountError('New passwords do not match');
      return;
    }
    setSavingAccount(true);
    try {
      const payload: any = {};
      if (accountForm.full_name && accountForm.full_name !== user?.full_name) {
        payload.full_name = accountForm.full_name;
      }
      if (accountForm.new_password) {
        payload.current_password = accountForm.current_password;
        payload.new_password = accountForm.new_password;
      }
      if (Object.keys(payload).length === 0) {
        setAccountError('No changes to save');
        setSavingAccount(false);
        return;
      }
      const resp = await userAPI.updateAccount(payload);
      updateUser(resp.data);
      setAccountSaved(true);
      setAccountForm(f => ({ ...f, current_password: '', new_password: '', confirm_password: '' }));
      setTimeout(() => setAccountSaved(false), 3000);
    } catch (err: any) {
      setAccountError(err.response?.data?.detail || 'Failed to update account');
    }
    setSavingAccount(false);
  };

  if (loading) return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: 680, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-lg)', marginBottom: '1.5rem' }} />
        <div className="skeleton" style={{ height: 420, borderRadius: 'var(--radius-lg)' }} />
      </div>
    </Layout>
  );

  const initials = user?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?';
  const studyHours = Math.floor(form.daily_study_time_minutes / 60);
  const studyMins = form.daily_study_time_minutes % 60;
  const studyLabel = studyHours > 0 ? `${studyHours}h ${studyMins > 0 ? `${studyMins}m` : ''}` : `${studyMins}m`;

  return (
    <Layout>
      <div style={{ padding: '2rem', maxWidth: 680, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
          👤 My Profile
        </h1>

        {/* Avatar card */}
        <div className="card card-glow-purple" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', flexShrink: 0,
            }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{initials}</span>
            </div>
            <div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user?.full_name}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>{user?.email}</div>
              <span className={`badge ${form.current_skill_level === 'advanced' ? 'badge-mastered' : form.current_skill_level === 'intermediate' ? 'badge-good' : 'badge-developing'}`}
                style={{ marginTop: '0.375rem', display: 'inline-flex' }}>
                {form.current_skill_level || 'beginner'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Account Settings ── */}
        <form onSubmit={handleSaveAccount} style={{ marginBottom: '1.5rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.875rem' }}>
              <div className="section-title">Account Settings</div>
              <div className="section-subtitle">Update your name or change your password</div>
            </div>

            {accountError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                {accountError}
              </div>
            )}
            {accountSaved && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                ✓ Account updated successfully!
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Display Name</label>
              <input
                className="input"
                value={accountForm.full_name}
                onChange={e => setAccountForm({ ...accountForm, full_name: e.target.value })}
                placeholder="Your full name"
                minLength={2}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Change Password
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Current Password</label>
                  <input
                    type="password"
                    className="input"
                    value={accountForm.current_password}
                    onChange={e => setAccountForm({ ...accountForm, current_password: e.target.value })}
                    placeholder="Required to change password"
                    autoComplete="current-password"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>New Password</label>
                    <input
                      type="password"
                      className="input"
                      value={accountForm.new_password}
                      onChange={e => setAccountForm({ ...accountForm, new_password: e.target.value })}
                      placeholder="Min 6 characters"
                      autoComplete="new-password"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Confirm Password</label>
                    <input
                      type="password"
                      className="input"
                      value={accountForm.confirm_password}
                      onChange={e => setAccountForm({ ...accountForm, confirm_password: e.target.value })}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={savingAccount} style={{ alignSelf: 'flex-start' }}>
              {savingAccount ? 'Saving...' : 'Save Account Changes'}
            </button>
          </div>
        </form>

        {/* ── Learning Preferences ── */}
        <form onSubmit={handleSavePreferences}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.375rem' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div className="section-title">Learning Preferences</div>
              <div className="section-subtitle">Help the AI personalize your learning experience</div>
            </div>

            {saved && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                ✓ Preferences saved!
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Learning Goal</label>
              <textarea className="input" rows={2} value={form.learning_goal}
                onChange={e => setForm({ ...form, learning_goal: e.target.value })}
                placeholder="What do you want to achieve? e.g., Master Python for backend development" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.625rem' }}>Current Skill Level</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {SKILL_LEVELS.map(level => {
                  const sc = SKILL_COLORS[level];
                  const isSelected = form.current_skill_level === level;
                  return (
                    <button key={level} type="button" onClick={() => setForm({ ...form, current_skill_level: level })}
                      style={{ flex: 1, padding: '0.625rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                        border: `1px solid ${isSelected ? sc.border : 'var(--border)'}`,
                        background: isSelected ? sc.bg : 'transparent',
                        color: isSelected ? sc.color : 'var(--text-muted)' }}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.625rem' }}>
                Daily Study Time
                <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{studyLabel}</span>
              </label>
              <input type="range" min={15} max={240} step={15} value={form.daily_study_time_minutes}
                onChange={e => setForm({ ...form, daily_study_time_minutes: parseInt(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--accent-blue)', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                <span>15m</span><span>1h</span><span>2h</span><span>4h</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Preferred Learning Style</label>
              <select className="input" value={form.preferred_explanation_style}
                onChange={e => setForm({ ...form, preferred_explanation_style: e.target.value })}>
                {LEARNING_STYLES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Exam Date <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input type="date" className="input" value={form.exam_date}
                onChange={e => setForm({ ...form, exam_date: e.target.value })} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Bio</label>
              <textarea className="input" rows={2} value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell us about yourself..." />
            </div>

            <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%', marginTop: '0.25rem' }}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>
      {/* suppress duplicate font-size declaration lint */}
      <style>{`
        .pref-section-label { font-size: 0.6875rem !important; }
      `}</style>
    </Layout>
  );
};

export default ProfilePage;
