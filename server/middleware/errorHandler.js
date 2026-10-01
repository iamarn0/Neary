import multer from 'multer'
import { ApiError } from '../utils/http.js'

export function notFound(req, res, next) {
  next(new ApiError(404, 'We could not find that.'))
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be under 2 MB.' : 'Upload failed. Try another image.'
    res.locals.errorCode = 'INVALID_UPLOAD'
    return res.status(400).json({ success: false, message, code: 'INVALID_UPLOAD' })
  }

  if (err.code === 11000) {
    res.locals.errorCode = 'DUPLICATE'
    return res.status(409).json({ success: false, message: 'That record already exists.', code: 'DUPLICATE' })
  }

  const status = err.statusCode || (err.name === 'ValidationError' ? 400 : err.name === 'CastError' ? 400 : 500)
  const message =
    status >= 500
      ? 'Something went wrong. Please try again.'
      : err.message || 'Unable to complete that request.'
  const code = err.code && typeof err.code === 'string' ? err.code : status >= 500 ? 'INTERNAL' : undefined

  if (status >= 500) {
    console.error(JSON.stringify({
      code: code || 'INTERNAL',
      message: err.message,
      name: err.name,
    }))
  }
  if (code) res.locals.errorCode = code

  res.status(status).json({
    success: false,
    message,
    ...(code ? { code } : {}),
    ...(err.data ? { data: err.data } : {}),
  })
}
