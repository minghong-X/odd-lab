# Odd Lab · 趣味模型实验室

[在线体验](https://odd-lab-bay.vercel.app) · [GitHub](https://github.com/minghong-X/odd-lab)

同一句提示词，不同模型会交出怎样的作品？Odd Lab 是一个无需登录的作品展览和左右盲测网站，使用 Next.js、React、TypeScript 与 PostgreSQL，支持部署到 Vercel。

## 实验与体验

当前素材快照（2026-09-15）共有 83 份作品：

| 实验               | 素材          |
| ------------------ | ------------- |
| 鹈鹕骑自行车       | 33 份动态 SVG |
| 鳄鱼骑摩托车       | 26 份动态 SVG |
| 复刻淘宝首页（PC） | 24 份 HTML    |

- 首页随机混排三个实验的 30 份作品，从不同方向飞入并定格为照片墙；SVG 动画继续播放，HTML 在隔离的 iframe 内渲染。
- 首页只保留第一屏，实验选择器可以进入任意实验的盲测；实验画廊和排行榜提供页面内放大预览。
- 左胜、右胜、平局、都不好，投票后揭晓模型。每个模型最多生成三次，选择效果最好的一次参赛。
- HTML 对比卡片及放大窗口采用桌面布局缩放，可在放大窗口滚动查看完整页面。
- 支持中文 / English、手机布局和减少动态效果。导航中的 GitHub 图标链接到本仓库。

公网投票通过 Next.js 同源接口写入 PostgreSQL，采用 Elo 排序，界面不展示 Elo 数值。对局凭证、有效期、事务和共享请求限流用于避免重复计票；没有登录或个人账户。

## 本地运行

需要 Node.js 22+。

```sh
npm ci
npm run dev
```

默认访问 `http://localhost:3000`。仅开发环境在未配置数据库时使用 `.local-db/` 下的 PGlite，兼容 PostgreSQL。生产环境必须配置 `DATABASE_URL`。

可复制 `.env.example` 为 `.env.local` 并填入自己的 PostgreSQL 连接串。迁移 CLI 使用 shell 环境变量，不自动读取 Next.js 环境文件：

```sh
node --env-file=.env.local --import tsx scripts/migrate.ts
npm run dev
```

## Vercel 部署

1. 将仓库导入 Vercel，框架选择 Next.js，使用 Node.js 22+。
2. 配置自己的 PostgreSQL `DATABASE_URL`，函数与数据库尽量同地区。
3. 对目标数据库执行上述迁移命令。构建不会自动迁移或改写生产数据。
4. 设置 `APP_ORIGIN` 为站点 origin，不带末尾 `/`。Preview 使用独立数据库和对应 origin，或留空使用当前请求 origin。
5. 构建命令为 `npm run build`。

Fork 时请创建自己的数据库。生产环境没有文件数据库回退，避免 Serverless 临时磁盘导致投票丢失。自托管支持 `npm run build:standalone`；反向代理需设置可信客户端 IP 头，参见 `.env.example`。

## 素材与同步

SVG 原文件、静态 WebP 预览和 HTML 原文件随仓库保存。公网盲测从本地文件加载；HTML 画廊、照片墙和榜单使用清单中的 OSS 地址，作品引用的外部资源仍可能需要网络。

`data/catalog.json` 是作品目录，`data/artwork-manifest.json` 保存实验、模型、来源 URL、文件类型及 SHA-256。SVG 通过图片元素显示，HTML 脚本只能在不含 `allow-same-origin` 的 iframe 沙箱中运行。

刷新现有素材：

```sh
npm run sync:artworks -- data/artwork-manifest.json
npm test
npm run build
```

也可以传入包含三个实验完整数据的 JSON 数组，每项包含 `experimentKey`、`modelName`、`url`、`mediaType`。同步命令当前支持 SVG 和 HTML：验证来源、下载原文件、生成 SVG 静态预览，全部成功后更新清单。相同作品保留 ID，内容替换后生成新 ID，防止混用旧评分。完整清单按传入数据替换，更新后需重新发布。

旧版 SVG 来源格式仍可使用 `npm run import:materials -- /path/to/source.json` 导入。

## 验证

```sh
npm test
npm run build
npm run typecheck
npx playwright install chromium
npm run test:e2e
```

浏览器测试使用端口 3101、`.next-test/` 与 `.test-db/`，覆盖两种语言、桌面/手机、照片墙、SVG 动画、HTML 盲测、放大、投票和排行榜。已有 Chrome 时可用 `PLAYWRIGHT_BROWSER_PATH` 指定浏览器路径。

## 文案配置

`src/i18n/locales/{zh,en}/` 按 common、story、experiments、arena、rank、errors 拆分。新增文案应同时添加两种语言的对应键；作品本身的文字与模型名保持原样。语言切换保留当前盲测、已揭晓结果和本次投票数。
