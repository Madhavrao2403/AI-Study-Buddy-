import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: '🧠',
    title: 'AI Course Analyzer',
    desc: 'Upload any syllabus, PDF, or notes. The AI reads and structures it into topics, subtopics, prerequisites, and learning objectives automatically.',
    color: 'var(--accent-blue)',
  },
  {
    icon: '📊',
    title: 'Diagnostic Assessment',
    desc: 'Before teaching, the AI tests what you already know. Topic-level scores identify exactly where your knowledge gaps are.',
    color: 'var(--accent-purple)',
  },
  {
    icon: '🗺️',
    title: 'Personalized Study Plan',
    desc: 'A dynamic schedule built around your mastery, exam deadline, available study time, and weak topics — not a one-size-fits-all syllabus.',
    color: 'var(--accent-cyan)',
  },
  {
    icon: '🤖',
    title: 'AI Tutor with RAG',
    desc: 'Ask anything. The tutor answers from your own uploaded material first, with six explanation modes: Simple, Exam, Interview, Examples, Beginner, Detailed.',
    color: 'var(--accent-green)',
  },
  {
    icon: '🧪',
    title: 'Adaptive Quiz Engine',
    desc: 'Quizzes are generated on-demand. Difficulty adjusts in real-time based on your mastery — easy when you struggle, hard when you excel.',
    color: 'var(--accent-orange)',
  },
  {
    icon: '🔄',
    title: 'Adaptive Learning Loop',
    desc: 'The system continuously measures performance, detects weaknesses, and automatically reshapes your study plan — the core innovation.',
    color: 'var(--accent-red)',
  },
];

const STEPS = [
  { num: '01', title: 'Create a Course', desc: 'Add a course name and subject.' },
  { num: '02', title: 'Upload Material', desc: 'Upload your PDF, notes, or syllabus.' },
  { num: '03', title: 'AI Analyzes', desc: 'AI extracts topics, subtopics, and structure.' },
  { num: '04', title: 'Take Assessment', desc: 'Diagnostic quiz measures your existing knowledge.' },
  { num: '05', title: 'Get Your Plan', desc: 'Personalized study plan generated from your gaps.' },
  { num: '06', title: 'Study & Adapt', desc: 'Quiz → Evaluate → Detect Weakness → Plan Changes.' },
];

const TECH = [
  { name: 'React + TypeScript', role: 'Frontend' },
  { name: 'Python + FastAPI', role: 'Backend' },
  { name: 'MySQL 8+', role: 'Database' },
  { name: 'OpenAI API', role: 'AI Engine' },
  { name: 'SQLAlchemy + Alembic', role: 'ORM + Migrations' },
  { name: 'Tailwind CSS', role: 'Styling' },
  { name: 'JWT Auth', role: 'Security' },
  { name: 'RAG System', role: 'Document Retrieval' },
];

