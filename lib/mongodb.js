// MongoDB 数据库连接
const { MongoClient } = require('mongodb')

let cachedClient = null
let cachedDb = null

async function connectToDatabase() {
  // 如果已有连接，直接返回
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('请设置 MONGODB_URI 环境变量')
  }

  const client = new MongoClient(uri)
  await client.connect()

  const db = client.db('aiwo')

  cachedClient = client
  cachedDb = db

  console.log('数据库连接成功')

  return { client, db }
}

module.exports = { connectToDatabase }
