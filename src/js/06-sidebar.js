// ============================================================
// SIDEBAR
// ============================================================
function renderSidebar() {
  $sidebarList.innerHTML = '';
  const groups = {}, ungrouped = [];
  characters.forEach(c => {
    if (c.samePersonGroup) { if (!groups[c.samePersonGroup]) groups[c.samePersonGroup] = []; groups[c.samePersonGroup].push(c); }
    else ungrouped.push(c);
  });
  for (const [gk, members] of Object.entries(groups)) {
    const gh = document.createElement('div');
    gh.className = 'group-header';
    gh.innerHTML = '<span class="link-icon">🔗</span>' + escapeHtml(members[0]?.name || gk);
    $sidebarList.appendChild(gh);
    members.forEach(c => renderCharItem(c, true));
  }
  ungrouped.forEach(c => renderCharItem(c, false));
  highlightActiveChar();
}

function renderCharItem(c, isGrouped) {
  const item = document.createElement('div');
  item.className = 'char-item';
  item.dataset.charId = c.id;
  item.style.paddingLeft = isGrouped ? '22px' : '14px';
  const avatarHtml = c.avatar ? '<img src="' + escapeHtml(c.avatar) + '" alt="">' : escapeHtml(c.emoji || '💬');
  item.innerHTML = '<div class="c-avatar">' + avatarHtml + '</div><div class="c-info"><div class="c-name">' + escapeHtml(c.name) + '</div><div class="c-desc">' + escapeHtml(c.stateDescription || c.description || '') + '</div></div>';
  item.addEventListener('click', e => {
    if (isLoading) { showToast('正在生成回复，请稍候…'); return; }
    switchCharacter(c.id);
    if (window.innerWidth < 768) closeSidebar();
  });
  item.addEventListener('contextmenu', e => { e.preventDefault(); showCtxMenu(e.clientX, e.clientY, c.id); });
  let lpt;
  item.addEventListener('touchstart', e => { lpt = setTimeout(() => { showCtxMenu(e.touches[0].clientX, e.touches[0].clientY, c.id); }, 500); });
  item.addEventListener('touchend', () => clearTimeout(lpt));
  item.addEventListener('touchmove', () => clearTimeout(lpt));
  $sidebarList.appendChild(item);
}

function highlightActiveChar() {
  $sidebarList.querySelectorAll('.char-item').forEach(el => el.classList.toggle('active', el.dataset.charId === config.activeCharId));
}

function renderEmojiGrid() {
  const sel = $charEditEmoji.value;
  $emojiGrid.querySelectorAll('span').forEach(s => s.classList.toggle('sel', s.textContent === sel));
}

// ============================================================
// CONTEXT MENU
// ============================================================
let ctxCharId = null;
function showCtxMenu(x, y, charId) {
  ctxCharId = charId;
  const c = characters.find(ch => ch.id === charId);
  if (!c) return;
  $ctxMenu.innerHTML = '<button data-action="edit">✏️ 编辑角色</button><button data-action="export">📥 导出角色卡</button><button data-action="duplicate">📋 复制角色</button>' + (characters.length > 1 ? '<button data-action="delete" class="danger">🗑 删除角色</button>' : '');
  $ctxMenu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = btn.dataset.action; closeCtxMenu();
      if (a === 'edit') openEditCharacter(charId);
      else if (a === 'export') exportCharacter(charId);
      else if (a === 'duplicate') duplicateCharacter(charId);
      else if (a === 'delete') openDeleteConfirm(charId);
    });
  });
  $ctxMenu.classList.add('show');
  const r = $ctxMenu.getBoundingClientRect();
  $ctxMenu.style.left = Math.min(x, window.innerWidth - r.width - 8) + 'px';
  $ctxMenu.style.top = Math.min(y, window.innerHeight - r.height - 8) + 'px';
}
function closeCtxMenu() { $ctxMenu.classList.remove('show'); ctxCharId = null; }

// ============================================================
// SIDEBAR MOBILE
// ============================================================
function toggleSidebar() { $sidebar.classList.contains('open') ? closeSidebar() : openSidebar(); }
function openSidebar() { $sidebar.classList.add('open'); $drawerBackdrop.classList.add('show'); }
function closeSidebar() { $sidebar.classList.remove('open'); $drawerBackdrop.classList.remove('show'); }
