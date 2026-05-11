# Markdown Picture Paste 🖼️

> 在 VS Code 中优雅地管理 Markdown 文档中的图片——粘贴即存，删除即清。

[![VS Code](https://img.shields.io/badge/VS%20Code-1.85%2B-blue)](https://code.visualstudio.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## ✨ 功能特性

### 📸 一键粘贴图片
在 Markdown 文件中按下 `Ctrl+Alt+V`（Mac: `Cmd+Alt+V`），自动完成：
- 从剪贴板读取图片
- 保存到当前文档同名的**隐藏文件夹**（如 `.我的笔记/`）
- 自动插入 Markdown 图片引用 `![image](./.我的笔记/img_xxx.png)`

### 🧹 自动清理未引用图片
删除文档中的图片引用后，插件会自动：
- 扫描隐藏文件夹中不再被引用的图片
- 自动删除孤立图片文件
- 文件夹为空时自动删除文件夹
- 2 秒防抖，避免频繁操作

### 🎯 手动清理命令
通过命令面板（`Ctrl+Shift+P`）执行 **"清理未引用的图片"**，随时手动清理。

---

## 🚀 快速开始

### 安装方式

#### 方式一：从 VS Code 扩展市场安装（推荐）
> 即将上架...

#### 方式二：手动安装
1. 下载最新的 `.vsix` 文件从 [Releases](https://github.com/your-username/markdown-picture-paste/releases)
2. 在 VS Code 中按 `Ctrl+Shift+P` → `Extensions: Install from VSIX...`

#### 方式三：源码运行
```bash
# 克隆仓库
git clone https://github.com/your-username/markdown-picture-paste.git
cd markdown-picture-paste

# 安装依赖
npm install

# 编译
npm run compile

# 在 VS Code 中按 F5 启动调试
```

---

## ⚙️ 配置项

在 VS Code 设置中搜索 `markdown-picture-paste` 即可配置：

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `imageFormat` | `string` | `png` | 图片保存格式（png/jpg/gif/webp） |
| `imagePrefix` | `string` | `img_` | 图片文件名前缀 |
| `enableAutoCleanup` | `boolean` | `true` | 启用自动清理未引用图片 |
| `showCleanupNotification` | `boolean` | `true` | 清理图片时显示通知 |

---

## 🖥️ 支持的系统

| 系统 | 支持 | 说明 |
|------|------|------|
| Windows | ✅ | 使用 PowerShell 读取剪贴板 |
| macOS | ✅ | 使用 osascript 读取剪贴板 |
| Linux | ❌ | 暂不支持 |

---

## 📂 工作原理

当你编辑 `我的笔记.md` 时：

```
项目目录/
├── 我的笔记.md              # 你的 Markdown 文件
├── .我的笔记/               # 自动创建的隐藏文件夹
│   ├── img_1712345678.png   # 粘贴的图片
│   └── img_1712345690.jpg   # 更多图片
└── 其他文件.md
```

- **粘贴时**：图片自动存入 `.我的笔记/`，文档中插入 `![image](./.我的笔记/img_xxx.png)`
- **删除引用时**：插件自动检查 `.我的笔记/` 中哪些图片不再被引用，清理掉

---

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听模式
npm run watch

# 打包为 .vsix
npx vsce package
```

---

## 📄 开源协议

[MIT](LICENSE)

---

## 🤝 贡献

欢迎提交 Issue 和 PR！如果你有好的想法，请先开 Issue 讨论。
