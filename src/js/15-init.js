// ============================================================
// INIT
// ============================================================
function init() {
  EMOJI_PALETTE.forEach(e => {
    const span = document.createElement('span');
    span.textContent = e;
    span.addEventListener('click', () => { $charEditEmoji.value = e; renderEmojiGrid(); });
    $emojiGrid.appendChild(span);
  });

  config = loadConfig();
  if (!config.version || config.version < CONFIG_VERSION) {
    migrateV1toV2();
    config = loadConfig();
    characters = loadCharacters();
    const ac = activeCharacter();
    if (ac) { activeMessages = loadMessages(ac.id); activeDiary = loadDiary(ac.id); }
    showToast('已升级为多角色模式 🎉');
  } else {
    characters = loadCharacters();
    if (characters.length === 0) { createDefaultStart(); characters = loadCharacters(); config = loadConfig(); }
    const ac = activeCharacter();
    if (ac) { activeMessages = loadMessages(ac.id); activeDiary = loadDiary(ac.id); }
    else if (characters.length > 0) { config.activeCharId = characters[0].id; saveConfig(config); activeMessages = loadMessages(characters[0].id); activeDiary = loadDiary(characters[0].id); }
  }

  const apiKey = config.apiKey || localStorage.getItem(OLD_KEY_KEY) || '';
  const theme = config.theme || localStorage.getItem(OLD_KEY_THEME) || '';
  enterSend = config.enterSend ? config.enterSend !== '0' : (localStorage.getItem(OLD_KEY_ENTER) !== '0');
  config.apiKey = apiKey; config.theme = theme; config.enterSend = enterSend ? '1' : '0';
  if (!config.activeCharId && characters.length > 0) config.activeCharId = characters[0].id;
  saveConfig(config);

  $apiKeyInput.value = apiKey;
  $enterSendToggle.checked = enterSend;
  $tempSlider.value = +(config.temperature||0.8); $tempDisplay.textContent = +(config.temperature||0.8);
  $maxTokensSlider.value = +(config.maxTokens||600); $tokensDisplay.textContent = +(config.maxTokens||600);
  $maxHistorySlider.value = +(config.maxHistory||MAX_HISTORY); $historyDisplay.textContent = +(config.maxHistory||MAX_HISTORY);
  $userTitleInput.value = config.userTitle || '';
  applyTheme();
  if (ensurePresetCharacters()) showToast('新的预设角色已加入 🎉');
  renderSidebar(); updateUI(); renderMessages(); updateCharCount(); updateStorageInfo();

  // ---- Event Listeners ----
  $btnAddChar.addEventListener('click', openAddCharacter);
  const $btnImportChar = document.getElementById('btn-import-char');
  if ($btnImportChar) $btnImportChar.addEventListener('click', () => $fileImport.click());
  $btnSidebarToggle.addEventListener('click', toggleSidebar);
  $drawerBackdrop.addEventListener('click', closeSidebar);
  document.addEventListener('click', e => { if (!$ctxMenu.contains(e.target)) closeCtxMenu(); });

  $btnSettings.addEventListener('click', () => $settingsPanel.classList.toggle('open'));
  $btnSaveKey.addEventListener('click', saveSettings);
  $btnClearChat.addEventListener('click', () => {
    if (confirm('确定要清空当前角色的聊天记录吗？')) { activeMessages = []; saveCurrentMessages(); renderMessages(); }
  });
  $btnExportAll.addEventListener('click', exportAllData);
  $btnImportAll.addEventListener('click', () => $fileImportBackup.click());
  $keyBannerLink.addEventListener('click', () => { $settingsPanel.classList.add('open'); $apiKeyInput.focus(); });
  $errorDismiss.addEventListener('click', hideError);
  $btnSend.addEventListener('pointerdown', e => { e.preventDefault(); sendMessage(e); });
  $btnStop.addEventListener('click', stopGeneration);
  $btnTheme.addEventListener('click', toggleTheme);
  $btnYukiCall.addEventListener('click', yukiInitiative);
  $btnSearch.addEventListener('click', toggleSearch);
  $enterSendToggle.addEventListener('change', () => {
    enterSend = $enterSendToggle.checked;
    config.enterSend = enterSend ? '1' : '0';
    saveConfig(config);
  });
  $tempSlider.addEventListener('input', () => { config.temperature = $tempSlider.value; $tempDisplay.textContent = $tempSlider.value; saveConfig(config); });
  $maxTokensSlider.addEventListener('input', () => { config.maxTokens = $maxTokensSlider.value; $tokensDisplay.textContent = $maxTokensSlider.value; saveConfig(config); });
  $maxHistorySlider.addEventListener('input', () => { config.maxHistory = $maxHistorySlider.value; $historyDisplay.textContent = $maxHistorySlider.value; saveConfig(config); });
  $userTitleInput.addEventListener('input', () => { config.userTitle = $userTitleInput.value.trim(); saveConfig(config); });
  $btnDiary.addEventListener('click', openDiary);
  $btnDiaryClose.addEventListener('click', () => $diaryOverlay.classList.remove('show'));
  $btnDiaryWrite.addEventListener('click', writeDiary);
  $diaryOverlay.addEventListener('click', e => { if (e.target === $diaryOverlay) $diaryOverlay.classList.remove('show'); });
  $samePersonBadge.addEventListener('click', switchToSamePerson);

  // Search listeners
  $searchInput.addEventListener('input', debounce(doSearch, 200));
  $searchPrev.addEventListener('click', () => navigateSearch(-1));
  $searchNext.addEventListener('click', () => navigateSearch(1));
  $searchClose.addEventListener('click', toggleSearch);
  $searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); navigateSearch(e.shiftKey ? -1 : 1); }
    if (e.key === 'Escape') toggleSearch();
  });

  // Input with debounce for UI updates
  const debouncedInputUI = debounce(() => {
    updateInputMeta();
    updateTokenEstimate();
    updateUI();
  }, 150);

  $input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      if (enterSend && !e.shiftKey) { e.preventDefault(); sendMessage(); }
      else if (!enterSend && e.ctrlKey) { e.preventDefault(); sendMessage(); }
    }
  });
  $input.addEventListener('input', () => {
    $input.style.height = 'auto';
    $input.style.height = Math.min($input.scrollHeight, 100) + 'px';
    debouncedInputUI();
  });

  document.addEventListener('click', e => { if (!e.target.closest('.msg')) closeActionMenus(); });

  $btnCharEditCancel.addEventListener('click', () => $modalCharEdit.classList.remove('show'));
  $btnCharEditSave.addEventListener('click', saveCharEdit);
  $modalCharEdit.addEventListener('click', e => { if (e.target === $modalCharEdit) $modalCharEdit.classList.remove('show'); });
  $charEditEmoji.addEventListener('input', renderEmojiGrid);
  const $btnImportFromModal = document.getElementById('btn-import-from-modal');
  if ($btnImportFromModal) $btnImportFromModal.addEventListener('click', () => $fileImport.click());

  $btnImportCancel.addEventListener('click', () => { $modalImportConfirm.classList.remove('show'); pendingImport = null; });
  $btnImportConfirm.addEventListener('click', confirmImport);
  $modalImportConfirm.addEventListener('click', e => { if (e.target === $modalImportConfirm) { $modalImportConfirm.classList.remove('show'); pendingImport = null; } });
  $btnDeleteCancel.addEventListener('click', () => { $modalDeleteConfirm.classList.remove('show'); pendingDeleteId = null; });
  $btnDeleteConfirm.addEventListener('click', confirmDelete);
  $modalDeleteConfirm.addEventListener('click', e => { if (e.target === $modalDeleteConfirm) { $modalDeleteConfirm.classList.remove('show'); pendingDeleteId = null; } });

  $fileImport.addEventListener('change', handleFileImport);
  $fileImportBackup.addEventListener('change', handleBackupImport);

  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      const idx = e.key === '0' ? 9 : parseInt(e.key) - 1;
      if (idx < characters.length) switchCharacter(characters[idx].id);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      if (!$searchBar.classList.contains('open')) toggleSearch();
      $searchInput.focus();
    }
  });

  // ---- Mobile swipe gestures for sidebar ----
  let touchStartX = 0, touchStartY = 0, isSwiping = false;
  document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isSwiping = false;
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (Math.abs(dx) > 30 && Math.abs(dx) > Math.abs(dy) * 1.5) isSwiping = true;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!isSwiping) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx > 80 && touchStartX < 30 && !$sidebar.classList.contains('open')) {
      openSidebar();
    }
    if (dx < -80 && $sidebar.classList.contains('open')) {
      closeSidebar();
    }
  }, { passive: true });

  // ---- Mobile keyboard viewport adjustment ----
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const vh = window.visualViewport.height;
      document.documentElement.style.setProperty('--vvh', vh + 'px');
      if (document.activeElement === $input) scrollToBottom();
    });
  }
}
