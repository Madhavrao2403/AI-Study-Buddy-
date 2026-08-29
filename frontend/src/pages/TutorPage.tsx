import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { tutorAPI, courseAPI } from '../services/api';
import type { Message, Topic } from '../types';
import Layout from '../layouts/Layout';
import { parseMarkdown } from '../utils/helpers';

const MODES = [
  { value: 'simple', label: 'Simple', desc: 'Plain language' },
  { value: 'detailed', label: 'Detailed', desc: 'Technical depth' },
  { value: 'exam', label: 'Exam', desc: 'Exam-focused' },
  { value: 'examples', label: 'Examples', desc: 'Learn by example' },
  { value: 'interview', label: 'Interview', desc: 'Interview style' },
];

const QUICK = [
  { label: 'Explain simpler', icon: '🌱' },
  { label: 'Give me an example', icon: '💡' },
  { label: 'Test my understanding', icon: '🧪' },
  { label: 'Show code example', icon: '💻' },
  { label: 'Explain for exam', icon: '🎯' },
  { label: 'What are common mistakes?', icon: '⚠️' },
];

const TutorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const courseId = parseInt(id!);
  const topicIdParam = searchParams.get('topic');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('simple');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(topicIdParam ? parseInt(topicIdParam) : null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    courseAPI.getTopics(courseId).then(r => setTopics(r.data)).catch(() => {});
  }, [courseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setLoading(true);

    const userMsg: Message = {
      id: Date.now(), role: 'user', content: msg, created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const resp = await tutorAPI.chat(
        courseId,
        { message: msg, explanation_mode: mode, topic_id: selectedTopic },
        conversationId || undefined,
      );
      const data = resp.data;
      if (!conversationId) setConversationId(data.conversation_id);
      setMessages(prev => [...prev, {
        id: data.message_id, role: 'assistant', content: data.response,
        used_rag: data.used_rag, created_at: new Date().toISOString()
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now(), role: 'assistant',
        content: 'I encountered an error. Please try again.',
        created_at: new Date().toISOString()
      }]);
    }
    setLoading(false);
  };

  const currentTopic = topics.find(t => t.id === selectedTopic);

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
          padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', flexShrink: 0 }}>🤖</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>AI Tutor</div>
              {currentTopic && <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)' }}>📌 {currentTopic.name}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.625rem', marginLeft: 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Topic selector */}
            <select
              className="input"
              style={{ width: 'auto', fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }}
              value={selectedTopic || ''}
              onChange={e => setSelectedTopic(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">All Topics</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            {/* Mode pills */}
            <div style={{ display: 'flex', gap: '0.375rem', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.25rem' }}>
              {MODES.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  style={{
                    padding: '0.3rem 0.75rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.15s',
                    background: mode === m.value ? 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' : 'transparent',
                    color: mode === m.value ? '#fff' : 'var(--text-secondary)',
                  }}
                  title={m.desc}
                >{m.label}</button>
              ))}
            </div>

            <button
              onClick={() => { setMessages([]); setConversationId(null); }}
              className="btn-ghost"
              style={{ fontSize: '0.75rem' }}
            >
              New Chat
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', margin: 'auto', padding: '2rem', maxWidth: 560 }} className="animate-fade-in">
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', margin: '0 auto 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', boxShadow: '0 8px 24px rgba(79,142,247,0.3)' }}>🤖</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                <span className="gradient-text">Ask me anything</span>
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                I'll explain concepts, give examples, test your knowledge, and help you{currentTopic ? ` master ${currentTopic.name}` : ' study smarter'}.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', justifyContent: 'center' }}>
                {QUICK.map(q => (
                  <button
                    key={q.label}
                    onClick={() => sendMessage(q.label)}
                    style={{
                      padding: '0.5rem 0.875rem', borderRadius: 'var(--radius-pill)',
                      background: 'var(--bg-glass)', border: '1px solid var(--border)',
                      color: 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(79,142,247,0.4)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                  >
                    <span>{q.icon}</span>{q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: '0.75rem',
                alignItems: 'flex-end',
              }}
              className="animate-fade-in"
            >
              {msg.role === 'assistant' && (
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', flexShrink: 0 }}>🤖</div>
              )}
              <div>
                {msg.role === 'user' ? (
                  <div className="chat-bubble-user">{msg.content}</div>
                ) : (
                  <div
                    className="chat-bubble-ai"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
                  />
                )}
                {msg.role === 'assistant' && msg.used_rag && (
                  <div style={{ fontSize: '0.6875rem', color: 'var(--accent-green)', marginTop: '0.375rem', marginLeft: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)' }} />
                    From your course material
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  You
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '0.75rem', alignItems: 'flex-end' }} className="animate-fade-in">
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>🤖</div>
              <div className="chat-bubble-ai" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.875rem 1.125rem' }}>
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick actions strip */}
        {messages.length > 0 && (
          <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', overflowX: 'auto', flexShrink: 0 }}>
            {QUICK.slice(0, 4).map(q => (
              <button
                key={q.label}
                onClick={() => sendMessage(q.label)}
                style={{ flexShrink: 0, padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-pill)', background: 'var(--bg-glass)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {q.icon} {q.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '0.875rem 1.25rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.75rem', maxWidth: 900, margin: '0 auto', alignItems: 'flex-end' }}>
            <textarea
              ref={textareaRef}
              className="input"
              rows={1}
              style={{ flex: 1, resize: 'none', maxHeight: 120, minHeight: 44, fontSize: '0.875rem', lineHeight: 1.5 }}
              placeholder={`Ask about ${currentTopic?.name || 'anything in this course'}…`}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="btn-primary"
              style={{ flexShrink: 0, alignSelf: 'flex-end', padding: '0.625rem 1.25rem' }}
            >
              {loading ? '…' : 'Send'}
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
            Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TutorPage;
