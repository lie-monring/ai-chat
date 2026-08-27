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

function hexToRgba(hex, alpha) {
  let h = (hex || '').replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (isNaN(n)) return null;
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
}

function applyThemeColor() {
  const ac = activeCharacter();
  const color = ac && ac.themeColor;
  const bg = ac && ac.bgColor;
  const bgImage = ac && ac.bgImage;
  const style = document.documentElement.style;
  if (!color) {
    ['--primary','--bubble-user','--pill-active','--blockquote-border','--primary-light','--sidebar-active'].forEach(v => style.removeProperty(v));
  } else {
    const light = hexToRgba(color, 0.15);
    style.setProperty('--primary', color);
    style.setProperty('--bubble-user', color);
    style.setProperty('--pill-active', color);
    style.setProperty('--blockquote-border', color);
    if (light) { style.setProperty('--primary-light', light); style.setProperty('--sidebar-active', light); }
  }
  if (bg) style.setProperty('--surface', bg);
  else style.removeProperty('--surface');
  if ($messages) $messages.style.backgroundImage = bgImage ? 'url("' + bgImage + '")' : '';
}

function syncColorSettings() {
  const ac = activeCharacter();
  if (!ac) return;
  $setThemeColor.value = ac.themeColor || '#e8879a';
  $setBgColor.value = ac.bgColor || '#ffffff';
  $setBgCustom.checked = !!ac.bgColor;
  $btnBgImageClear.style.display = ac.bgImage ? '' : 'none';
  $btnAvatarImageClear.style.display = ac.avatar ? '' : 'none';
  $colorCharName.textContent = ac.name;
  $charTitleInput.value = ac.userTitle || '';
}

function fileToDataImage(file, max, type, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.width, h = img.height;
        if (w > max || h > max) { const s = Math.min(max / w, max / h); w = Math.round(w * s); h = Math.round(h * s); }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL(type, 0.85));
      } catch { cb(null); }
    };
    img.onerror = () => cb(null);
    img.src = reader.result;
  };
  reader.onerror = () => cb(null);
  reader.readAsDataURL(file);
}
