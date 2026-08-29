import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', full_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await authAPI.register(form);
      login(resp.data.access_token, resp.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally { setLoading(false); }
  };

  const features = [
    { icon: '🤖', label: 'AI-powered tutoring with RAG' },
    { icon: '📊', label: 'Adaptive mastery tracking' },
    { icon: '🎯', label: 'Personalized study plans' },
    { icon: '🔄', label: 'Automatic weakness detection' },
  ];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '1rem',
    }} className="bg-mesh">
      <div style={{ position: 'fixed', top: '10%', right: '15%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', width: '100%', maxWidth: 880, alignItems: 'center', position: 'relative', zIndex: 1 }}>
        {/* Left: Features */}
        <div style={{ display: 'none' }} className="register-features">
          <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '1rem', lineHeight: 1.2 }}>
            <span className="gradient-text">Learn smarter,</span><br />not harder
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.7 }}>
            AI Study Buddy adapts to how you learn — tracking your progress, detecting weaknesses, and building a study plan unique to you.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 1rem', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{f.icon}</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Form */}
        <div style={{ gridColumn: '1 / -1', maxWidth: 420, margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, margin: '0 auto 0.875rem', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 6px 20px rgba(79,142,247,0.4)' }}>🧠</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>
              <span className="gradient-text">Create your account</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>Start learning with AI today</p>
          </div>

          <div className="card card-glow-purple" style={{ padding: '2rem' }}>
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>
            )}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Full Name</label>
                  <input type="text" className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required placeholder="Your name" minLength={2} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Email address</label>
                  <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="you@example.com" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>Password</label>
                  <input type="password" className="input" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} placeholder="At least 6 characters" />
                </div>
                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}>
                  {loading ? 'Creating account...' : 'Create Account →'}
                </button>
              </div>
            </form>
            <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '1.25rem' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--accent-blue)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
