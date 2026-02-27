# FerrumNote 中文说明

English README: [README.md](./README.md)

本页是中文入口，完整文档以英文 README 为主。

## 快速入口

- 项目主页说明： [README.md](./README.md)
- 架构文档： [docs/architecture.md](./docs/architecture.md)
- MVP 范围： [docs/mvp-scope.md](./docs/mvp-scope.md)
- 发布指南： [docs/release-guide.md](./docs/release-guide.md)
- WSL 排障： [docs/wsl-troubleshooting.md](./docs/wsl-troubleshooting.md)

## 当前阶段重点

- 左侧工作区资源管理器 + 右侧 Markdown 编辑区 + 底部状态栏
- 工作区通过 `Open Folder` 设置并持久化到 `~/.ferrumnote/config.toml`
- 编辑器采用 CodeMirror-first，Markdown 字符串是唯一真源
- 头部使用单个 `Source` 开关切源码模式，快捷键 `Ctrl/Cmd+Shift+M`
- Writer 模式支持 Typora 风格符号显隐：光标进入语法范围时显示并可直编符号
- 浏览器模式显式降级，禁用桌面文件能力
