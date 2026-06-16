// ============================================================
// MESSAGES (incremental rendering + avatars + timestamps)
// ============================================================
function renderMessages() {
  $messages.innerHTML = '';
  const ac = activeCharacter();
  if (activeMessages.length === 0) {
    const emoji = ac ? ac.emoji : '💬';
    const name = ac ? ac.name : '角色';
    const sceneName = ac && ac.scenes ? ((ac.scenes.find(s => s.id === ac.activeScene) || ac.scenes[0]) || {}).name : '';
    const hint = ac && ac.firstMessage ? '她说：' + ac.firstMessage.slice(0,60) + '…' : (sceneName ? '场景：' + sceneName : '你的角色在等你呢');
    $messages.innerHTML = '<div id="empty-hint"><div class="icon">' + escapeHtml(emoji) + '</div><div class="title">和 ' + escapeHtml(name) + ' 聊天吧～</div><div class="sub">' + escapeHtml(hint) + '</div></div>';
    return;
  }
  activeMessages.forEach((m, i) => renderMessage(m, i));
  scrollToBottom();
}

function renderMessage(m, i) {
  const isUser = m.role === 'user';
  const ac = activeCharacter();
  const div = document.createElement('div');
  div.className = 'msg ' + (isUser ? 'user' : 'ai');
  div.setAttribute('data-idx', i);

  const avatarEmoji = isUser ? '👤' : (ac ? ac.emoji : '💬');
  const timeStr = formatTime(m.ts);
  const header = '<div class="msg-header"><span class="msg-avatar">' + avatarEmoji + '</span><span class="msg-time">' + timeStr + '</span></div>';
  const bubble = '<div class="bubble"><div class="bubble-inner">' + renderMarkdown(m.content, currentSearchTerm) + '</div></div>';

  div.innerHTML = (isUser ? '' : header) + bubble + (isUser ? header.replace('msg-header', 'msg-header user-header') : '');
  div.addEventListener('click', e => {
    if (e.target.closest('.msg-actions button')) return;
    if (e.target.closest('.edit-area')) return;
    if (e.target.closest('.code-copy-btn')) return;
    toggleActions(div, i);
  });
  $messages.appendChild(div);
}

function toggleActions(msgEl, idx) {
  const wasActive = activeMsgIdx === idx;
  closeActionMenus();
  if (wasActive) return;
  activeMsgIdx = idx;
  let existing = msgEl.querySelector('.msg-actions');
  if (existing) { existing.classList.add('show'); return; }
  const actions = document.createElement('div');
  actions.className = 'msg-actions show';
  if (activeMessages[idx]?.role === 'user') {
    const b = document.createElement('button'); b.textContent = '编辑';
    b.onclick = e => { e.stopPropagation(); editMessage(idx); };
    const c = document.createElement('button'); c.textContent = '复制';
    c.onclick = e => { e.stopPropagation(); copyMessage(idx); };
    actions.appendChild(b); actions.appendChild(c);
  } else {
    const b = document.createElement('button'); b.textContent = '重试';
    b.onclick = e => { e.stopPropagation(); retryMessage(idx); };
    const r = document.createElement('button'); r.textContent = '重新生成';
    r.onclick = e => { e.stopPropagation(); regenerateMessage(idx); };
    const c = document.createElement('button'); c.textContent = '复制';
    c.onclick = e => { e.stopPropagation(); copyMessage(idx); };
    actions.appendChild(b); actions.appendChild(r); actions.appendChild(c);
  }
  msgEl.appendChild(actions);
}
function closeActionMenus() {
  activeMsgIdx = -1;
  document.querySelectorAll('.msg-actions.show').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('.msg.editing').forEach(el => exitEdit(el));
}

function copyMessage(idx) {
  const text = activeMessages[idx]?.content;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => showToast('已复制')).catch(() => {
    const ta = document.createElement('textarea'); ta.value = text;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    showToast('已复制');
  });
}

// ============================================================
// EDIT / RETRY / REGENERATE
// ============================================================
function editMessage(idx) {
  const m = activeMessages[idx]; if (!m || m.role !== 'user') return;
  const msgEl = $messages.querySelector('.msg[data-idx="'+idx+'"]'); if (!msgEl) return;
  msgEl.classList.add('editing');
  msgEl.querySelector('.bubble').style.display = 'none';
  const ea = document.createElement('div'); ea.className = 'edit-area';
  ea.innerHTML = '<textarea rows="3">'+escapeHtml(m.content)+'</textarea><div class="btns"><button class="cancel">取消</button><button class="save">保存并重发</button></div>';
  msgEl.appendChild(ea); ea.style.display = 'flex';
  const ta = ea.querySelector('textarea'); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length);
  ea.querySelector('.cancel').onclick = e => { e.stopPropagation(); exitEdit(msgEl); };
  ea.querySelector('.save').onclick = e => {
    e.stopPropagation();
    const c = ta.value.trim(); if (!c) return;
    m.content = c; m.ts = Date.now();
    activeMessages.splice(idx + 1);
    saveCurrentMessages(); renderMessages(); closeActionMenus(); generateResponse();
  };
}
function exitEdit(msgEl) {
  msgEl.classList.remove('editing');
  const ea = msgEl.querySelector('.edit-area'); if (ea) ea.remove();
  const b = msgEl.querySelector('.bubble'); if (b) b.style.display = '';
}
function retryMessage(idx) {
  if (activeMessages[idx]?.role !== 'assistant') return;
  activeMessages.splice(idx, 1);
  saveCurrentMessages(); renderMessages(); closeActionMenus(); generateResponse();
}
function regenerateMessage(idx) {
  if (activeMessages[idx]?.role !== 'assistant') return;
  activeMessages.splice(idx, 1);
  saveCurrentMessages(); renderMessages(); closeActionMenus(); generateResponse();
}

// ============================================================
// SCROLL
// ============================================================
function scrollToBottom() { requestAnimationFrame(() => { $messages.scrollTop = $messages.scrollHeight; }); }
