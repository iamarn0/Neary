import Address from '../models/Address.js'
import { ApiError, asyncHandler, send } from '../utils/http.js'
import { point } from '../utils/geo.js'

function payload(body) {
  const doc = {
    fullName: body.fullName?.trim(),
    phone: body.phone?.trim(),
    flat: body.flat?.trim(),
    building: body.building?.trim() || '',
    area: body.area?.trim(),
    city: body.city?.trim(),
    state: body.state?.trim(),
    pinCode: body.pinCode?.trim(),
    landmark: body.landmark?.trim() || '',
    isDefault: Boolean(body.isDefault),
  }
  if (body.longitude != null && body.latitude != null && body.longitude !== '' && body.latitude !== '') {
    doc.location = point(body.longitude, body.latitude)
  }
  return doc
}

function assertAddress(doc) {
  if (!doc.fullName || !doc.flat || !doc.area || !doc.city || !doc.state) {
    throw new ApiError(400, 'Complete the address fields.')
  }
  if (!/^[6-9]\d{9}$/.test(doc.phone || '')) throw new ApiError(400, 'Enter a 10-digit Indian mobile number.')
  if (!/^[1-9]\d{5}$/.test(doc.pinCode || '')) throw new ApiError(400, 'Enter a valid PIN code.')
}

export const listAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ customer: req.user._id }).sort({ isDefault: -1, updatedAt: -1 })
  send(res, { addresses })
})

export const createAddress = asyncHandler(async (req, res) => {
  const doc = payload(req.body)
  assertAddress(doc)
  if (doc.isDefault) await Address.updateMany({ customer: req.user._id }, { isDefault: false })
  const count = await Address.countDocuments({ customer: req.user._id })
  if (count === 0) doc.isDefault = true
  const address = await Address.create({ ...doc, customer: req.user._id })
  send(res, { address }, 'Address saved.', 201)
})

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, customer: req.user._id })
  if (!address) throw new ApiError(404, 'Address not found.')
  const doc = payload(req.body)
  assertAddress(doc)
  if (doc.isDefault) await Address.updateMany({ customer: req.user._id }, { isDefault: false })
  Object.assign(address, doc)
  await address.save()
  send(res, { address }, 'Address updated.')
})

export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, customer: req.user._id })
  if (!address) throw new ApiError(404, 'Address not found.')
  if (address.isDefault) {
    const next = await Address.findOne({ customer: req.user._id }).sort({ updatedAt: -1 })
    if (next) {
      next.isDefault = true
      await next.save()
    }
  }
  send(res, { ok: true }, 'Address removed.')
})
