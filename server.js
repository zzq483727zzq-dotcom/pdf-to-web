const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- 确保存储目录存在 ----------
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ---------- multer 接收 base64 JSON ----------
const upload = multer({ storage: multer.memoryStorage() });

// ---------- 静态文件 ----------
app.use(express.static(path.join(__dirname, 'public')));
// 上传的图片可通过 /uploads/<id>/page-0.jpg 访问
app.use('/uploads', express.static(UPLOAD_DIR));

// ---------- API: 上传图片 ----------
// 接收: { images: ["data:image/jpeg;base64,...", ...], title: "文档名" }
// base64 可能很大，增加 body 大小限制
app.post('/api/upload', express.json({ limit: '500mb' }), async (req, res) => {
  try {
    const { images, title } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: '缺少图片数据' });
    }

    const id = uuidv4().slice(0, 8);
    const dir = path.join(UPLOAD_DIR, id);
    fs.mkdirSync(dir, { recursive: true });

    const urls = [];
    for (let i = 0; i < images.length; i++) {
      // data:image/jpeg;base64,/9j/4AAQ... → 解码 → 保存
      const matches = images[i].match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) {
        // 尝试当作纯 base64 解码
        const buf = Buffer.from(images[i], 'base64');
        const filename = `page-${i}.jpg`;
        fs.writeFileSync(path.join(dir, filename), buf);
        urls.push(`/uploads/${id}/${filename}`);
        continue;
      }
      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const data = matches[2];
      const buf = Buffer.from(data, 'base64');
      const filename = `page-${i}.${ext}`;
      fs.writeFileSync(path.join(dir, filename), buf);
      urls.push(`/uploads/${id}/${filename}`);
    }

    // 保存元信息
    const meta = { id, title: title || '未命名文档', totalPages: urls.length, createdAt: new Date().toISOString() };
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));

    res.json({
      id,
      viewUrl: `/viewer.html?id=${id}`,
      title: meta.title,
      totalPages: urls.length
    });
  } catch (err) {
    console.error('上传失败:', err);
    res.status(500).json({ error: '上传失败: ' + err.message });
  }
});

// ---------- API: 获取查看数据 ----------
app.get('/api/view/:id', (req, res) => {
  const { id } = req.params;
  const dir = path.join(UPLOAD_DIR, id);

  if (!fs.existsSync(dir)) {
    return res.status(404).json({ error: '未找到该文档' });
  }

  const metaPath = path.join(dir, 'meta.json');
  if (!fs.existsSync(metaPath)) {
    return res.status(404).json({ error: '文档信息缺失' });
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

  // 生成图片 URL 列表
  const images = [];
  for (let i = 0; i < meta.totalPages; i++) {
    // 尝试常见扩展名
    const exts = ['jpg', 'jpeg', 'png', 'webp'];
    for (const ext of exts) {
      const p = path.join(dir, `page-${i}.${ext}`);
      if (fs.existsSync(p)) {
        images.push(`/uploads/${id}/page-${i}.${ext}`);
        break;
      }
    }
  }

  res.json({ ...meta, images });
});

// ---------- 启动 ----------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PDF 转网页工具已启动: http://localhost:${PORT}`);
  console.log(`   上传页面: http://localhost:${PORT}`);
});