// ============================================================
// TOKEN ESTIMATE & INPUT META
// ============================================================
function updateTokenEstimate() {
  if (!activeMessages.length) { $tokenInfo.textContent = ''; return; }
  const tokens = estimateTokens(activeMessages.map(m=>m.content||'').join(''));
  $tokenInfo.textContent = activeMessages.length + ' 条消息 · ~' + tokens + ' tokens';
}
function updateInputMeta() {
  const len = $input.value.length;
  $inputMeta.textContent = len > 0 ? len + ' 字' : '';
}

// ============================================================
// API (with AbortController + robust SSE + error handling)
// ============================================================
function setLoading(v) {
  isLoading = v;
  $typing.classList.toggle('show', v);
  $btnStop.classList.toggle('show', v);
  updateUI();
  if (v) scrollToBottom();
}

function stopGeneration() {
  if (abortController) { abortController.abort(); abortController = null; }
  const lastMsg = activeMessages[activeMessages.length - 1];
  if (lastMsg && lastMsg.role === 'assistant' && !lastMsg.content) {
    lastMsg.content = '（已停止生成）';
  }
  setLoading(false);
  saveCurrentMessages();
  renderMessages();
  showToast('已停止生成');
}

async function sendMessage(e) {
  if ($btnSend.classList.contains('disabled')) return;
  const text = $input.value.trim(); if (!text) return;
  if (e && e.target && e.target.blur) try { e.target.blur(); } catch {}
  $input.value = ''; $input.style.height = 'auto'; $inputMeta.textContent = '';
  const ac = activeCharacter();
  activeMessages.push({ role:'user', content:text, characterId:ac?ac.id:'', ts:Date.now() });
  saveCurrentMessages(); renderMessages(); $input.focus(); updateUI();
  await generateResponse();
}

// ============================================================
// SUMMARY (token-saving conversation memory)
// ============================================================
function loadSummary(charId) { return storageGet(STORAGE_KEY_SUMMARY_PFX + charId, { count: 0, text: '' }); }
function saveSummary(charId, s) { storageSet(STORAGE_KEY_SUMMARY_PFX + charId, s); }

async function runSummary(prevText, msgs) {
  const apiKey = config.apiKey;
  if (!apiKey || !msgs.length) return '';
  const body = (prevText ? '【之前的摘要】\n' + prevText + '\n\n【新增对话】\n' : '【对话】\n') +
    msgs.map(m => (m.role === 'user' ? '玩家' : '角色') + '：' + (m.content || '')).join('\n');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const resp = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: '你是对话摘要助手。把下面的角色扮演对话压缩成一段第三人称的简短摘要（150字以内），保留关键情节、情绪变化、人物关系和重要事件，去掉寒暄和重复。直接输出摘要本身，不要加任何说明或标题。' },
          { role: 'user', content: body }
        ],
        stream: false, temperature: 0.3, max_tokens: 300
      }),
      signal: ctrl.signal
    });
    clearTimeout(timer);
    if (!resp.ok) return '';
    const data = await resp.json();
    return (data.choices?.[0]?.message?.content || '').trim();
  } catch {
    clearTimeout(timer);
    return '';
  }
}

