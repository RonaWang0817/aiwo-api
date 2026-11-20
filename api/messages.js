// 留言 API
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
    const collection = db.collection('messages')
    const method = req.method

    // GET - 获取留言列表
    if (method === 'GET') {
      const messages = await collection
        .find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray()

      res.status(200).json({ success: true, data: messages })
      return
    }

    // POST - 发布留言
    if (method === 'POST') {
      const body = req.body
      const userId = req.headers['x-user-id']

      if (!userId) {
        res.status(401).json({ success: false, message: '未提供用户 ID' })
        return
      }

      const message = {
        fromUser: userId,
        fromUserName: body.fromUserName || '家人',
        fromUserAvatar: body.fromUserAvatar || '',
        toUser: body.toUser || null,
        toUserName: body.toUserName || '',
        content: body.content,
        type: body.type || '关心',
        isAnonymous: body.isAnonymous || false,
        createdAt: new Date()
      }

      const result = await collection.insertOne(message)
      message._id = result.insertedId

      res.status(201).json({
        success: true,
        data: message,
        message: '留言成功'
      })
      return
    }

    // DELETE - 删除留言
    if (method === 'DELETE') {
      const messageId = req.query.id || req.body?.messageId

      if (!messageId) {
        res.status(400).json({ success: false, message: '缺少留言 ID' })
        return
      }

      const message = await collection.findOne({ _id: toObjectId(messageId) })
      if (!message) {
        res.status(404).json({ success: false, message: '留言不存在' })
        return
      }

      await collection.deleteOne({ _id: toObjectId(messageId) })

      res.status(200).json({
        success: true,
        message: '删除成功'
      })
      return
    }

    res.status(405).json({ success: false, message: '不支持的请求方法' })
  } catch (error) {
    console.error('留言 API 错误:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
