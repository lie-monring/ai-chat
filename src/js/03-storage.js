// ============================================================
// STORAGE LAYER (with error boundaries)
// ============================================================
function storageGet(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? safeJsonParse(r, fallback) : fallback; }
  catch { return fallback; }
}
function storageSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch (e) {
    if (e.name === 'QuotaExceededError') {
      showError('存储空间已满！请清理旧对话或导出备份后清空数据。', true);
    }
    return false;
  }
}
function storageRemove(key) { try { localStorage.removeItem(key); } catch {} }

function loadConfig() { return storageGet(STORAGE_KEY_CONFIG, {}); }
function saveConfig(cfg) { storageSet(STORAGE_KEY_CONFIG, cfg); }
function loadCharacters() { return storageGet(STORAGE_KEY_CHARS, []); }
function saveCharacters(chars) {
  if (chars.length > MAX_CHARACTERS) chars = chars.slice(0, MAX_CHARACTERS);
  const slim = chars.map(c => { const o = {...c}; delete o.messageCount; return o; });
  storageSet(STORAGE_KEY_CHARS, slim);
  updateCharCount();
}
function loadMessages(charId) { return storageGet(STORAGE_KEY_MSGS_PFX + charId, []); }
function saveMessages(charId, msgs) {
  let trimmed = msgs;
  const maxHist2 = +(config.maxHistory || MAX_HISTORY); if (trimmed.length > maxHist2) trimmed = trimmed.slice(trimmed.length - maxHist2);
  trimmed = trimmed.map(m => m.ts ? m : { ...m, ts: Date.now() });
  storageSet(STORAGE_KEY_MSGS_PFX + charId, trimmed);
  updateStorageInfo();
}
function deleteCharData(charId) { storageRemove(STORAGE_KEY_MSGS_PFX + charId); storageRemove(STORAGE_KEY_SUMMARY_PFX + charId); }

function updateStorageInfo() {
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('yuki_')) total += (localStorage.getItem(k) || '').length;
    }
  } catch {}
  const usedKB = (total / 1024).toFixed(0);
  const pct = Math.min(100, (total / (5 * 1024 * 1024)) * 100).toFixed(0);
  $storageInfo.textContent = '已使用: ~' + usedKB + ' KB / 5 MB (' + pct + '%)';
  $storageFill.style.width = pct + '%';
}
function updateCharCount() {
  $charCount.textContent = characters.length + '/' + MAX_CHARACTERS;
  $btnAddChar.disabled = characters.length >= MAX_CHARACTERS;
}

// ============================================================
// MIGRATION
// ============================================================
function migrateV1toV2() {
  try {
    const apiKey = localStorage.getItem(OLD_KEY_KEY) || '';
    const theme = localStorage.getItem(OLD_KEY_THEME) || '';
    const enterSend = localStorage.getItem(OLD_KEY_ENTER) || '1';
    const oldPersona = localStorage.getItem(OLD_KEY_PERSONA) || 'sister-high';
    const oldScene = localStorage.getItem(OLD_KEY_SCENE) || '';
    const oldMessages = safeJsonParse(localStorage.getItem(OLD_KEY_HISTORY), []);
    const wasHigh = oldPersona === 'sister-high';

    const yukiHigh = { id:'c_yuki_high', name:'Yuki', emoji:'🌸', avatar:null, prompt:PERSONA_YUKI_HIGH_PROMPT, description:'亲昵黏人的妹妹', cardVersion:null, cardData:null, firstMessage:'', mesExample:'', postHistoryInstructions:'', scenes:deepClone(DEFAULT_SCENES), activeScene:oldScene, samePersonGroup:'yuki', stateDescription:'常态（亲昵黏人）', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
    const yukiKinder = { id:'c_yuki_kinder', name:'Yuki', emoji:'🧒', avatar:null, prompt:PERSONA_YUKI_KINDER_PROMPT, description:'喝了变小药水的幼女', cardVersion:null, cardData:null, firstMessage:'', mesExample:'', postHistoryInstructions:'', scenes:deepClone(DEFAULT_SCENES), activeScene:oldScene, samePersonGroup:'yuki', stateDescription:'幼女态（喝了变小药水）', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };

    const activeId = wasHigh ? yukiHigh.id : yukiKinder.id;
    const taggedMsgs = oldMessages.map(m => ({...m, characterId: activeId, ts: m.ts || Date.now()}));
    saveConfig({ apiKey, theme, enterSend, activeCharId: activeId, version: CONFIG_VERSION });
    saveCharacters([yukiHigh, yukiKinder]);
    saveMessages(activeId, taggedMsgs);
    saveMessages(wasHigh ? yukiKinder.id : yukiHigh.id, []);
    return true;
  } catch { return false; }
}

function createDefaultStart() {
  const apiKey = localStorage.getItem(OLD_KEY_KEY) || '';
  const theme = localStorage.getItem(OLD_KEY_THEME) || '';
  const enterSend = localStorage.getItem(OLD_KEY_ENTER) || '1';
  const yukiHigh = { id:'c_yuki_high', name:'Yuki', emoji:'🌸', avatar:null, prompt:PERSONA_YUKI_HIGH_PROMPT, description:'亲昵黏人的妹妹', cardVersion:null, cardData:null, firstMessage:'', mesExample:'', postHistoryInstructions:'', scenes:deepClone(DEFAULT_SCENES), activeScene:'', samePersonGroup:'yuki', stateDescription:'常态（亲昵黏人）', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
  const yukiKinder = { id:'c_yuki_kinder', name:'Yuki', emoji:'🧒', avatar:null, prompt:PERSONA_YUKI_KINDER_PROMPT, description:'喝了变小药水的幼女', cardVersion:null, cardData:null, firstMessage:'', mesExample:'', postHistoryInstructions:'', scenes:deepClone(DEFAULT_SCENES), activeScene:'', samePersonGroup:'yuki', stateDescription:'幼女态（喝了变小药水）', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
  const chars = [yukiHigh, yukiKinder];
  saveConfig({ apiKey, theme, enterSend, activeCharId: yukiHigh.id, version: CONFIG_VERSION });
  saveCharacters(chars);
  saveMessages(yukiHigh.id, []);
  saveMessages(yukiKinder.id, []);
}

function ensurePresetCharacters() {
  let added = false;
  const reseed = (config.assetVersion || 0) < ASSET_VERSION;
  for (const preset of PRESET_CHARACTERS) {
    const existing = characters.find(c => c.id === preset.id);
    if (!existing) {
      const c = deepClone(preset);
      c.createdAt = new Date().toISOString();
      c.updatedAt = new Date().toISOString();
      characters.push(c);
      saveMessages(c.id, []);
      added = true;
    } else {
      if (existing.themeColor === undefined && preset.themeColor) { existing.themeColor = preset.themeColor; added = true; }
      if (reseed) {
        if (preset.avatar != null) { existing.avatar = preset.avatar; added = true; }
        if (preset.bgImage != null) { existing.bgImage = preset.bgImage; added = true; }
      } else {
        if (!existing.avatar && preset.avatar) { existing.avatar = preset.avatar; added = true; }
        if (!existing.bgImage && preset.bgImage) { existing.bgImage = preset.bgImage; added = true; }
      }
    }
  }
  if (reseed) { config.assetVersion = ASSET_VERSION; saveConfig(config); }
  if (added) saveCharacters(characters);
  return added;
}

// ============================================================
// SAVE HELPERS
// ============================================================
function saveCurrentMessages() { const ac=activeCharacter(); if(ac) saveMessages(ac.id, activeMessages); }
