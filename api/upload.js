// 文件上传 API
const { uploadFile } = require('../lib/cloudinary')

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: '仅支持 POST 请求' })
    return
  }

  try {
    // 解析 multipart/form-data
    const data = await parseMultipart(req)

    if (!data.file) {
      res.status(400).json({ success: false, message: '没有收到文件' })
      return
    }

    // 上传到 Cloudinary
    const result = await uploadFile(data.file.buffer, {
      resource_type: data.file.mimetype.startsWith('video/') ? 'video' : 'image'
    })

    res.status(200).json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    })
  } catch (error) {
    console.error('上传 API 错误:', error)
    res.status(500).json({ success: false, message: error.message })
  }
}

// 解析 multipart/form-data（简单实现）
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => {
      const buffer = Buffer.concat(chunks)
      const contentType = req.headers['content-type']

      if (!contentType.includes('multipart/form-data')) {
        resolve({ file: null })
        return
      }

      const boundary = contentType.split('boundary=')[1]
      const parts = buffer.split(`--${boundary}`)

      for (const part of parts) {
        if (part.includes('filename=')) {
          const headerEnd = part.indexOf('\r\n\r\n')
          const header = part.slice(0, headerEnd).toString()
          const fileBuffer = part.slice(headerEnd + 4, part.length - 2)

          const filenameMatch = header.match(/filename="(.+)"/)
          const mimetypeMatch = header.match(/Content-Type: (.+)/)

          resolve({
            file: {
              buffer: fileBuffer,
              filename: filenameMatch ? filenameMatch[1] : 'file',
              mimetype: mimetypeMatch ? mimetypeMatch[1] : 'application/octet-stream'
            }
          })
          return
        }
      }

      resolve({ file: null })
    })
    req.on('error', reject)
  })
}
