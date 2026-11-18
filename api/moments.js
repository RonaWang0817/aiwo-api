// 动态 API
const { connectToDatabase } = require('../lib/mongodb')

module.exports = async (req, res) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const { db } = await connectToDatabase()
    const collection = db.collection('moments')
    const method = req.method

    // GET - 获取动态列表
    if (method === 'GET') {
      const moments = await collection
        .find({})
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray()

      res.status(200).json({
        success: true,
        data: moments
      })
      return
    }

    // POST - 发布动态
    if (method === 'POST') {
      const body = req.body
      const userId = req.headers['x-user-id']

      if (!userId) {
        res.status(401).json({ success: false, message: '未提供用户 ID' })
        return
      }

      const moment = {
        userId,
        userName: body.userName || '家人',
        userAvatar: body.userAvatar || '',
        content: body.content || '',
        images: body.images || [],
        video: body.video || null,
        tags: body.tags || [],
        likes: [],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await collection.insertOne(moment)
      moment._id = result.insertedId

      res.status(201).json({
        success: true,
        data: moment,
        message: '发布成功'
      })
      return
    }

    // PUT - 更新动态（点赞、评论）
    if (method === 'PUT') {
      const body = req.body
      const momentId = body.momentId
      const action = body.action

      if (!momentId) {
        res.status(400).json({ success: false, message: '缺少动态 ID' })
        return
      }

      const moment = await collection.findOne({ _id: momentId })
      if (!moment) {
        res.status(404).json({ success: false, message: '动态不存在' })
        return
      }

      // 点赞/取消点赞
      if (action === 'like') {
        const userId = req.headers['x-user-id']
        const likes = moment.likes || []
        const index = likes.indexOf(userId)

        if (index > -1) {
          likes.splice(index, 1)
        } else {
          likes.push(userId)
        }

        await collection.updateOne(
          { _id: momentId },
          { $set: { likes } }
        )

        res.status(200).json({
          success: true,
          liked: index === -1,
          likes
        })
        return
      }

      // 添加评论
      if (action === 'comment') {
        const userId = req.headers['x-user-id']
        const comment = {
          userId,
          userName: body.comment.userName || '家人',
          userAvatar: body.comment.userAvatar || '',
          content: body.comment.content,
          createdAt: new Date()
        }

        const comments = moment.comments || []
        comments.push(comment)

        await collection.updateOne(
          { _id: momentId },
          { $set: { comments } }
        )

        res.status(200).json({
          success: true,
          data: comment,
          message: '评论成功'
        })
        return
      }

      res.status(400).json({ success: false, message: '未知操作' })
      return
    }

    // DELETE - 删除动态
    if (method === 'DELETE') {
      const momentId = req.body.momentId
      const userId = req.headers['x-user-id']

      if (!momentId) {
        res.status(400).json({ success: false, message: '缺少动态 ID' })
        return
      }

      const moment = await collection.findOne({ _id: momentId })
      if (!moment) {
        res.status(404).json({ success: false, message: '动态不存在' })
        return
      }

      // 权限检查：家人可以删除任何家人的动态
      await collection.deleteOne({ _id: momentId })

      res.status(200).json({
        success: true,
        message: '删除成功'
      })
      return
    }

    res.status(405).json({ success: false, message: '不支持的请求方法' })
  } catch (error) {
    console.error('动态 API 错误:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
