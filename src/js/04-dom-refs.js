// ============================================================
// DOM REFS
// ============================================================
const $sidebar = document.getElementById('sidebar');
const $sidebarList = document.getElementById('sidebar-list');
const $charCount = document.getElementById('char-count');
const $btnAddChar = document.getElementById('btn-add-char');
const $btnSidebarToggle = document.getElementById('btn-sidebar-toggle');
const $drawerBackdrop = document.getElementById('drawer-backdrop');
const $ctxMenu = document.getElementById('ctx-menu');

const $chatArea = document.getElementById('chat-area');
const $header = document.getElementById('header');
const $headerAvatar = document.getElementById('header-avatar');
const $headerName = document.getElementById('header-name');
const $samePersonBadge = document.getElementById('same-person-badge');
const $statusText = document.getElementById('status-text');
const $btnSearch = document.getElementById('btn-search');
const $btnYukiCall = document.getElementById('btn-yuki-call');
const $btnTheme = document.getElementById('btn-theme');
const $btnSettings = document.getElementById('btn-settings');
const $sceneBar = document.getElementById('scene-bar');
const $settingsPanel = document.getElementById('settings-panel');
const $apiKeyInput = document.getElementById('api-key-input');
const $enterSendToggle = document.getElementById('enter-send-toggle');
const $btnSaveKey = document.getElementById('btn-save-key');
const $btnClearChat = document.getElementById('btn-clear-chat');
const $btnExportAll = document.getElementById('btn-export-all');
const $btnImportAll = document.getElementById('btn-import-all');
const $storageInfo = document.getElementById('storage-info');
const $storageFill = document.getElementById('storage-fill');
const $keyBanner = document.getElementById('key-banner');
const $keyBannerLink = document.getElementById('key-banner-link');
const $errorBanner = document.getElementById('error-banner');
const $errorText = document.getElementById('error-text');
const $errorDismiss = document.getElementById('error-dismiss');
const $messages = document.getElementById('messages');
const $typing = document.getElementById('typing');
const $input = document.getElementById('user-input');
const $inputMeta = document.getElementById('input-meta');
const $btnSend = document.getElementById('btn-send');
const $btnScrollBottom = document.getElementById('btn-scroll-bottom');
const $tempSlider = document.getElementById('temperature-slider');
const $tempDisplay = document.getElementById('temp-display');
const $maxTokensSlider = document.getElementById('max-tokens-slider');
const $tokensDisplay = document.getElementById('tokens-display');
const $maxHistorySlider = document.getElementById('max-history-slider');
const $historyDisplay = document.getElementById('history-display');
const $userTitleInput = document.getElementById('user-title-input');
const $setThemeColor = document.getElementById('set-theme-color');
const $setBgColor = document.getElementById('set-bg-color');
const $setBgCustom = document.getElementById('set-bg-custom');
const $btnBgImagePick = document.getElementById('btn-bg-image-pick');
const $btnBgImageClear = document.getElementById('btn-bg-image-clear');
const $fileBgImage = document.getElementById('file-bg-image');
const $btnAvatarImagePick = document.getElementById('btn-avatar-image-pick');
const $btnAvatarImageClear = document.getElementById('btn-avatar-image-clear');
const $fileAvatarImage = document.getElementById('file-avatar-image');
const $colorCharName = document.getElementById('color-char-name');
const $btnStop = document.getElementById('btn-stop');
const $tokenInfo = document.getElementById('token-info');
const $toast = document.getElementById('toast');

// Search
const $searchBar = document.getElementById('search-bar');
const $searchInput = document.getElementById('search-input');
const $searchCount = document.getElementById('search-count');
const $searchPrev = document.getElementById('search-prev');
const $searchNext = document.getElementById('search-next');
const $searchClose = document.getElementById('search-close');

// Scene transition
const $sceneTransition = document.getElementById('scene-transition');
const $sceneTransitionLabel = document.getElementById('scene-transition-label');

// Modals
const $modalCharEdit = document.getElementById('modal-char-edit');
const $modalCharTitle = document.getElementById('modal-char-title');
const $charEditName = document.getElementById('char-edit-name');
const $charEditEmoji = document.getElementById('char-edit-emoji');
const $charEditDesc = document.getElementById('char-edit-desc');
const $charEditPrompt = document.getElementById('char-edit-prompt');
const $emojiGrid = document.getElementById('emoji-grid');
const $btnCharEditCancel = document.getElementById('btn-char-edit-cancel');
const $btnCharEditSave = document.getElementById('btn-char-edit-save');

const $modalImportConfirm = document.getElementById('modal-import-confirm');
const $importPreview = document.getElementById('import-preview');
const $btnImportCancel = document.getElementById('btn-import-cancel');
const $btnImportConfirm = document.getElementById('btn-import-confirm');

const $modalDeleteConfirm = document.getElementById('modal-delete-confirm');
const $deleteMsg = document.getElementById('delete-msg');
const $btnDeleteCancel = document.getElementById('btn-delete-cancel');
const $btnDeleteConfirm = document.getElementById('btn-delete-confirm');

const $fileImport = document.getElementById('file-import');
const $fileImportBackup = document.getElementById('file-import-backup');
