# 爱窝时光 API - 后端服务

> 家庭共享小程序的后端 API，提供数据读写和文件上传功能

## 项目结构

```
aiwo-api/
├── api/                     # API 接口
│   ├── moments.js           # 动态接口
│   ├── albums.js            # 相册接口
│   ├── messages.js          # 留言接口
│   ├── reminders.js         # 提醒接口
│   ├── events.js            # 日历接口
│   └── upload.js            # 文件上传接口
├── lib/
│   ├── mongodb.js           # MongoDB 数据库连接
│   └── cloudinary.js        # Cloudinary 云存储连接
├── vercel.json              # Vercel 部署配置
├── package.json             # 依赖配置
└── README.md                # 本文档
```

## 快速开始

### 1. 注册服务账号

1. **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas/register
   - 创建免费集群 (M0 FREE)
   - 获取连接字符串

2. **Cloudinary**: https://cloudinary.com/users/register/free
   - 获取 Cloud Name、API Key、API Secret

3. **Vercel**: https://vercel.com/signup
   - 用 GitHub 账号登录

### 2. 部署到 Vercel

1. 将代码上传到 GitHub 仓库
2. 在 Vercel 导入该仓库
3. 配置环境变量：
   ```
   MONGODB_URI = mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aiwo
   CLOUDINARY_CLOUD_NAME = xxxxx
   CLOUDINARY_API_KEY = 123456789012345
   CLOUDINARY_API_SECRET = abcdefghijklmnopqrstuvwxyz
   ```
4. 点击 Deploy

### 3. 测试 API

部署完成后，访问：
```
https://你的项目名.vercel.app/api/moments
```

应该返回：
```json
{
  "success": true,
  "data": []
}
```

## API 文档

### 动态 (Moments)

**获取动态列表**
```http
GET /api/moments
```

**发布动态**
```http
POST /api/moments
Headers: x-user-id: 用户 ID
Body: {
  "content": "动态内容",
  "images": ["图片 URL"],
  "video": { "url": "视频 URL", "thumb": "缩略图", "duration": 15 },
  "tags": ["标签"],
  "userName": "用户昵称"
}
```

**点赞/评论**
```http
PUT /api/moments
Body: {
  "momentId": "动态 ID",
  "action": "like" 或 "comment",
  "comment": { "content": "评论内容" }
}
```

**删除动态**
```http
DELETE /api/moments
Body: { "momentId": "动态 ID" }
```

### 相册 (Albums)

**获取相册列表**
```http
GET /api/albums
```

**创建相册**
```http
POST /api/albums
Body: {
  "action": "create",
  "name": "相册名称",
  "description": "相册描述"
}
```

**添加照片**
```http
POST /api/albums
Body: {
  "action": "addPhoto",
  "albumId": "相册 ID",
  "photo": {
    "url": "照片 URL",
    "type": "image" 或 "video",
    "thumb": "缩略图 URL",
    "duration": 15
  }
}
```

### 留言 (Messages)

**获取留言列表**
```http
GET /api/messages
```

**发布留言**
```http
POST /api/messages
Body: {
  "content": "留言内容",
  "type": "关心" 或 "感谢" 或 "建议" 或 "提醒",
  "toUser": "接收人 ID (可选)",
  "isAnonymous": false
}
```

### 提醒 (Reminders)

**获取提醒列表**
```http
GET /api/reminders
```

**添加提醒**
```http
POST /api/reminders
Body: {
  "title": "提醒标题",
  "type": "birthday" 或 "anniversary" 或 "festival" 或 "custom",
  "date": "2026-12-25",
  "calendarType": "solar" 或 "lunar"
}
```

### 日历事件 (Events)

**获取事件列表**
```http
GET /api/events?date=2026-11-18
```

**添加事件**
```http
POST /api/events
Body: {
  "title": "事件标题",
  "date": "2026-11-18",
  "startTime": "14:00",
  "endTime": "15:00",
  "description": "事件描述"
}
```

### 文件上传 (Upload)

**上传文件**
```http
POST /api/upload
Content-Type: multipart/form-data
Body: file (二进制文件)
```

响应：
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/...",
  "publicId": "aiwo/xxx",
  "width": 800,
  "height": 600,
  "format": "jpg"
}
```

## 权限说明

所有 API 都实现了家人权限控制：
- **读权限**：所有家人可以读取所有家人的数据
- **写权限**：所有家人可以创建、编辑、删除所有家人的数据
- **身份验证**：通过 `x-user-id` 请求头验证用户身份

## 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| MONGODB_URI | MongoDB 连接字符串 | ✅ |
| CLOUDINARY_CLOUD_NAME | Cloudinary 云名称 | ✅ |
| CLOUDINARY_API_KEY | Cloudinary API 密钥 | ✅ |
| CLOUDINARY_API_SECRET | Cloudinary API 密钥 | ✅ |

## 费用

所有服务均在免费额度内：
- **Vercel**: 100GB 流量/月
- **MongoDB Atlas**: 512MB 存储
- **Cloudinary**: 25GB 存储 + 25GB 流量/月

对于一家三口使用，完全免费。
