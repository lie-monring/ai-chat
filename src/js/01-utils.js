// ============================================================
// UTILITIES
// ============================================================
function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }
function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'c_';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}
function safeJsonParse(str, fallback) { try { return JSON.parse(str); } catch { return fallback; } }
function escapeHtml(text) { const d = document.createElement('div'); d.textContent = text; return d.innerHTML; }

function formatTime(d) {
  if (!d) return '';
  const dt = (typeof d === 'string' || typeof d === 'number') ? new Date(d) : d;
  if (isNaN(dt)) return '';
  const hh = String(dt.getHours()).padStart(2,'0');
  const mm = String(dt.getMinutes()).padStart(2,'0');
  return hh + ':' + mm;
}

function estimateTokens(text) {
  if (!text) return 0;
  let count = 0;
  for (const ch of text) {
    count += ch.charCodeAt(0) > 0x7f ? 1.5 : 0.25;
  }
  return Math.ceil(count);
}

function debounce(fn, ms) {
  let t;
  return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); };
}

// ============================================================
// TOAST & ERROR BANNER
// ============================================================
let toastTimer;
function showToast(text) {
  clearTimeout(toastTimer);
  $toast.textContent = text;
  $toast.classList.add('show');
  toastTimer = setTimeout(() => $toast.classList.remove('show'), 1800);
}

function showError(msg, recoverable) {
  $errorText.textContent = msg;
  $errorBanner.classList.add('show');
  if (recoverable) {
    $errorDismiss.style.display = '';
  } else {
    $errorDismiss.style.display = 'none';
    setTimeout(() => $errorBanner.classList.remove('show'), 5000);
  }
}
function hideError() { $errorBanner.classList.remove('show'); }