async function generateResponse(systemSuffix) {
  const apiKey = config.apiKey;
  if (!apiKey) return;
  if (isLoading) {
    if (abortController) { abortController.abort(); abortController = null; }
    setLoading(false);
  }
  setLoading(true);
  hideError();

  let sys = activeSystemPrompt();
  if (systemSuffix) sys += '\n\n' + systemSuffix;

  const ac = activeCharacter();
  const acId = ac ? ac.id : '';

  // 对话记忆省 token：更早的对话折叠成摘要，只带最近几条原文
  const apiMessages = [{ role:'system', content:sys }];
  const total = activeMessages.length;
  const recentN = Math.min(SUMMARY_RECENT, total);
  const recent = activeMessages.slice(total - recentN);
  const olderCount = total - recentN;
  let summaryText = '';
  let rawPrefix = [];
  if (olderCount > 0) {
    let st = loadSummary(acId);
    if (st.count > olderCount) { st = { count: 0, text: '' }; saveSummary(acId, st); }
    rawPrefix = activeMessages.slice(st.count, olderCount);
    if (rawPrefix.length >= SUMMARY_BATCH) {
      const newText = await runSummary(st.text, rawPrefix);
      if (newText) { st = { count: olderCount, text: newText }; saveSummary(acId, st); rawPrefix = []; }
      else rawPrefix = activeMessages.slice(0, olderCount);
    }
    summaryText = st.text;
  }
  if (summaryText) apiMessages.push({ role:'system', content:'【更早的对话摘要 · 仅供记忆参考，请勿逐字复述】\n' + summaryText });
  for (const m of rawPrefix) apiMessages.push({ role:m.role, content:m.content });
  for (const m of recent) apiMessages.push({ role:m.role, content:m.content });

  // 摘要等待期间可能发生了停止或切换角色，此时不再继续发送
  const stillAc = activeCharacter();
  if (!isLoading || !stillAc || stillAc.id !== acId) return;

  activeMessages.push({ role:'assistant', content:'', characterId:acId, ts:Date.now() });
  const aiIdx = activeMessages.length - 1;

  abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 30000);
  const safetyTimer = setTimeout(() => {
    if (isLoading) {
      if (abortController) { abortController.abort(); abortController = null; }
      setLoading(false);
      showError('请求超时，已自动停止', true);
    }
  }, 35000);

  try {
    const resp = await fetch(DEEPSEEK_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
      body:JSON.stringify({ model:MODEL, messages:apiMessages, stream:true, temperature:+(config.temperature||1.0), max_tokens:+(config.maxTokens||1200), frequency_penalty:0.4 }),
      signal: abortController.signal
    });
    clearTimeout(timeoutId);
    clearTimeout(safetyTimer);
    if (!resp.ok) {
      const t = await resp.text();
      let errMsg;
      try { errMsg = JSON.parse(t).error?.message || t; } catch { errMsg = t; }
      if (resp.status === 401) errMsg = 'API Key 无效，请在设置中检查';
      else if (resp.status === 429) errMsg = '请求太频繁，请稍后再试';
      else if (resp.status >= 500) errMsg = '服务器暂时不可用，请稍后再试';
      throw new Error(errMsg);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const l of lines) {
        const s = l.trim();
        if (!s) continue;
        if (!s.startsWith('data:')) continue;
        const d = s.slice(5).trim();
        if (d === '[DONE]') continue;
        try {
          const parsed = JSON.parse(d);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            activeMessages[aiIdx].content += content;
            updateLastBubble(aiIdx);
          }
        } catch {}
      }
    }
    if (buf.trim()) {
      const s = buf.trim();
      if (s.startsWith('data:') && s.slice(5).trim() !== '[DONE]') {
        try {
          const content = JSON.parse(s.slice(5).trim()).choices?.[0]?.delta?.content;
          if (content) activeMessages[aiIdx].content += content;
        } catch {}
      }
    }
    if (!activeMessages[aiIdx].content) activeMessages[aiIdx].content = '（没有说话…可能是信号不好啦）';
  } catch (err) {
    clearTimeout(timeoutId);
    clearTimeout(safetyTimer);
    if (err.name === 'AbortError') {
      if (!activeMessages[aiIdx].content) {
        activeMessages[aiIdx].content = '（请求超时，请稍后再试）';
        showError('请求超时（30秒），请检查网络或稍后重试', true);
      }
    } else {
      activeMessages[aiIdx].content = '唔…好像出了点问题…等等再试试好不好？\n\n（' + err.message + '）';
      showError('请求失败: ' + err.message, true);
    }
  }

  abortController = null;
  saveCurrentMessages(); renderMessages(); setLoading(false); updateUI(); updateTokenEstimate();
  $input.focus();
}

let _streamBubble = null;
let _rafId = 0;
function updateLastBubble(idx) {
  if (!_streamBubble) {
    _streamBubble = document.querySelector('.msg.ai:last-child .bubble-inner');
  }
  cancelAnimationFrame(_rafId);
  _rafId = requestAnimationFrame(() => {
    if (_streamBubble) {
      _streamBubble.innerHTML = renderMarkdown(activeMessages[idx].content);
      scrollToBottom();
    }
  });
}

function yukiInitiative() {
  const apiKey = config.apiKey;
  if (!apiKey) return;
  if (isLoading) {
    if (abortController) { abortController.abort(); abortController = null; }
    setLoading(false);
  }
  const c = activeCharacter();
  const title = config.userTitle || (c && c.userTitle) || '哥哥';
  generateResponse(
    '【注意】现在' + title + '没有说话，也没有发来任何新消息。你是在主动延续自己刚才正在做的事、正在说的话——接着上文继续你自己的动作、神态、心理和台词，就像你突然又想起什么、想主动开口一样。\n' +
    '- 绝对不要虚构' + title + '说了什么，不要替' + title + '回复，也不要假装回应一条根本不存在的消息\n' +
    '- 直接接着你自己的动作和话语写下去即可'
  );
}
