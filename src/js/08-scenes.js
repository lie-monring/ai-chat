// ============================================================
// SCENE BAR (with transition)
// ============================================================
function renderSceneBar() {
  const ac = activeCharacter();
  const scenes = (ac && ac.scenes) ? ac.scenes : DEFAULT_SCENES;
  const activeScene = ac ? (ac.activeScene || '') : '';
  $sceneBar.innerHTML = '';
  scenes.forEach(s => {
    const pill = document.createElement('span');
    pill.className = 'pill' + (s.id === activeScene ? ' active' : '');
    pill.textContent = s.emoji + ' ' + s.name;
    pill.addEventListener('click', () => {
      const cur = activeCharacter(); if (!cur) return;
      cur.activeScene = s.id;
      const idx = characters.findIndex(c => c.id === cur.id);
      if (idx >= 0) { characters[idx].activeScene = s.id; saveCharacters(characters); }
      $sceneBar.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      $sceneTransitionLabel.textContent = s.emoji + ' ' + s.name;
      $sceneTransition.classList.add('show');
      setTimeout(() => $sceneTransition.classList.remove('show'), 600);
      showToast(s.id ? '场景切换：「' + s.name + '」' : '回到日常模式');
    });
    $sceneBar.appendChild(pill);
  });
}
