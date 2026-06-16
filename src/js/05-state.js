// ============================================================
// GLOBAL STATE
// ============================================================
let config = {};
let characters = [];
let activeMessages = [];
let activeDiary = [];
let isLoading = false;
let enterSend = true;
let activeMsgIdx = -1;
let abortController = null;

// Search state
let searchResults = [];
let searchIdx = -1;
let currentSearchTerm = '';

function activeCharacter() { return characters.find(c => c.id === config.activeCharId) || characters[0] || null; }
function activeSystemPrompt() {
  const c = activeCharacter();
  if (!c) return '';
  const scene = (c.scenes || []).find(s => s.id === c.activeScene) || (c.scenes || [])[0] || {};
  let prompt = c.prompt || '';
  if (scene.suffix) { let s = scene.suffix; const t = c.userTitle; if (t && t !== '哥哥') s = s.replace(/哥哥/g, t); prompt += '\n\n' + s; }
  const defTitle = c.userTitle || '哥哥';
  const wantTitle = config.userTitle || defTitle;
  if (wantTitle !== defTitle) prompt = prompt.replace(new RegExp(defTitle, 'g'), wantTitle);
  return prompt;
}
