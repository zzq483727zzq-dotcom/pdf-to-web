# PDF 转网页工具

上传 PDF，自动生成可分享的翻页网页链接。

## 快速开始

```bash
npm install
npm start
```

浏览器打开 `http://localhost:3000` 即可使用。

## 工作流程

1. 拖拽或点击上传 PDF
2. 浏览器自动将每页渲染为图片
3. 图片上传到服务器存储
4. 生成一个可分享的链接 → 发给别人，打开就是翻页查看器

## 部署到 Vercel（免费）

1. 安装 [Vercel CLI](https://vercel.com/docs/cli)：
   ```bash
   npm i -g vercel
   ```

2. 在项目目录执行：
   ```bash
   vercel --prod
   ```

3. 部署后，上传的图片默认存储在服务器的本地文件系统。
   **注意**：Vercel 的 serverless 环境不支持本地文件写入。
   如需在 Vercel 上持久化存储，请将 `server.js` 中的文件存储替换为 [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) 或兼容 S3 的云存储服务。

## 技术栈

- **前端**: 原生 HTML/CSS/JS + pdf.js (CDN)
- **后端**: Node.js + Express
- **存储**: 本地文件系统（开发）/ Vercel Blob 等云存储（生产）

## 项目结构

```
├── server.js          # Express 服务器
├── package.json
├── public/
│   ├── index.html     # 上传页面
│   └── viewer.html    # 翻页查看器
└── uploads/           # 上传的图片存储目录
    └── {id}/
        ├── meta.json
        ├── page-0.jpg
        ├── page-1.jpg
        └── ...
```