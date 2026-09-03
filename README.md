<p align="center">
  <img src="public/logo.svg" alt="LabelCheck logo" width="72" height="72" />
</p>

# LabelCheck · 内容标检

[English](#english) | 中文

开源的 AI 内容标识合规检测工具。**纯浏览器本地运行，文件不上传任何服务器。**

上传图片 / 视频 / 文本，逐项告诉你：以当前状态发布，你的 AI 标识是否符合
中国《人工智能生成合成内容标识办法》、欧盟 AI Act、美国加州 SB 942 的要求。

## 功能

- **三法域逐项判定**：每项检测都给出 CN / EU / US 三个法域的独立结论和法规条文引用
- **标识状态解析**：检测当前内容携带哪些标识（可见水印 / 隐式元数据 / C2PA 凭证）、缺哪些
- **隐私优先**：检测引擎是纯函数，全部在浏览器里运行，零上传
- **可分享报告**：一键生成检测报告链接，发给客户、老板或平台审核
- **中英双语**：zh 默认，en 走 `/en` 路径

## 本地运行

```bash
pnpm install
pnpm dev
```

常用命令：`pnpm test`（单测）· `pnpm typecheck` · `pnpm lint` · `pnpm quality`（完整检查）

报告分享功能需要 `DATABASE_URL`（Neon Postgres，放 `.env.local`）。未配置时分享 API 返回 503，
检测功能不受影响。数据库迁移 SQL 在 `db/migrations/`。

## 部署

### 方式一：Vercel（推荐，含 Hobby 免费套餐）

1. 在 Vercel 导入本仓库，框架自动识别为 Next.js，无需额外配置
2. 环境变量添加 `DATABASE_URL`（Neon Postgres 连接串）
3. 在 Neon 控制台执行 `db/migrations/0001_reports.sql` 建表

不配置 `DATABASE_URL` 也能部署：检测功能完全正常，仅报告分享 API 返回 503。
注意 Hobby 套餐有条款与配额限制，触及前需升级 Pro。

### 方式二：自有服务器

任何能跑 Node.js 24+ 的环境均可：

```bash
pnpm install
pnpm build
pnpm start        # 默认监听 3000 端口
```

- 数据库：任意 Postgres，设置 `DATABASE_URL` 后执行 `db/migrations/0001_reports.sql`
- 生产建议挂在 Nginx / Caddy 反向代理之后，用 systemd 或 PM2 守护进程
- 自部署请将 `messages/zh.json` / `messages/en.json` 中 `footer.company`
  替换为你自己的主体名称；ICP 备案号仅在 `.cn` 及官方域名下展示，自部署不受影响

## 架构

- `src/lib/detect/` — 检测引擎，纯函数、无 DOM 依赖，可独立复用到自己的管线
- `messages/` — 全部 UI 与判定文案（zh / en key 一一对应）
- `src/app/api/reports/` — 报告分享 API
- `AGENTS.md` — 更详细的结构与约定说明

## 路线图

- [x] 免费检测器（三法域判定 + 可分享报告）
- [ ] 标识嵌入工具（显式角标 / 隐式元数据 / C2PA 签名）
- [ ] 管线巡检（标识在加工链路的存活检测）
- [ ] 合规证明报告

## 贡献

欢迎 issue 和 PR，见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## License

代码以 [Apache-2.0](LICENSE) 开源。**LabelCheck / 内容标检 / Deeplorex / 玄龄智能**
的名称与标识为商标，不在开源授权范围内（自部署请替换品牌信息）。

---

## English

Open-source compliance checker for AI content labeling laws.
**Runs 100% in your browser — files never leave your device.**

Upload an image, video, or text and get a per-requirement verdict for
China's AI Labeling Measures, the EU AI Act, and California's SB 942 —
each check cites the specific legal clause it tests against.

It detects visible watermarks, implicit metadata, and C2PA Content Credentials,
tells you exactly which labels your content carries and which are missing,
and generates shareable report links. `src/lib/detect/` is a pure,
framework-free engine you can embed in your own pipeline.

Built with Next.js 16, TypeScript, Tailwind CSS 4, and Vitest.
Bilingual UI (zh default, en at `/en`). Apache-2.0 licensed; the
LabelCheck / Deeplorex names and logos are trademarks and not covered
by the license.

**Deploy:** one-click on Vercel (Hobby plan works), or self-host anywhere
with Node.js 24+: `pnpm install && pnpm build && pnpm start`. Set
`DATABASE_URL` (any Postgres) and apply `db/migrations/0001_reports.sql`
for shareable reports — without it, detection still works and only the
share API returns 503. See the Chinese section above for details.
