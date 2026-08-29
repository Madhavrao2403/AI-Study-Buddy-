import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { path: '/courses', label: 'My Courses', icon: '◈' },
  { path: '/profile', label: 'Profile', icon: '◉' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, boxShadow: '0 4px 12px rgba(79,142,247,0.35)', flexShrink: 0,
            }}>🧠</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                AI Study <span style={{ color: 'var(--accent-blue)' }}>Buddy</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 1 }}>Adaptive Learning</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.5rem 0.875rem 0.25rem', marginBottom: '0.25rem' }}>
            Navigation
          </div>
          {NAV.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span style={{ fontSize: '1rem', width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-md)',
            background: 'var(--bg-glass)', marginBottom: '0.5rem',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{initials}</div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="nav-item" style={{ color: 'var(--accent-red)', opacity: 0.8 }}>
            <span style={{ fontSize: '0.875rem' }}>→</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div style={{
        display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
        padding: '0 1rem', height: 56, alignItems: 'center', justifyContent: 'space-between',
      }} className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🧠</div>
          <span style={{ fontWeight: 800, fontSize: '0.9375rem' }}>AI Study <span style={{ color: 'var(--accent-blue)' }}>Buddy</span></span>
        </div>
        <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8125rem' }}>Sign out</button>
      </div>

      {/* Main content */}
      <main className="main-content bg-mesh" style={{ flex: 1 }}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {NAV.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '0.375rem 0', color: isActive(item.path) ? 'var(--accent-blue)' : 'var(--text-muted)',
              textDecoration: 'none', fontSize: '0.625rem', fontWeight: 600,
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .mobile-topbar { display: flex !important; }
          .main-content { padding-top: 56px; padding-bottom: 64px; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
