import bcrypt from 'bcryptjs'
import { body } from 'express-validator'
import User from '../models/User.js'
import { ApiError, asyncHandler, send } from '../utils/http.js'
import { protect, signToken } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { assertCoordinates, point } from '../utils/geo.js'

function partnerProfileFrom(body) {
  const city = String(body.city || '').trim()
  const area = String(body.area || '').trim()
  if (city.length < 2 || area.length < 2) throw new ApiError(400, 'Enter the city and the area you cover.', 'INVALID_AREA')
  const located = assertCoordinates(body.longitude, body.latitude)
  if (located.error) throw new ApiError(400, 'Drop a pin where you usually start.', 'INVALID_COORDINATES')
  return {
    city,
    area,
    baseLocation: point(located.lng, located.lat),
    partnerStatus: 'PENDING',
    payoutLabel: 'Demo payout profile',
    statusNote: '',
  }
}

const PUBLIC_ROLES = ['CUSTOMER', 'SHOP_OWNER', 'DELIVERY_PARTNER']

export const registerRules = [
  body('name').trim().isLength({ min: 2 }).withMessage('Enter your name.'),
  body('email').isEmail().withMessage('Enter a valid email.').normalizeEmail(),
  body('phone').matches(/^[6-9]\d{9}$/).withMessage('Enter a 10-digit Indian mobile number.'),
  body('password').isLength({ min: 8 }).withMessage('Use at least 8 characters for the password.'),
  body('role').optional().isIn(PUBLIC_ROLES).withMessage('Choose a valid account type.'),
  validate,
]

export const loginRules = [
  body('email').isEmail().withMessage('Enter a valid email.').normalizeEmail(),
  body('password').notEmpty().withMessage('Enter your password.'),
  validate,
]

export const register = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase()
  const existing = await User.findOne({ email })
  if (existing) throw new ApiError(409, 'An account with this email already exists.')

  const role = PUBLIC_ROLES.includes(req.body.role) ? req.body.role : 'CUSTOMER'
  const password = await bcrypt.hash(req.body.password, 10)
  const user = await User.create({
    name: req.body.name.trim(),
    email,
    phone: req.body.phone,
    password,
    role,
    ...(role === 'DELIVERY_PARTNER' ? { partnerProfile: partnerProfileFrom(req.body) } : {}),
  })
  send(res, { token: signToken(user), user }, 'Account created.', 201)
})

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password')
  if (!user || !user.isActive) throw new ApiError(401, 'Email or password is incorrect.')
  const match = await bcrypt.compare(req.body.password, user.password)
  if (!match) throw new ApiError(401, 'Email or password is incorrect.')
  user.password = undefined
  send(res, { token: signToken(user), user: user.toJSON() }, 'Signed in.')
})

export const me = asyncHandler(async (req, res) => {
  send(res, { user: req.user })
})

export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body
  if (name) req.user.name = String(name).trim()
  if (phone) {
    if (!/^[6-9]\d{9}$/.test(phone)) throw new ApiError(400, 'Enter a 10-digit Indian mobile number.')
    req.user.phone = phone
  }
  await req.user.save()
  send(res, { user: req.user }, 'Profile updated.')
})

export const updatePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password')
  const match = await bcrypt.compare(req.body.currentPassword || '', user.password)
  if (!match) throw new ApiError(400, 'Current password is incorrect.')
  if (!req.body.newPassword || req.body.newPassword.length < 8) {
    throw new ApiError(400, 'Use at least 8 characters for the new password.')
  }
  user.password = await bcrypt.hash(req.body.newPassword, 10)
  await user.save()
  send(res, { ok: true }, 'Password updated.')
})

export { protect }
