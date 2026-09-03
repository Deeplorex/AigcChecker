<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AigcChecker · 内容标检 LabelCheck

AI 内容标识合规检测工具（第 1 层：免费检测器）。产品设计见 `docs/product.md`，架构决策见 `.project/standard-project.json`。

## 开源

仓库开源（Apache-2.0，`LICENSE`），remote 为 `github.com/Deeplorex/AigcChecker`。LabelCheck / 内容标检 / Deeplorex / 玄龄智能 为商标，不在授权范围内；`messages/*.json` 的 `footer.company` 与 ICP 备案号保留（备案号按域名门控展示，见 `src/components/IcpRecord.tsx`）。贡献走 DCO（`git commit -s`），见 `CONTRIBUTING.md`。

## 命令

```bash
pnpm dev        # 本地开发
pnpm build      # 生产构建
pnpm test       # Vitest 单测
pnpm typecheck  # tsc --noEmit
pnpm lint       # ESLint
pnpm quality    # format:check + lint + typecheck + test + build（改动收尾时跑）
```

## 结构与约定

- `src/lib/detect/`：检测引擎，纯函数、无 DOM 依赖（`watermark.ts` 除外，仅客户端）。面向用户的文案一律输出 `MsgRef`（i18n key + values），不硬编码任何语言。判定按三地法域（CN《标识办法》/ EU AI Act / US 加州 SB 942）逐项输出：每个 `VerdictCheck` 带 `jurisdictions` 与 `requirement`（条文引用），`verdict.byJurisdiction` 给各法域独立级别；总体级别仍由中国判定驱动。旧分享报告无 `byJurisdiction`，`ReportView` 走扁平渲染兼容路径（旧 `checks.C2PA/IMPLICIT/EXPLICIT` 文案 key 因此保留）。`watermark.ts` 负责显式水印：图片直接扫描、视频抽帧（10%/50%/90% 时长）扫描，命中即判存在（归属方识别待后续迭代）。
- `messages/zh.json` / `messages/en.json`：全部 UI 与判定文案，两语言 key 必须一一对应。
- `src/app/[locale]/`：zh 无 URL 前缀，en 用 `/en` 前缀（`localePrefix: "as-needed"`）。中间件按浏览器 `Accept-Language` 自动选择语言（`localeDetection`），英文访客访问 `/` 会被 307 到 `/en`；手动切换后以 `NEXT_LOCALE` cookie 为准。
- `src/app/api/reports/`：报告分享 API；`db/migrations/` 为手写 SQL 迁移。
- 设计 token 定义在 `src/app/globals.css` 的 `@theme`，不要引入第二套色值。
- Next 16 的中间件约定是根级 `src/proxy.ts`（原 middleware）。

## 工作方式（routine fast path）

最小连贯改动；改完看最终 diff；只跑与改动相关的最窄测试；如实质改动了上述约定或架构决策，同步更新本文件与 `.project/standard-project.json`。

## 质量门禁

- git hooks（husky）：`pre-commit` 跑 lint-staged（prettier + eslint 处理暂存文件），`commit-msg` 跑 commitlint（Conventional Commits，描述语言不限）。
- CI（`.github/workflows/ci.yml`）：push 到 main 与 PR 跑 `pnpm quality`；PR 额外逐条 commitlint。
- 手写 commit 一律 `git commit -s`（DCO）且遵循 Conventional Commits。

## 环境变量

- `DATABASE_URL`：Neon Postgres 连接串，放 `.env.local`（不提交）。未配置时分享 API 返回 503，检测功能不受影响。
- `NEXT_PUBLIC_VIBELOFT_AUTH_KEY`：VibeLoft Web Telemetry 的 web auth key，输出到浏览器端（`src/app/[locale]/layout.tsx` 的 telemetry script）。本地放 `.env.local`，生产在 Vercel 环境变量中配置。
