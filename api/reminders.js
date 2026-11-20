// 提醒 API
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
    const collection = db.collection('reminders')
    const method = req.method

    // GET - 获取提醒列表
    if (method === 'GET') {
      const reminders = await collection
        .find({})
        .sort({ createdAt: -1 })
        .toArray()

      res.status(200).json({ success: true, data: reminders })
      return
    }

    // POST - 添加提醒
    if (method === 'POST') {
      const body = req.body
      const userId = req.headers['x-user-id']

      if (!userId) {
        res.status(401).json({ success: false, message: '未提供用户 ID' })
        return
      }

      const reminder = {
        title: body.title,
        type: body.type,
        date: body.date,
        calendarType: body.calendarType || 'solar',
        person: body.person || '',
        remindDays: body.remindDays || [1, 7],
        description: body.description || '',
        createdBy: userId,
        createdByName: body.createdByName || '家人',
        createdAt: new Date()
      }

      const result = await collection.insertOne(reminder)
      reminder._id = result.insertedId

      res.status(201).json({
        success: true,
        reminderId: reminder._id,
        data: reminder,
        message: '添加成功'
      })
      return
    }

    // PUT - 更新提醒
    if (method === 'PUT') {
      const body = req.body
      const reminderId = body.reminderId

      if (!reminderId) {
        res.status(400).json({ success: false, message: '缺少提醒 ID' })
        return
      }

      const updateData = { ...body }
      delete updateData.reminderId
      updateData.updatedAt = new Date()

      await collection.updateOne(
        { _id: toObjectId(reminderId) },
        { $set: updateData }
      )

      res.status(200).json({
        success: true,
        message: '更新成功'
      })
      return
    }

    // DELETE - 删除提醒
    if (method === 'DELETE') {
      const reminderId = req.query.id || req.body?.reminderId

      if (!reminderId) {
        res.status(400).json({ success: false, message: '缺少提醒 ID' })
        return
      }

      await collection.deleteOne({ _id: toObjectId(reminderId) })

      res.status(200).json({
        success: true,
        message: '删除成功'
      })
      return
    }

    res.status(405).json({ success: false, message: '不支持的请求方法' })
  } catch (error) {
    console.error('提醒 API 错误:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}
