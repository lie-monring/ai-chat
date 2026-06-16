// ============================================================
// SEARCH
// ============================================================
function toggleSearch() {
  const isOpen = $searchBar.classList.contains('open');
  if (isOpen) { closeSearch(); } else {
    $searchBar.classList.add('open');
    $btnSearch.classList.add('active-filter');
    $searchInput.focus();
  }
}
function closeSearch() {
  $searchBar.classList.remove('open');
  $btnSearch.classList.remove('active-filter');
  $searchInput.value = '';
  $searchCount.textContent = '';
  searchResults = []; searchIdx = -1; currentSearchTerm = '';
  renderMessages();
}
function doSearch() {
  const term = $searchInput.value.trim().toLowerCase();
  currentSearchTerm = term;
  searchResults = []; searchIdx = -1;
  if (!term) { $searchCount.textContent = ''; renderMessages(); return; }
  activeMessages.forEach((m, i) => {
    if (m.content.toLowerCase().includes(term)) searchResults.push(i);
  });
  if (searchResults.length > 0) {
    searchIdx = 0;
    $searchCount.textContent = (searchIdx+1) + '/' + searchResults.length;
    renderMessages();
    scrollToMessage(searchResults[searchIdx]);
  } else {
    $searchCount.textContent = '0 结果';
    renderMessages();
  }
}
function navigateSearch(dir) {
  if (searchResults.length === 0) return;
  searchIdx = (searchIdx + dir + searchResults.length) % searchResults.length;
  $searchCount.textContent = (searchIdx+1) + '/' + searchResults.length;
  scrollToMessage(searchResults[searchIdx]);
}
function scrollToMessage(idx) {
  const el = $messages.querySelector('.msg[data-idx="'+idx+'"]');
  if (el) el.scrollIntoView({ behavior:'smooth', block:'center' });
}
