// ============================================================
// ENHANCED MARKDOWN RENDERER
// ============================================================
function renderMarkdown(text, highlight) {
  let html = escapeHtml(text);

  // Code blocks (must be first to avoid inner processing)
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const label = lang ? ' data-lang="' + lang + '"' : '';
    return '<pre' + label + '><button class="code-copy-btn" onclick="copyCodeBlock(this)">复制</button><code>' + code + '</code></pre>';
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Tables (before other inline processing)
  html = html.replace(/(?:^|\n)((?:\|[^\n]+\|\n?)+)/g, (match, tableBlock) => {
    const rows = tableBlock.trim().split('\n').filter(r => r.trim());
    if (rows.length < 2) return match;
    let result = '<table>';
    rows.forEach((row, i) => {
      const cells = row.split('|').filter(c => c.trim() !== '');
      if (cells.length === 0) return;
      if (i > 0 && cells.every(c => /^[\s\-:]+$/.test(c))) return;
      const tag = i === 0 ? 'th' : 'td';
      result += '<tr>' + cells.map(c => '<' + tag + '>' + c.trim() + '</' + tag + '>').join('') + '</tr>';
    });
    result += '</table>';
    return result;
  });

  // Blockquotes
  html = html.replace(/(?:^|\n)((?:&gt;[^\n]*\n?)+)/g, (match, quote) => {
    const content = quote.replace(/(?:^|\n)&gt;\s?/g, '\n').trim();
    return '\n<blockquote>' + content + '</blockquote>\n';
  });

  // Unordered lists
  html = html.replace(/(?:^|\n)((?:[\-\*]\s[^\n]+\n?)+)/g, (match, list) => {
    const items = list.trim().split('\n').filter(l => l.trim()).map(l => {
      return '<li>' + l.replace(/^[\-\*]\s/, '') + '</li>';
    }).join('');
    return '<ul>' + items + '</ul>';
  });

  // Ordered lists
  html = html.replace(/(?:^|\n)((?:\d+\.\s[^\n]+\n?)+)/g, (match, list) => {
    const items = list.trim().split('\n').filter(l => l.trim()).map(l => {
      return '<li>' + l.replace(/^\d+\.\s/, '') + '</li>';
    }).join('');
    return '<ol>' + items + '</ol>';
  });

  // Horizontal rules
  html = html.replace(/(?:^|\n)([\-\*_]{3,})(?:\n|$)/g, '\n<hr>\n');

  // Bold, italic, strikethrough
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // Links
  html = html.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');

  // Search highlight
  if (highlight) {
    const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('(' + escaped + ')', 'gi');
    html = html.replace(re, '<mark class="msg-search-hi">$1</mark>');
  }

  return html;
}

// Global copy function for code blocks
window.copyCodeBlock = function(btn) {
  const code = btn.parentElement.querySelector('code');
  if (!code) return;
  navigator.clipboard.writeText(code.textContent).then(() => {
    btn.textContent = '已复制 ✓';
    setTimeout(() => { btn.textContent = '复制'; }, 1500);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = code.textContent;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    btn.textContent = '已复制 ✓';
    setTimeout(() => { btn.textContent = '复制'; }, 1500);
  });
};