const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const FAQS = [
    { q: 'Is it really adaptive?', a: 'Yes. After every quiz the mastery engine recalculates topic scores. The adaptive agent then decides whether to reteach, practice, increase difficulty, or move to the next topic — and updates your study plan accordingly.' },
    { q: 'What file types can I upload?', a: 'PDF, TXT, and DOCX files. The system extracts text, splits it into chunks, generates embeddings, and stores them for RAG retrieval.' },
    { q: 'Does the AI tutor use my own notes?', a: 'Yes. When you ask a question, the system finds the most relevant chunks from your uploaded documents and gives the AI tutor that context first. If nothing relevant is found, it clearly says it is using general knowledge.' },
    { q: 'How is the difficulty of quizzes determined?', a: 'Based on your current mastery score for that topic. Below 30% = easy, 30–70% = medium, above 70% = hard. It is not random.' },
    { q: 'Can I use it without an OpenAI API key?', a: 'The system supports custom base URLs via OPENAI_BASE_URL, so you can point it at any OpenAI-compatible local model (e.g. LM Studio, Ollama).' },
  ];

  return (
    <div style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'Inter, -apple-system, sans-serif' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,15,30,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '0 2rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🧠</div>
          <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>AI Study <span style={{ color: 'var(--accent-blue)' }}>Buddy</span></span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link to="/login" className="btn-secondary" style={{ fontSize: '0.8125rem' }}>Sign In</Link>
          <Link to="/register" className="btn-primary" style={{ fontSize: '0.8125rem' }}>Get Started Free</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: '6rem 2rem 4rem', textAlign: 'center', maxWidth: 860, margin: '0 auto', position: 'relative' }}>
        {/* Background glows */}
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '20%', right: '5%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', pointerEvents: 'none', borderRadius: '50%' }} />

        <div style={{ position: 'relative' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)', borderRadius: 'var(--radius-pill)', padding: '0.3rem 0.875rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '1.5rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            🎓 AI-Powered Adaptive Learning
          </span>

          <h1 style={{ fontSize: 'clamp(2.25rem, 6vw, 3.75rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: '1.25rem' }}>
            The AI that learns<br />
            <span style={{ background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>how you learn</span>
          </h1>

          <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.1875rem)', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 640, margin: '0 auto 2rem', fontWeight: 400 }}>
            Upload your course material. The AI analyzes it, tests your knowledge, builds a personalized study plan, and continuously adapts as you improve — not a static chatbot, a real adaptive learning system.
          </p>

          <div style={{ display: 'flex', gap: '0.875rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-primary" style={{ fontSize: '1rem', padding: '0.75rem 1.75rem', borderRadius: 'var(--radius-lg)' }}>
              Start Learning Free →
            </Link>
            <a href="#how-it-works" className="btn-secondary" style={{ fontSize: '1rem', padding: '0.75rem 1.75rem', borderRadius: 'var(--radius-lg)', textDecoration: 'none' }}>
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── ADAPTIVE LOOP CALLOUT ── */}
      <section style={{ padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
        <div className="card card-glow-blue" style={{ padding: '2rem 2.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1.5rem', alignItems: 'center', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>Normal AI Chatbot</div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Student asks question<br />↓<br />AI answers
              </div>
            </div>
            <div style={{ fontSize: '2rem', color: 'var(--text-muted)' }}>vs</div>
            <div>
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>AI Study Buddy</div>
              <div style={{ background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.25)', borderRadius: 'var(--radius-md)', padding: '1rem', fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.9 }}>
                Student studies → AI measures performance<br />→ Identifies weakness → Selects strategy<br />→ Teaches → Tests → <strong style={{ color: 'var(--accent-blue)' }}>Plan Changes</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>Everything you need to study smarter</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 540, margin: '0 auto' }}>Six interconnected AI systems that work together to form one adaptive learning engine.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {FEATURES.map((f, i) => (
            <div key={i} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}18`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>
                {f.icon}
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{f.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '5rem 2rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>How It Works</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Six steps from zero knowledge to mastery.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-blue)', opacity: 0.35, letterSpacing: '-0.04em', lineHeight: 1, flexShrink: 0 }}>{s.num}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{s.title}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section style={{ padding: '5rem 2rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>Built with Production-Grade Tech</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Every component chosen for reliability, performance, and maintainability.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.875rem' }}>
          {TECH.map((t, i) => (
            <div key={i} style={{ padding: '1rem', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{t.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '4rem 2rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '2rem', textAlign: 'center' }}>Common Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{faq.q}</span>
                  <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)', flexShrink: 0, transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none' }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 1.25rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, borderTop: '1px solid var(--border)' }}>
                    <div style={{ paddingTop: '0.875rem' }}>{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '6rem 2rem', textAlign: 'center', maxWidth: 620, margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '1rem' }}>
          Ready to study smarter?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '2rem', lineHeight: 1.7 }}>
          Create your account, upload your first document, and let the AI build your personalized learning path in minutes.
        </p>
        <Link to="/register" className="btn-primary" style={{ fontSize: '1.0625rem', padding: '0.875rem 2.25rem', borderRadius: 'var(--radius-lg)' }}>
          Get Started — It's Free →
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.75rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🧠</span>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>AI Study Buddy</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>— Adaptive Learning Platform</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Sign In</Link>
          <Link to="/register" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Register</Link>
          <a href="https://github.com" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>GitHub</a>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
