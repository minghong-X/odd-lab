# Odd Lab · 趣味模型实验室

[在线体验](https://odd-lab-bay.vercel.app) · [GitHub](https://github.com/minghong-X/odd-lab)

同一句提示词，不同模型会交出怎样的作品？浏览动态照片墙，参与左右盲测，用投票选出你喜欢的模型作品，无需登录。

- **三个实验**：鹈鹕骑自行车、鳄鱼骑摩托车、复刻淘宝首页（PC）。
- **作品展示**：动态 SVG、HTML 页面及放大预览。
- **盲测与排行**：左胜、右胜、平局或都不好，投票后揭晓模型。每个模型最多生成三次，选择最好的一次参赛。
- **中英双语**，适配桌面和手机。

技术栈：Next.js · React · TypeScript · PostgreSQL · Vercel。

## 本地运行

需要 Node.js 22+。

```sh
npm ci
npm run dev
```

打开 [localhost:3000](http://localhost:3000)。开发环境默认使用本地 PGlite，无需单独安装数据库。

## 部署到 Vercel

1. Fork 仓库并导入 Vercel，选择 Next.js 和 Node.js 22+。
2. 创建自己的 PostgreSQL，配置 `DATABASE_URL` 和 `APP_ORIGIN`（站点域名，含协议、不含路径或末尾 `/`）。
3. 在本地将数据库连接串填入 `.env.local`，对目标数据库执行一次迁移：

   ```sh
   node --env-file=.env.local --import tsx scripts/migrate.ts
   ```

4. 使用 `npm run build` 构建并部署。生产环境必须使用 PostgreSQL，构建不会自动迁移数据库。

## 更新作品

作品清单位于 `data/artwork-manifest.json`，每项包含 `experimentKey`、`modelName`、`url`、`mediaType`。同步工具支持 SVG 和 HTML；清单应保留三个实验的完整作品。

```sh
npm run sync:artworks -- data/artwork-manifest.json
npm test
npm run build
```

更新后重新部署即可。

## License

MIT
