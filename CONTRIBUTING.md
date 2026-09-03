# Contributing · 贡献指南

感谢你的兴趣。项目处于早期阶段，issue 和 PR 都欢迎。

## 开发环境

```bash
pnpm install
pnpm dev
```

提交前请跑：

```bash
pnpm quality   # format:check + lint + typecheck + test + build
```

仓库装有 git hooks（husky）：`pre-commit` 对暂存文件跑 prettier + eslint
（lint-staged），`commit-msg` 校验 commit 规范。CI 会对 push / PR 跑完整
`pnpm quality`。

## 约定

- 结构与架构约定见 `AGENTS.md`，改动前请先读。
- 检测引擎 `src/lib/detect/` 保持纯函数、无 DOM 依赖；面向用户的文案一律输出
  `MsgRef`（i18n key + values），不硬编码任何语言。
- `messages/zh.json` 与 `messages/en.json` 的 key 必须一一对应，改动文案时两个文件同步。
- 新增 / 修改检测规则时，附带上对应的 Vitest 单测和法规条文引用。

## Commit 规范

提交信息遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat: 增加 C2PA 凭证解析
fix: 修复分享报告过期判定
docs: 更新部署说明
```

type 限定为 `feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` /
`build` / `ci` / `chore` / `revert`，描述语言不限（中英文均可）。
`commit-msg` hook 会自动校验，不合规的提交会被拒绝；PR 的每条 commit
也会在 CI 中检查。

## DCO（Developer Certificate of Origin）

本项目采用 DCO 而非 CLA。提交 commit 时请加上 `Signed-off-by` 行：

```bash
git commit -s -m "your message"
```

签名即表示你确认该提交为你的原创（或你有权提交），并同意项目以 Apache-2.0
许可（包括在未来的商业版本中）使用你的贡献。全文见
<https://developercertificate.org/>。

## 报告安全问题

检测引擎误判、法规引用错误请直接开 issue。涉及报告分享 API 的安全问题
（越权访问、注入等）请通过 GitHub Security Advisory 私下报告，不要公开 issue。
