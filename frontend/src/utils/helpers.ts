/**
 * Parse markdown-style text and return HTML-safe segments.
 * Handles: **bold**, *italic*, `code`, and line breaks.
 */
export function parseMarkdown(text: string): string {
  if (!text) return '';

  let html = text
    // Escape HTML chars first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Code blocks ```...```
    .replace(/```([\s\S]*?)```/g, (_m, code) =>
      `<pre><code>${code.trim()}</code></pre>`)
    // Inline code `...`
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    // Bold **...**
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    // Bold __...__
    .replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
    // Italic *...*
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    // Headers ### ...
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    // Unordered lists
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]*?<\/li>)+/g, '<ul>$&</ul>')
    // Numbered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');

  return html;
}

/** Get mastery bar CSS class from weakness level */
export function getMasteryBarClass(level: string): string {
  const map: Record<string, string> = {
    critical: 'mastery-bar-critical',
    needs_attention: 'mastery-bar-needs-attention',
    developing: 'mastery-bar-developing',
    good: 'mastery-bar-good',
    mastered: 'mastery-bar-mastered',
  };
  return map[level] || 'mastery-bar-developing';
}

/** Get badge CSS class from weakness level */
export function getMasteryBadgeClass(level: string): string {
  const map: Record<string, string> = {
    critical: 'badge-critical',
    needs_attention: 'badge-needs-attention',
    developing: 'badge-developing',
    good: 'badge-good',
    mastered: 'badge-mastered',
  };
  return `badge ${map[level] || 'badge-developing'}`;
}

export function getMasteryLevelLabel(level: string): string {
  const map: Record<string, string> = {
    critical: 'Critical',
    needs_attention: 'Needs Attention',
    developing: 'Developing',
    good: 'Good',
    mastered: 'Mastered',
  };
  return map[level] || level;
}

export function getMasteryColor(score: number): string {
  if (score >= 86) return 'var(--accent-blue)';
  if (score >= 71) return 'var(--accent-green)';
  if (score >= 51) return 'var(--accent-cyan)';
  if (score >= 31) return 'var(--accent-orange)';
  return 'var(--accent-red)';
}

export function getWeaknessLevel(score: number): string {
  if (score >= 86) return 'mastered';
  if (score >= 71) return 'good';
  if (score >= 51) return 'developing';
  if (score >= 31) return 'needs_attention';
  return 'critical';
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
