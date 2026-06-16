// ============================================================
// THEME
// ============================================================
function applyTheme() {
  const saved = config.theme;
  const theme = saved || (window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  $btnTheme.textContent = theme === 'dark' ? '☀' : '🌙';
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  config.theme = next; saveConfig(config);
  $btnTheme.textContent = next === 'dark' ? '☀' : '🌙';
}
