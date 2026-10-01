import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'

const uploadDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads')

const TYPES = {
  'image/jpeg': { ext: '.jpg', magic: (buf) => buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff },
  'image/png': { ext: '.png', magic: (buf) => buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 },
  'image/webp': {
    ext: '.webp',
    magic: (buf) => buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP',
  },
}

function reject(cb, message) {
  const error = new Error(message)
  error.statusCode = 400
  error.code = 'INVALID_UPLOAD'
  cb(error)
}

export function cloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
}

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!TYPES[file.mimetype]) {
      reject(cb, 'Upload a JPEG, PNG, or WebP image.')
      return
    }
    cb(null, true)
  },
})

export function assertImageSignature(req, res, next) {
  if (!req.file) return next()
  const rule = TYPES[req.file.mimetype]
  const buf = req.file.buffer?.subarray(0, 16)
  if (!buf || !rule?.magic(buf)) {
    const error = new Error('That file is not a JPEG, PNG, or WebP image.')
    error.statusCode = 400
    error.code = 'INVALID_UPLOAD'
    return next(error)
  }
  next()
}

function uploadError(statusCode, message, code) {
  const error = new Error(message)
  error.statusCode = statusCode
  error.code = code
  error.publicMessage = message
  return error
}

function uploadBuffer(buffer) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
  return new Promise((resolve, rejectUpload) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'neare', resource_type: 'image', unique_filename: true, overwrite: false },
      (error, result) => (error ? rejectUpload(error) : resolve(result)),
    )
    stream.end(buffer)
  })
}

export async function publishImage(req, res, next) {
  if (!req.file) return next()
  try {
    if (cloudinaryConfigured()) {
      const result = await uploadBuffer(req.file.buffer)
      req.file.publicUrl = result.secure_url
      return next()
    }
    if (process.env.NODE_ENV === 'production') {
      return next(uploadError(503, 'Image storage is not configured.', 'STORAGE_UNAVAILABLE'))
    }
    const ext = TYPES[req.file.mimetype]?.ext || '.img'
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`
    await fs.mkdir(uploadDir, { recursive: true })
    await fs.writeFile(path.join(uploadDir, filename), req.file.buffer)
    req.file.filename = filename
    req.file.publicUrl = `/uploads/${filename}`
    return next()
  } catch (error) {
    console.error(JSON.stringify({ code: 'UPLOAD_FAILED', message: error.message }))
    return next(uploadError(502, 'Upload failed. Try another image.', 'UPLOAD_FAILED'))
  }
}
