// ============================================================
// CHARACTER SWITCHING (with abort)
// ============================================================
function switchCharacter(charId) {
  if (charId === config.activeCharId) return;
  if (isLoading && abortController) { abortController.abort(); abortController = null; setLoading(false); }
  saveCurrentMessages();
  const cur = activeCharacter();
  if (cur) { const idx = characters.findIndex(c => c.id === cur.id); if (idx >= 0) characters[idx].messageCount = activeMessages.length; }
  config.activeCharId = charId; saveConfig(config);
  activeMessages = loadMessages(charId);
  highlightActiveChar(); renderMessages(); renderSceneBar(); updateUI(); syncColorSettings(); closeActionMenus();
  closeSearch();
  const nc = activeCharacter();
  if (nc) showToast('已切换到 ' + nc.emoji + ' ' + nc.name);
}

function switchToSamePerson() {
  const cur = activeCharacter();
  if (!cur || !cur.samePersonGroup) return;
  const sib = characters.find(c => c.samePersonGroup === cur.samePersonGroup && c.id !== cur.id);
  if (sib) switchCharacter(sib.id);
}

// ============================================================
// CHARACTER CRUD
// ============================================================
let editingCharId = null;
function openAddCharacter() {
  if (isLoading) { showToast('正在生成回复，请稍候…'); return; }
  if (characters.length >= MAX_CHARACTERS) { showToast('最多支持 ' + MAX_CHARACTERS + ' 个角色'); return; }
  editingCharId = 'new';
  $modalCharTitle.textContent = '添加角色';
  $charEditName.value = ''; $charEditEmoji.value = '🌸'; $charEditDesc.value = ''; $charEditPrompt.value = ''; $charEditTitle.value = '';
  renderEmojiGrid(); $modalCharEdit.classList.add('show'); $charEditName.focus();
}
function openEditCharacter(charId) {
  const c = characters.find(ch => ch.id === charId); if (!c) return;
  editingCharId = charId;
  $modalCharTitle.textContent = '编辑角色';
  $charEditName.value = c.name; $charEditEmoji.value = c.emoji || '🌸'; $charEditDesc.value = c.description || ''; $charEditPrompt.value = c.prompt || ''; $charEditTitle.value = c.userTitle || '';
  renderEmojiGrid(); $modalCharEdit.classList.add('show'); $charEditName.focus();
}
function saveCharEdit() {
  const name = $charEditName.value.trim(); if (!name) { showToast('请输入角色名字'); return; }
  const emoji = $charEditEmoji.value.trim() || '💬';
  const description = $charEditDesc.value.trim();
  const prompt = $charEditPrompt.value.trim(); if (!prompt) { showToast('请输入角色人设 prompt'); return; }
  const title = $charEditTitle.value.trim();
  if (editingCharId === 'new') {
    const c = { id:generateId(), name, emoji, avatar:null, prompt, description, userTitle: title, defaultTitle: '哥哥', themeColor:THEME_COLOR_PALETTE[characters.length % THEME_COLOR_PALETTE.length], bgColor:null, bgImage:null, cardVersion:null, cardData:null, firstMessage:'', mesExample:'', postHistoryInstructions:'', scenes:deepClone(DEFAULT_SCENES), activeScene:'', samePersonGroup:null, stateDescription:null, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), messageCount:0 };
    characters.push(c); saveCharacters(characters); saveMessages(c.id, []);
    renderSidebar(); switchCharacter(c.id); showToast('角色「' + name + '」已添加');
  } else {
    const idx = characters.findIndex(ch => ch.id === editingCharId); if (idx < 0) return;
    characters[idx].name = name; characters[idx].emoji = emoji; characters[idx].description = description; characters[idx].prompt = prompt; characters[idx].userTitle = title; if (characters[idx].defaultTitle === undefined) characters[idx].defaultTitle = title || '哥哥'; characters[idx].updatedAt = new Date().toISOString();
    saveCharacters(characters); renderSidebar(); updateUI(); showToast('角色「' + name + '」已更新');
  }
  $modalCharEdit.classList.remove('show'); editingCharId = null;
}
function duplicateCharacter(charId) {
  const src = characters.find(c => c.id === charId);
  if (!src || characters.length >= MAX_CHARACTERS) { showToast('最多支持 ' + MAX_CHARACTERS + ' 个角色'); return; }
  const dup = deepClone(src);
  dup.id = generateId(); dup.name = src.name + ' (副本)'; dup.createdAt = new Date().toISOString(); dup.updatedAt = new Date().toISOString(); dup.messageCount = 0;
  characters.push(dup); saveCharacters(characters); saveMessages(dup.id, []);
  renderSidebar(); switchCharacter(dup.id); showToast('已复制「' + src.name + '」');
}

