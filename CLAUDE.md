# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Single-file AI chat web app. Uses DeepSeek API for AI responses. Personal entertainment project — not for production.

**Source is multi-file in `src/`; built to one file via `build.js`.**

## How to use

Open `yuki-chat.html` in a browser (`file://` protocol works). Set DeepSeek API Key in settings (⚙). Chat with AI characters.

## Build

```
node build.js
```

Concatenates all `@include`d files from `src/` into `yuki-chat.html`. The `@include` markers in `src/index.html` define order.

## Verify syntax after changes

```powershell
node build.js
$html = Get-Content yuki-chat.html -Raw -Encoding UTF8
$js = $html.Substring($html.IndexOf('<script>') + 8)
$js = $js.Substring(0, $js.LastIndexOf('</script>'))
$tmp = "$env:TEMP\_check.js"
[System.IO.File]::WriteAllText($tmp, $js, [System.Text.Encoding]::UTF8)
node --check $tmp
```

## Source structure

```
src/
├── index.html              # HTML skeleton with <!-- @include ... --> markers
├── css/
│   ├── 00-variables.css    # CSS variables (* must be first)
│   ├── 01-layout.css       # App shell, sidebar, header
│   ├── 02-components.css   # Buttons, modals, settings, toast, overlays
│   ├── 03-messages.css     # Message bubbles, markdown, typing, empty state
│   └── 04-responsive.css   # Mobile @media queries
└── js/
    ├── 00-constants.js     # API URL, storage keys, persona prompts, PRESET_CHARACTERS, DEFAULT_SCENES
    ├── 01-utils.js         # deepClone, formatTime, estimateTokens, showToast, showError
    ├── 02-markdown.js      # renderMarkdown, copyCodeBlock
    ├── 03-storage.js       # localStorage CRUD, migration (v1→v2), saveCurrentMessages/Diary
    ├── 04-dom-refs.js      # All $element consts
    ├── 05-state.js         # Global config/characters/activeMessages + activeCharacter(), activeSystemPrompt()
    ├── 06-sidebar.js       # renderSidebar, renderCharItem, context menu, mobile sidebar
    ├── 07-characters.js    # switchCharacter, CRUD, import/export, character card mapping
    ├── 08-scenes.js        # renderSceneBar (scene pill switching)
    ├── 09-search.js        # toggleSearch, doSearch, navigateSearch
    ├── 10-diary.js         # Diary read/write via API
    ├── 11-theme.js         # applyTheme, toggleTheme (dark/light)
    ├── 12-messages.js      # renderMessages, edit/retry/regenerate, scrollToBottom
    ├── 13-api.js           # sendMessage, generateResponse (SSE streaming), yukiInitiative
    ├── 14-ui.js            # updateUI, saveSettings
    └── 15-init.js          # init() — all event bindings + startup
```

JS files are plain concatenation (no ES modules). Order matters: each file assumes everything before it is already defined. `function` declarations are hoisted but `const`/`let` are not — ensure constants are defined before use.

## Architecture

**Characters** stored in `localStorage` under `yuki_chat_characters`. Each has: id, name, emoji, prompt (system prompt), description, userTitle (how AI addresses user), scenes (scene switching suffixes), samePersonGroup (for grouping variants of same person).

**Preset characters** (`PRESET_CHARACTERS` array in `src/js/00-constants.js`) auto-added on first load if missing from localStorage. Currently: 澪 (Mio), 拉姆 (Ram), 蕾姆和拉姆 (Twins).

**Conversations** stored per-character in `localStorage` under `yuki_chat_msgs_<charId>`. Messages have `{role, content, ts}`.

**Config** in `localStorage` under `yuki_chat_config`: apiKey, theme, enterSend, activeCharId, temperature, maxTokens, maxHistory, userTitle.

## Key JS globals

- `characters[]` — all character objects
- `activeMessages[]` — current character's messages
- `config` — settings object
- `activeCharacter()` — returns currently selected character
- `activeSystemPrompt()` — builds the full system prompt (persona + scene + userTitle replacement)
- `PRESET_CHARACTERS` — uses `deepClone(DEFAULT_SCENES)` in its initializer; both must be defined before it

## Adding a preset character

1. Add `const PERSONA_XXX_PROMPT = \`...\`;` in `src/js/00-constants.js`, before `PRESET_CHARACTERS`
2. Add entry to `PRESET_CHARACTERS` array
3. Include `userTitle` field (e.g. `'主人'`, `'弟弟'`)
4. `node build.js` then `node --check` verify

## Common pitfalls

- Template literals in persona prompts: never put a raw backtick inside the prompt text
- `PRESET_CHARACTERS` references `deepClone(DEFAULT_SCENES)` — `deepClone` is a `function` declaration (hoisted), but `DEFAULT_SCENES` and persona prompts are `const` (not hoisted), so they must appear before `PRESET_CHARACTERS` in `00-constants.js`
- File opened via `file://` — localStorage works but some browsers have quirks
- `window.copyCodeBlock` is set on the global `window` object for inline `onclick` handlers

## Other files

- `yuki-chat1.html` — older working reference version (has search feature)
- `yuki-chat_backup*.html` — backups
