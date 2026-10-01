import Cart from '../models/Cart.js'
import Product from '../models/Product.js'
import Shop from '../models/Shop.js'
import { ApiError, asyncHandler, send } from '../utils/http.js'
import { unitPrice } from '../utils/money.js'
import { withOpenFlag } from '../utils/hours.js'

async function presentCart(cart) {
  if (!cart || !cart.items.length) {
    return { shop: null, items: [], itemCount: 0 }
  }
  const shop = await Shop.findById(cart.shop).populate('category', 'name slug')
  const products = await Product.find({ _id: { $in: cart.items.map((item) => item.product) } })
  const byId = new Map(products.map((product) => [String(product._id), product]))
  const items = []
  for (const item of cart.items) {
    const product = byId.get(String(item.product))
    if (!product) continue
    items.push({
      product: product._id,
      name: product.name,
      quantity: item.quantity,
      unit: product.unit,
      price: unitPrice(product),
      listPrice: product.price,
      image: product.images?.[0] || '',
      stock: product.stock,
      isAvailable: product.isAvailable && product.stock >= item.quantity,
    })
  }
  return {
    shop: shop ? withOpenFlag(shop) : null,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  }
}

export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ customer: req.user._id })
  send(res, { cart: await presentCart(cart) })
})

export const addItem = asyncHandler(async (req, res) => {
  const quantity = Math.max(1, Number(req.body.quantity) || 1)
  const product = await Product.findById(req.body.productId)
  if (!product || !product.isAvailable || product.stock < quantity) {
    throw new ApiError(400, 'That product is not available in the requested quantity.')
  }
  const shop = await Shop.findOne({ _id: product.shop, approvalStatus: 'APPROVED' })
  if (!shop) throw new ApiError(400, 'That shop is not available.')

  let cart = await Cart.findOne({ customer: req.user._id })
  if (!cart) cart = new Cart({ customer: req.user._id, items: [] })

  if (cart.shop && cart.items.length && String(cart.shop) !== String(product.shop)) {
    const current = await Shop.findById(cart.shop).select('name')
    throw new ApiError(
      409,
      `Your cart contains items from ${current?.name || 'another shop'}.`,
      'CART_SHOP_CONFLICT',
      { currentShop: current?.name || 'your current shop', nextShop: shop.name }
    )
  }

  const existing = cart.items.find((item) => String(item.product) === String(product._id))
  const nextQty = (existing?.quantity || 0) + quantity
  if (nextQty > product.stock) throw new ApiError(400, 'Not enough stock for that quantity.')
  if (existing) existing.quantity = nextQty
  else cart.items.push({ product: product._id, quantity })
  cart.shop = product.shop
  await cart.save()
  send(res, { cart: await presentCart(cart) }, 'Added to cart.')
})

export const updateItem = asyncHandler(async (req, res) => {
  const quantity = req.method === 'DELETE' ? 0 : Number(req.body.quantity)
  const cart = await Cart.findOne({ customer: req.user._id })
  if (!cart) throw new ApiError(404, 'Your cart is empty.')
  const item = cart.items.find((entry) => String(entry.product) === req.params.productId)
  if (!item) throw new ApiError(404, 'That item is not in your cart.')
  if (quantity <= 0) {
    cart.items = cart.items.filter((entry) => String(entry.product) !== req.params.productId)
  } else {
    const product = await Product.findById(item.product)
    if (!product || quantity > product.stock) throw new ApiError(400, 'Not enough stock for that quantity.')
    item.quantity = quantity
  }
  if (!cart.items.length) cart.shop = null
  await cart.save()
  send(res, { cart: await presentCart(cart) })
})

export const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ customer: req.user._id }, { items: [], shop: null }, { upsert: true })
  send(res, { cart: { shop: null, items: [], itemCount: 0 } }, 'Cart cleared.')
})
