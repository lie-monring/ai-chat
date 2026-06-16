// ============================================================
// SETTINGS
// ============================================================
function saveSettings() {
  config.apiKey = $apiKeyInput.value.trim();
  saveConfig(config);
  $settingsPanel.classList.remove('open');
  updateUI();
}

// ============================================================
// UI
// ============================================================
function updateUI() {
  const ac = activeCharacter();
  const hasKey = (config.apiKey || '').length > 0;
  $keyBanner.classList.toggle('show', !hasKey);
  const blocked = !hasKey || isLoading || $input.value.trim() === '';
  $btnSend.classList.toggle('disabled', blocked);
  $input.disabled = !hasKey || isLoading;
  if (!hasKey) $statusText.textContent = '未连接';
  else if (isLoading) $statusText.textContent = '正在输入…';
  else $statusText.textContent = '在线';
  if (ac) { $headerAvatar.textContent = ac.emoji || '💬'; $headerName.textContent = ac.name; }
  if (ac && ac.samePersonGroup) {
    const sib = characters.find(c => c.samePersonGroup === ac.samePersonGroup && c.id !== ac.id);
    if (sib) { $samePersonBadge.style.display = 'inline'; $samePersonBadge.title = '切换到 ' + (sib.stateDescription || sib.name); }
    else $samePersonBadge.style.display = 'none';
  } else $samePersonBadge.style.display = 'none';
  $input.placeholder = ac ? '和 ' + ac.name + ' 说点什么吧…' : '说点什么吧…';
  updateTokenEstimate();
}
