import mongoose from 'mongoose'
import Product from '../models/Product.js'
import InventoryMovement from '../models/InventoryMovement.js'
import { ApiError } from '../utils/http.js'

export async function recordMovement(entry, session) {
  const docs = await InventoryMovement.create([entry], session ? { session } : undefined)
  return docs[0]
}

export async function reserveStock(lines, { orderId, session } = {}) {
  const reserved = []
  try {
    for (const line of lines) {
      const quantity = Number(line.quantity)
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new ApiError(400, 'Quantity must be a positive whole number.', 'INVALID_QUANTITY')
      }
      const updated = await Product.findOneAndUpdate(
        { _id: line.product, stock: { $gte: quantity }, isAvailable: true },
        { $inc: { stock: -quantity } },
        { new: true, session }
      )
      if (!updated) {
        throw new ApiError(400, `${line.name} is not available in that quantity.`, 'OUT_OF_STOCK')
      }
      if (updated.stock === 0 && updated.isAvailable) {
        updated.isAvailable = false
        await updated.save({ session })
      }
      await recordMovement({
        product: updated._id,
        shop: updated.shop,
        type: 'ORDER_RESERVED',
        quantity: -quantity,
        reason: 'Reserved for an order',
        order: orderId || null,
      }, session)
      reserved.push(line)
    }
    return reserved
  } catch (error) {
    if (!session) await restoreStock(reserved, { orderId, reason: 'Reservation rolled back' })
    throw error
  }
}

export async function restoreStock(lines, { orderId, session, reason = 'Order cancelled' } = {}) {
  for (const line of lines) {
    if (!line.product) continue
    const quantity = Number(line.quantity)
    if (!Number.isFinite(quantity) || quantity <= 0) continue
    const product = await Product.findByIdAndUpdate(
      line.product,
      { $inc: { stock: quantity } },
      { new: true, session }
    )
    if (!product) continue
    if (product.stock > 0 && !product.isAvailable) {
      product.isAvailable = true
      await product.save({ session })
    }
    await recordMovement({
      product: product._id,
      shop: product.shop,
      type: 'ORDER_CANCELLED',
      quantity,
      reason,
      order: orderId || null,
    }, session)
  }
}

export async function adjustStock(product, delta, { type, reason, session } = {}) {
  const quantity = Number(delta)
  if (!Number.isFinite(quantity) || quantity === 0) {
    throw new ApiError(400, 'Enter a stock change that is not zero.', 'INVALID_QUANTITY')
  }
  if (quantity < 0 && product.stock + quantity < 0) {
    throw new ApiError(400, 'Stock cannot go below zero.', 'OUT_OF_STOCK')
  }
  product.stock += quantity
  if (product.stock === 0) product.isAvailable = false
  if (product.stock > 0 && type === 'STOCK_RECEIVED') product.isAvailable = true
  await product.save({ session })
  await recordMovement({
    product: product._id,
    shop: product.shop,
    type: type || (quantity > 0 ? 'STOCK_RECEIVED' : 'MANUAL_ADJUSTMENT'),
    quantity,
    reason: reason || '',
  }, session)
  return product
}

export function transactionsUnsupported(error) {
  const message = String(error?.message || '')
  return (
    message.includes('Transaction numbers are only allowed')
    || message.includes('replica set')
    || error?.codeName === 'IllegalOperation'
  )
}

export async function withOptionalTransaction(work) {
  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      result = await work(session)
    })
    return result
  } catch (error) {
    if (!transactionsUnsupported(error)) throw error
    return work(null)
  } finally {
    await session.endSession()
  }
}
