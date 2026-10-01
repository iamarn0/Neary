export class ApiError extends Error {
  constructor(statusCode, message, code, data) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.data = data
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

export function send(res, data, message = 'OK', status = 200) {
  res.status(status).json({ success: true, message, data })
}