let pendingDeleteId = null;
function openDeleteConfirm(charId) {
  if (characters.length <= 1) { showToast('至少保留一个角色'); return; }
  const c = characters.find(ch => ch.id === charId); if (!c) return;
  pendingDeleteId = charId;
  $deleteMsg.textContent = '确定要删除「' + c.name + '」吗？该角色的所有聊天记录和日记将被永久删除，此操作不可撤销。';
  $modalDeleteConfirm.classList.add('show');
}
function confirmDelete() {
  if (!pendingDeleteId) return;
  const charId = pendingDeleteId; pendingDeleteId = null; $modalDeleteConfirm.classList.remove('show');
  const idx = characters.findIndex(c => c.id === charId); if (idx < 0) return;
  const name = characters[idx].name;
  characters.splice(idx, 1); deleteCharData(charId); saveCharacters(characters);
  if (config.activeCharId === charId) {
    config.activeCharId = characters[0]?.id || ''; saveConfig(config);
    if (characters[0]) { activeMessages = loadMessages(characters[0].id); }
    else { activeMessages = []; }
  }
  renderSidebar(); renderMessages(); renderSceneBar(); updateUI(); showToast('已删除「' + name + '」');
}

// ============================================================
// CHARACTER IMPORT/EXPORT
// ============================================================
let pendingImport = null;
function handleFileImport(e) {
  const file = e.target.files[0]; if (!file) return; e.target.value = '';
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext === 'json') {
    const reader = new FileReader();
    reader.onload = () => { try { showImportConfirm(mapCardToCharacter(JSON.parse(reader.result))); } catch (err) { showToast('JSON 解析失败: ' + err.message); } };
    reader.readAsText(file);
  } else if (ext === 'png') {
    const reader = new FileReader();
    reader.onload = () => { try { showImportConfirm(mapCardToCharacter(extractCardFromPNG(reader.result))); } catch (err) { showToast('PNG 解析失败: ' + err.message); } };
    reader.readAsArrayBuffer(file);
  } else showToast('不支持的文件格式，请选择 .json 或 .png 文件');
}
function extractCardFromPNG(buffer) {
  const arr = new Uint8Array(buffer); let offset = 8;
  while (offset < arr.length - 8) {
    const len = (arr[offset]<<24)|(arr[offset+1]<<16)|(arr[offset+2]<<8)|arr[offset+3];
    const type = String.fromCharCode(arr[offset+4],arr[offset+5],arr[offset+6],arr[offset+7]);
    const data = arr.subarray(offset+8, offset+8+len);
    if (type === 'tEXt') {
      const nullIdx = data.indexOf(0);
      if (nullIdx !== -1) {
        const kw = new TextDecoder().decode(data.slice(0,nullIdx));
        if (kw === 'chara' || kw === 'ccv3') return JSON.parse(atob(new TextDecoder().decode(data.slice(nullIdx+1))));
      }
    }
    offset += 12 + len;
  }
  throw new Error('PNG 中没有找到 Character Card 数据');
}
function mapCardToCharacter(card) {
  let data, version;
  if (card.spec === 'chara_card_v3') { data = card.data||card; version='v3'; }
  else if (card.spec === 'chara_card_v2') { data = card.data||card; version='v2'; }
  else { data = card; version = (data.system_prompt||data.description||data.personality) ? 'v2' : null; }
  let pp = [];
  if (data.system_prompt) pp.push(data.system_prompt);
  else { if(data.name)pp.push('【角色名】'+data.name); if(data.description)pp.push('【描述】'+data.description); if(data.personality)pp.push('【性格】'+data.personality); if(data.scenario)pp.push('【背景】'+data.scenario); }
  if (data.post_history_instructions) pp.push(data.post_history_instructions);
  return { id:generateId(), name:data.name||'未命名角色', emoji:EMOJI_PALETTE[characters.length%EMOJI_PALETTE.length]||'💬', avatar:data.avatar||null, themeColor:THEME_COLOR_PALETTE[characters.length%THEME_COLOR_PALETTE.length]||null, bgColor:null, bgImage:null, prompt:pp.join('\n\n')||JSON.stringify(card), description:(typeof data.description==='string'?data.description:(data.name||'')), userTitle: data.user_title||'', defaultTitle: data.user_title||'哥哥', tags:data.tags||[], cardVersion:version, cardData:card, firstMessage:data.first_mes||'', mesExample:data.mes_example||'', postHistoryInstructions:data.post_history_instructions||'', scenes:deepClone(DEFAULT_SCENES), activeScene:'', samePersonGroup:null, stateDescription:null, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), messageCount:0 };
}
function showImportConfirm(c) {
  if (characters.length >= MAX_CHARACTERS) { showToast('最多支持 ' + MAX_CHARACTERS + ' 个角色'); return; }
  pendingImport = c;
  $importPreview.innerHTML = '<p style="margin-bottom:4px"><strong>名字：</strong>'+escapeHtml(c.name)+'</p>'+(c.description?'<p style="margin-bottom:4px"><strong>描述：</strong>'+escapeHtml(c.description)+'</p>':'')+(c.cardVersion?'<p style="margin-bottom:4px"><strong>卡片版本：</strong>'+c.cardVersion.toUpperCase()+'</p>':'')+'<p style="font-size:11px;color:var(--text-secondary);margin-top:6px">Prompt 预览：</p><div class="preview">'+escapeHtml(c.prompt.slice(0,200))+(c.prompt.length>200?'…':'')+'</div>';
  $modalImportConfirm.classList.add('show');
}
function confirmImport() {
  if (!pendingImport) return;
  characters.push(pendingImport); saveCharacters(characters); saveMessages(pendingImport.id,[]);
  $modalImportConfirm.classList.remove('show'); renderSidebar(); switchCharacter(pendingImport.id); showToast('已导入「'+pendingImport.name+'」'); pendingImport=null;
}
function exportCharacter(charId) {
  const c = characters.find(ch => ch.id === charId); if (!c) return;
  let d;
  if (c.cardData) d = c.cardData;
  else d = { spec:'chara_card_v3', spec_version:'3.0', data:{ name:c.name, description:c.description||'', system_prompt:c.prompt, post_history_instructions:c.postHistoryInstructions||'', first_mes:c.firstMessage||'', mes_example:c.mesExample||'', personality:'', scenario:'', avatar:c.avatar||'', tags:c.tags||[] } };
  downloadJson(d, (c.name||'character')+'.json'); showToast('已导出「'+c.name+'」');
}
function exportAllData() {
  const allM={};
  characters.forEach(c => { allM[c.id]=loadMessages(c.id); });
  downloadJson({ version:CONFIG_VERSION, exportedAt:new Date().toISOString(), config:{...config,apiKey:'***'}, characters, messages:allM }, 'yuki_backup_'+new Date().toISOString().slice(0,10)+'.json');
  showToast('全部数据已导出');
}
function handleBackupImport(e) {
  const file = e.target.files[0]; if (!file) return; e.target.value = '';
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const b = JSON.parse(reader.result);
      if (!b.characters||!b.messages) throw new Error('备份文件格式不正确');
      if (!confirm('确定要导入此备份吗？\n\n当前所有数据将被覆盖！\n导出时间：'+(b.exportedAt||'未知')+'\n角色数量：'+b.characters.length+'\n注意：API Key 不会被导入，需重新设置。')) return;
      characters=b.characters; saveCharacters(characters);
      for(const[id,msgs] of Object.entries(b.messages)) saveMessages(id,msgs);
      config.activeCharId=b.config?.activeCharId||characters[0]?.id||'';
      if(!config.apiKey) config.apiKey=localStorage.getItem(OLD_KEY_KEY)||'';
      saveConfig(config);
      const ac=activeCharacter(); activeMessages=ac?loadMessages(ac.id):[];
      renderSidebar(); renderMessages(); renderSceneBar(); updateUI(); updateCharCount(); updateStorageInfo();
      showToast('备份已恢复 ✅');
    } catch(err) { showToast('备份导入失败: '+err.message); }
  };
  reader.readAsText(file);
}
function downloadJson(obj, fn) { const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}); const u=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=u; a.download=fn; a.click(); URL.revokeObjectURL(u); }
