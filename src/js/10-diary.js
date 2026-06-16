// ============================================================
// DIARY
// ============================================================
function openDiary() {
  const ac = activeCharacter();
  if (ac) $diaryTitle.textContent = '📔 ' + ac.emoji + ' ' + ac.name + ' 的日记本';
  renderDiary(); $diaryOverlay.classList.add('show');
}
function renderDiary() {
  $diaryBody.innerHTML = '';
  if (activeDiary.length === 0) { $diaryBody.innerHTML = '<div id="diary-empty">📖<br><br>还没有日记<br>点下面的按钮写第一篇吧～</div>'; return; }
  [...activeDiary].reverse().forEach(d => {
    const el = document.createElement('div');
    el.className = 'diary-entry';
    el.innerHTML = '<div class="date">' + escapeHtml(d.date) + '</div><div class="content">' + escapeHtml(d.content) + '</div>';
    $diaryBody.appendChild(el);
  });
}
async function writeDiary() {
  const apiKey = config.apiKey;
  if (!apiKey) { showToast('请先设置 API Key'); return; }
  if (activeMessages.length < 2) { showToast('先聊几句再写日记吧～'); return; }
  if (isLoading) return;
  $btnDiaryWrite.disabled = true; $btnDiaryWrite.textContent = '正在写日记…';
  const recent = JSON.stringify(activeMessages.slice(-20).map(m => ({role:m.role,content:m.content})));
  const diaryPrompt = '你刚刚和哥哥进行了以下对话：'+recent+'\n\n请以第一人称口吻，把刚才发生的事写成一篇日记。日记风格参考：\n- 开头写【日记】\n- 用自己的语气和视角回忆刚才的对话\n- 表达真实心情和感受\n- 自然地收尾\n- 不要提到"AI"、"程序"、"角色扮演"等词汇\n- 大概200-400字\n- 结尾加上【日记书写时间为'+new Date().toLocaleString('zh-CN')+'】';
  try {
    const resp = await fetch(DEEPSEEK_URL, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey}, body:JSON.stringify({model:MODEL,messages:[{role:'system',content:activeSystemPrompt()},{role:'user',content:diaryPrompt}],stream:false,temperature:+(config.temperature||0.8),max_tokens:800}) });
    if (!resp.ok) throw new Error('API error');
    const data = await resp.json();
    activeDiary.push({ date:new Date().toLocaleString('zh-CN'), content:data.choices?.[0]?.message?.content||'日记写不出来…' });
    saveCurrentDiary(); renderDiary(); showToast('日记写好啦 📔');
  } catch(err) { showToast('日记写入失败: '+err.message); }
  $btnDiaryWrite.disabled = false; $btnDiaryWrite.textContent = '✏️ 写一篇新日记';
}
