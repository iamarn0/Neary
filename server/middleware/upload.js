import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import multer from 'multer'
import { fileURLToPath } from 'url'

const uploadDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const TYPES = {
  'image/jpeg': { ext: '.jpg', magic: (buf) => buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff },
  'image/png': { ext: '.png', magic: (buf) => buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 },
  'image/webp': {
    ext: '.webp',
    magic: (buf) => buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP',
  },
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = TYPES[file.mimetype]?.ext || '.img'
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`)
  },
})

function reject(cb, message) {
  const error = new Error(message)
  error.statusCode = 400
  error.code = 'INVALID_UPLOAD'
  cb(error)
}

export const uploadImage = multer({
  storage,
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
  let buf
  try {
    const fd = fs.openSync(req.file.path, 'r')
    buf = Buffer.alloc(16)
    fs.readSync(fd, buf, 0, 16, 0)
    fs.closeSync(fd)
  } catch {
    fs.rmSync(req.file.path, { force: true })
    const error = new Error('Upload failed. Try another image.')
    error.statusCode = 400
    error.code = 'INVALID_UPLOAD'
    return next(error)
  }
  if (!rule?.magic(buf)) {
    fs.rmSync(req.file.path, { force: true })
    const error = new Error('That file is not a JPEG, PNG, or WebP image.')
    error.statusCode = 400
    error.code = 'INVALID_UPLOAD'
    return next(error)
  }
  next()
}
