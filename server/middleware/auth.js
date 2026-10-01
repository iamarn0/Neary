import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { ApiError, asyncHandler } from '../utils/http.js'

function rejectToken(error) {
  if (error instanceof ApiError) throw error
  if (error?.name === 'TokenExpiredError') {
    throw new ApiError(401, 'Your session has expired. Please sign in again.', 'TOKEN_EXPIRED')
  }
  throw new ApiError(401, 'Please sign in to continue.', 'TOKEN_INVALID')
}

export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw new ApiError(401, 'Please sign in to continue.')

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.id)
    if (!user || !user.isActive) throw new ApiError(401, 'Please sign in to continue.', 'TOKEN_INVALID')
    req.user = user
    next()
  } catch (error) {
    rejectToken(error)
  }
})

export const optionalProtect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return next()
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.id)
    if (user?.isActive) req.user = user
  } catch {
    // A public product page still loads if the session token is missing or expired.
  }
  next()
})

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have access to this action.'))
    }
    next()
  }
}

export function signToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })
}
