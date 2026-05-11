# Markdown Picture Paste 🖼️

> 在 VS Code 中优雅地管理 Markdown 文档中的图片——粘贴即存，删除即清。
>
> Elegantly manage images in Markdown documents within VS Code — paste to save, delete to clean.

[![VS Code](https://img.shields.io/badge/VS%20Code-1.85%2B-blue)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ 功能特性 / Features

### 📸 一键粘贴图片 / Paste Image with One Click
在 Markdown 文件中按下 `Ctrl+Alt+V`（Mac: `Cmd+Alt+V`），自动完成：
Press `Ctrl+Alt+V` (Mac: `Cmd+Alt+V`) in a Markdown file to:
- 从剪贴板读取图片 / Read image from clipboard
- 保存到当前文档同名的**隐藏文件夹** / Save to a hidden folder named after the document
- 自动插入 Markdown 图片引用 / Auto-insert Markdown image reference

### 🧹 自动清理未引用图片 / Auto Cleanup Unreferenced Images
删除文档中的图片引用后，插件会自动：
When you delete an image reference, the extension automatically:
- 扫描隐藏文件夹中不再被引用的图片 / Scans for orphaned images
- 自动删除孤立图片文件 / Deletes unreferenced image files
- 文件夹为空时自动删除文件夹 / Removes empty folders
- 2 秒防抖，避免频繁操作 / 2-second debounce to avoid thrashing

### 🎯 手动清理命令 / Manual Cleanup Command
通过命令面板（`Ctrl+Shift+P`）执行 **"清理未引用的图片"** 或 **"Clean Up Unreferenced Images"**。
Run **"Clean Up Unreferenced Images"** from the command palette (`Ctrl+Shift+P`).

---

## 🚀 快速开始 / Quick Start

### 安装方式 / Installation

#### 方式一：从 VS Code 扩展市场安装（推荐）
#### Option 1: VS Code Marketplace (Recommended)
> 即将上架... / Coming soon...

#### 方式二：手动安装 / Option 2: Manual Install
1. 下载最新的 `.vsix` 文件从 [Releases](https://github.com/LPLNGU/markdown-picture-paste/releases)
   Download the latest `.vsix` from [Releases](https://github.com/LPLNGU/markdown-picture-paste/releases)
2. 在 VS Code 中按 `Ctrl+Shift+P` → `Extensions: Install from VSIX...`
   Press `Ctrl+Shift+P` → `Extensions: Install from VSIX...`

#### 方式三：源码运行 / Option 3: Run from Source
```bash
git clone https://github.com/LPLNGU/markdown-picture-paste.git
cd markdown-picture-paste
npm install
npm run compile
# 在 VS Code 中按 F5 启动调试 / Press F5 in VS Code to debug
```

---

## ⚙️ 配置项 / Configuration

在 VS Code 设置中搜索 `markdown-picture-paste` 即可配置。
Search `markdown-picture-paste` in VS Code settings.

| 配置项 / Setting | 类型 / Type | 默认值 / Default | 说明 / Description |
|--------|------|--------|------|
| `imageFormat` | `string` | `png` | 图片保存格式 / Image format (png/jpg/gif/webp) |
| `imagePrefix` | `string` | `img_` | 图片文件名前缀 / Image file name prefix |
| `enableAutoCleanup` | `boolean` | `true` | 启用自动清理 / Enable auto cleanup |
| `showCleanupNotification` | `boolean` | `true` | 清理时显示通知 / Show cleanup notification |

---

## 🖥️ 支持的系统 / Supported Platforms

| 系统 / Platform | 支持 / Support | 说明 / Notes |
|------|------|------|
| Windows | ✅ | 使用 PowerShell 读取剪贴板 / Uses PowerShell |
| macOS | ✅ | 使用 osascript 读取剪贴板 / Uses osascript |
| Linux | ❌ | 暂不支持 / Not yet supported |

---

## 📂 工作原理 / How It Works

当你编辑 `我的笔记.md` 时 / When you edit `my-note.md`:

```
项目目录 / Project/
├── 我的笔记.md / my-note.md      # 你的 Markdown 文件 / Your Markdown file
├── .我的笔记 / .my-note/         # 自动创建的隐藏文件夹 / Hidden folder
│   ├── img_1712345678.png        # 粘贴的图片 / Pasted image
│   └── img_1712345690.jpg        # 更多图片 / More images
└── 其他文件.md / other-file.md
```

- **粘贴时 / On paste**: 图片自动存入隐藏文件夹，文档中插入引用 / Image saved to hidden folder, reference inserted
- **删除引用时 / On delete**: 插件自动清理孤立图片 / Orphaned images are auto-cleaned

---

## 🛠️ 开发 / Development

```bash
npm install        # 安装依赖 / Install dependencies
npm run compile    # 编译 / Compile
npm run watch      # 监听模式 / Watch mode
npx vsce package   # 打包为 .vsix / Package as .vsix
```

---

## 📄 开源协议 / License

[MIT](LICENSE)

---

## 🤝 贡献 / Contributing

欢迎提交 Issue 和 PR！如果你有好的想法，请先开 Issue 讨论。
Issues and PRs are welcome! If you have an idea, please open an issue first.
