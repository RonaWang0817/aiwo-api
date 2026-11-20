// 相册 API
const { ObjectId } = require('mongodb')
const { connectToDatabase } = require('../lib/mongodb')

// 辅助函数：将字符串 ID 转换为 ObjectId
function toObjectId(id) {
  if (!id) return id
  try {
    return new ObjectId(id)
  } catch (e) {
    return id
  }
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const { db } = await connectToDatabase()
    const collection = db.collection('albums')
    const method = req.method

    // GET - 获取相册列表或单个相册
    if (method === 'GET') {
      const albumId = req.query.id

      if (albumId) {
        const album = await collection.findOne({ _id: toObjectId(albumId) })
        if (!album) {
          res.status(404).json({ success: false, message: '相册不存在' })
          return
        }
        res.status(200).json({ success: true, data: album })
        return
      }

      const albums = await collection
        .find({})
        .sort({ createdAt: -1 })
        .toArray()

      res.status(200).json({ success: true, data: albums })
      return
    }

    // POST - 创建相册或添加照片
    if (method === 'POST') {
      const body = req.body
      const action = body.action
      const userId = req.headers['x-user-id']

      // 创建相册
      if (action === 'create') {
        const album = {
          name: body.name,
          description: body.description || '',
          coverImage: body.coverImage || '',
          photos: [],
          createdBy: userId,
          createdByName: body.createdByName || '家人',
          createdAt: new Date(),
          updatedAt: new Date()
        }

        const result = await collection.insertOne(album)
        album._id = result.insertedId

        res.status(201).json({
          success: true,
          albumId: album._id,
          data: album,
          message: '创建成功'
        })
        return
      }

      // 添加照片到相册
      if (action === 'addPhoto') {
        const albumId = body.albumId
        const photo = {
          url: body.photo.url,
          type: body.photo.type || 'image',
          thumb: body.photo.thumb || '',
          duration: body.photo.duration || 0,
          description: body.photo.description || '',
          uploadedBy: userId,
          uploadedByName: body.photo.uploadedByName || '家人',
          createdAt: new Date()
        }

        const album = await collection.findOne({ _id: toObjectId(albumId) })
        if (!album) {
          res.status(404).json({ success: false, message: '相册不存在' })
          return
        }

        const photos = album.photos || []
        photos.push(photo)

        const updateData = { photos, updatedAt: new Date() }
        if (photos.length === 1) {
          updateData.coverImage = photo.url
        }

        await collection.updateOne(
          { _id: toObjectId(albumId) },
          { $set: updateData }
        )

        res.status(200).json({
          success: true,
          data: photo,
          message: '添加成功'
        })
        return
      }

      res.status(400).json({ success: false, message: '未知操作' })
      return
    }

    // PUT - 重命名相册或删除照片
    if (method === 'PUT') {
      const body = req.body
      const albumId = body.albumId
      const action = body.action

      // 重命名相册
      if (action === 'rename') {
        await collection.updateOne(
          { _id: toObjectId(albumId) },
          { $set: { name: body.name, updatedAt: new Date() } }
        )

        res.status(200).json({
          success: true,
          message: '重命名成功'
        })
        return
      }

      // 删除照片
      if (action === 'deletePhoto') {
        const photoIndex = body.photoIndex
        const album = await collection.findOne({ _id: toObjectId(albumId) })

        if (!album) {
          res.status(404).json({ success: false, message: '相册不存在' })
          return
        }

        const photos = album.photos || []
        photos.splice(photoIndex, 1)

        const updateData = { photos, updatedAt: new Date() }
        if (photos.length === 0) {
          updateData.coverImage = ''
        } else if (album.coverImage === album.photos[photoIndex]?.url) {
          updateData.coverImage = photos[0].url
        }

        await collection.updateOne(
          { _id: toObjectId(albumId) },
          { $set: updateData }
        )

        res.status(200).json({
          success: true,
          message: '删除成功'
        })
        return
      }

      res.status(400).json({ success: false, message: '未知操作' })
      return
    }

    // DELETE - 删除相册
    if (method === 'DELETE') {
      const albumId = req.query.id || req.body?.albumId

      if (!albumId) {
        res.status(400).json({ success: false, message: '缺少相册 ID' })
        return
      }

      await collection.deleteOne({ _id: toObjectId(albumId) })

      res.status(200).json({
        success: true,
        message: '删除成功'
      })
      return
    }

    res.status(405).json({ success: false, message: '不支持的请求方法' })
  } catch (error) {
    console.error('相册 API 错误:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
