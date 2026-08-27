// ============================================================
// GLOBAL STATE
// ============================================================
let config = {};
let characters = [];
let activeMessages = [];
let isLoading = false;
let enterSend = true;
let activeMsgIdx = -1;
let abortController = null;

// Search state
let searchResults = [];
let searchIdx = -1;
let currentSearchTerm = '';

function activeCharacter() { return characters.find(c => c.id === config.activeCharId) || characters[0] || null; }
function effectiveTitle(c) {
  if (!c) return '哥哥';
  return c.userTitle || c.defaultTitle || '哥哥';
}
function activeSystemPrompt() {
  const c = activeCharacter();
  if (!c) return '';
  const scene = (c.scenes || []).find(s => s.id === c.activeScene) || (c.scenes || [])[0] || {};
  let prompt = c.prompt || '';
  if (scene.suffix) { let s = scene.suffix; const t = effectiveTitle(c); if (t && t !== '哥哥') s = s.replace(/哥哥/g, t); prompt += '\n\n' + s; }
  const defTitle = c.defaultTitle || c.userTitle || '哥哥';
  const wantTitle = effectiveTitle(c);
  if (wantTitle !== defTitle) prompt = prompt.replace(new RegExp(defTitle, 'g'), wantTitle);
  prompt += '\n\n' + GLOBAL_WRITING_RULE;
  return prompt;
}
