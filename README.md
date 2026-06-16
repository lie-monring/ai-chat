# Yuki Chat — 单文件 AI 角色聊天应用

> 基于 DeepSeek API 的浏览器端 AI 聊天应用。纯前端实现，零依赖，打开即用。
>
> 个人娱乐项目，亦是前端工程能力的实践作品。

![GitHub repo size](https://img.shields.io/github/repo-size/lie-monring/ai-chat)
![GitHub License](https://img.shields.io/gitlab/license/lie-monring/ai-chat)
![Built with](https://img.shields.io/badge/built%20with-vanilla%20JS-%23e8879a)

## 功能特性

- **多角色系统** — 预设 3 组动漫风格 AI 角色（澪、拉姆、蕾姆×拉姆），支持自定义创建、编辑、删除、复制。基于 System Prompt 驱动角色人格
- **流式对话** — SSE（Server-Sent Events）实时流式输出，支持中途停止生成，含超时保护（30s）与全局超时（35s）
- **场景切换** — 每个角色 6 种预设场景（日常、深夜、洗澡后、车里、学校、做饭、打游戏），一键切换对话氛围，动态注入场景上下文
- **日记本** — 调用 AI 根据最近对话自动生成角色视角的私人日记
- **明暗主题** — CSS 自定义属性驱动的双主题系统，15 个语义化变量覆盖全部组件
- **Markdown 渲染** — 消息支持 Markdown 格式（代码高亮、引用块、列表等），代码块一键复制
- **消息搜索** — 在当前对话中正则搜索，支持上下导航
- **数据管理** — JSON / PNG 角色卡（Character Card v2/v3 spec）导入导出，全量数据备份与恢复
- **localStorage 持久化** — 对话记录、角色配置、用户设置全本地存储，含 Quota 检测和 v1→v2 Schema 迁移
- **移动端适配** — 响应式布局，手机端侧栏抽屉式交互，`100dvh` 视口适配

## 快速开始

1. 下载 [`yuki-chat.html`](yuki-chat.html)，用浏览器打开
2. 点击右上角 ⚙ → 填入 [DeepSeek API Key](https://platform.deepseek.com/)
3. 从左侧选择角色，开始聊天

> **无需构建。** `yuki-chat.html` 是完整的单文件应用。如果你要修改源码，见下方构建说明。

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端框架 | **无** — Vanilla JavaScript（ES6+），零运行时依赖 |
| UI 样式 | CSS Custom Properties 主题系统，无 CSS 框架 |
| AI 接口 | DeepSeek API（`deepseek-chat`），SSE 流式调用 |
| 持久化 | `localStorage`，结构化键值存储，含 Quota 边界处理 |
| 构建 | Node.js 19 行拼接脚本，`@include` 标记驱动 |
| AI 辅助 | Claude Code — AI 辅助开发，`CLAUDE.md` 作为项目 AI 协作指南 |

## 架构

### 源码结构

源码 16 个 JS 模块 + 5 个 CSS 模块存放在 `src/` 目录，通过 `node build.js` 拼接为单文件 `yuki-chat.html`。

```
src/
├── index.html              # HTML 骨架 + @include 标记
├── css/
│   ├── 00-variables.css    # CSS 变量，明暗双主题色板
│   ├── 01-layout.css       # 应用外壳、侧栏布局、顶栏
│   ├── 02-components.css   # 按钮、弹窗、设置面板、Toast、遮罩
│   ├── 03-messages.css     # 消息气泡、Markdown 排版、打字指示器
│   └── 04-responsive.css   # 移动端 @media 断点
└── js/
    ├── 00-constants.js     # API 地址、存储键、角色 Prompt、预设角色
    ├── 01-utils.js         # deepClone、formatTime、estimateTokens、showToast
    ├── 02-markdown.js      # Markdown → HTML 渲染、代码块复制
    ├── 03-storage.js       # localStorage CRUD、v1→v2 迁移、Quota 检测
    ├── 04-dom-refs.js      # 全局 DOM 引用集中管理
    ├── 05-state.js         # 全局状态（config、characters、activeMessages）
    ├── 06-sidebar.js       # 侧栏角色列表、右键上下文菜单
    ├── 07-characters.js    # 角色 CRUD、导入导出、Character Card 解析
    ├── 08-scenes.js        # 场景 Pill 切换栏
    ├── 09-search.js        # 消息搜索、结果导航
    ├── 10-diary.js         # AI 日记生成与渲染
    ├── 11-theme.js         # 明暗主题切换
    ├── 12-messages.js      # 消息渲染、编辑、重试、重新生成
    ├── 13-api.js           # SSE 流式请求、AbortController、rAF 节流
    ├── 14-ui.js            # UI 状态聚合更新、设置保存
    └── 15-init.js          # 启动初始化、全部事件绑定
```

### JS 模块加载顺序

```
constants → utils → markdown → storage → dom-refs → state
  → sidebar → characters → scenes → search → diary
  → theme → messages → api → ui → init
```

每个模块假定前面的模块已加载。`function` 声明提升，`const`/`let` 不提升——因此在 `00-constants.js` 中，预设角色数组 `PRESET_CHARACTERS` 必须定义在它所引用的 `DEFAULT_SCENES` 和 persona prompt 常量之后。

### 数据流

```
用户输入 → sendMessage() → activeMessages.push(userMsg)
                                 ↓
                       generateResponse()
                                 ↓
                 POST /v1/chat/completions (SSE)
                                 ↓
                 ReadableStream reader 逐 token 解析
                                 ↓
              updateLastBubble() [rAF 节流] → DOM 更新
                                 ↓
                   saveCurrentMessages() → localStorage
```

## 构建

```bash
node build.js
# 输出: yuki-chat.html (xxx KB)
```

构建脚本读取 `src/index.html`，将所有 `<!-- @include path/to/file -->` 标记替换为对应文件内容，输出完整的单文件 HTML。

## 技术亮点

适合面试官关注的工程细节：

- **SSE 流式处理** — 手动解析 `ReadableStream`，逐行拆分 SSE `data:` 帧，处理跨 chunk 断行。双超时保护：请求级 30s `AbortController` + 全局 35s `setTimeout` 兜底
- **rAF 节流渲染** — 流式输出期间，DOM 更新经 `requestAnimationFrame` 节流，避免每次 token 到达都触发强制回流（layout thrashing）
- **Schema 版本迁移** — `migrateV1toV2()` 将旧版扁平键值结构无损迁移到新的角色-消息分层模型，对用户透明
- **Character Card PNG 解析** — 支持从 PNG 文件的 `tEXt` 辅助 chunk 中读取 v2/v3 格式的角色卡 JSON 数据
- **CSS 变量主题系统** — 15 个语义化 CSS 自定义属性（`--bg`、`--primary`、`--bubble-ai` 等），切换 `[data-theme]` 属性即可全局换肤，无需 JS 操作任何元素的样式
- **localStorage 安全边界** — 所有 `localStorage` 读写包裹 `try-catch`，捕获 `QuotaExceededError` 并提示用户。存储空间可视化（用量条 + 百分比）
- **零依赖** — 整个应用不依赖任何 npm 包、CDN、框架。约 2000 行源代码，可读性强

## AI 辅助开发

本项目使用 **Claude Code** 辅助开发。仓库中的 [`CLAUDE.md`](CLAUDE.md) 是项目的 AI 协作指南——包含架构说明、模块加载顺序、常见陷阱和构建命令。这是一种现代前端工程实践中越来越常见的工作流：将项目上下文结构化地提供给 AI 编码助手，提升协作效率。

## 截图

> *建议添加应用截图，放入 `screenshots/` 目录并在下方引用。*

<!-- ![主界面](screenshots/main.png) -->
<!-- ![深色模式](screenshots/dark.png) -->

## License

MIT © [lie-monring](https://github.com/lie-monring)
