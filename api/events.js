// 日历事件 API
const { connectToDatabase } = require('../lib/mongodb')

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const { db } = await connectToDatabase()
    const collection = db.collection('events')
    const method = req.method

    // GET - 获取事件列表
    if (method === 'GET') {
      const date = req.query.date

      let query = {}
      if (date) {
        query.date = date
      }

      const events = await collection
        .find(query)
        .sort({ date: 1 })
        .toArray()

      res.status(200).json({ success: true, data: events })
      return
    }

    // POST - 添加事件
    if (method === 'POST') {
      const body = req.body
      const userId = req.headers['x-user-id']

      if (!userId) {
        res.status(401).json({ success: false, message: '未提供用户 ID' })
        return
      }

      // 获取用户角色以确定颜色
      const usersDb = db.collection('users')
      const user = await usersDb.findOne({ openid: userId })
      const roleColors = {
        'father': '#4A90D9',
        'mother': '#E74C3C',
        'child': '#2ECC71'
      }
      const color = user ? (roleColors[user.role] || '#999999') : '#999999'

      const event = {
        userId,
        userName: body.userName || '家人',
        title: body.title,
        date: body.date,
        startTime: body.startTime || '',
        endTime: body.endTime || '',
        description: body.description || '',
        color,
        createdAt: new Date()
      }

      const result = await collection.insertOne(event)
      event._id = result.insertedId

      res.status(201).json({
        success: true,
        eventId: event._id,
        data: event,
        message: '添加成功'
      })
      return
    }

    // DELETE - 删除事件
    if (method === 'DELETE') {
      const eventId = req.body.eventId
      const userId = req.headers['x-user-id']

      if (!eventId) {
        res.status(400).json({ success: false, message: '缺少事件 ID' })
        return
      }

      const event = await collection.findOne({ _id: eventId })
      if (!event) {
        res.status(404).json({ success: false, message: '事件不存在' })
        return
      }

      // 权限检查：家人可以删除任何家人的事件
      await collection.deleteOne({ _id: eventId })

      res.status(200).json({
        success: true,
        message: '删除成功'
      })
      return
    }

    res.status(405).json({ success: false, message: '不支持的请求方法' })
  } catch (error) {
    console.error('事件 API 错误:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
