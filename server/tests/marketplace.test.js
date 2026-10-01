import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import request from 'supertest'
import bcrypt from 'bcryptjs'
import { createApp } from '../createApp.js'
import User from '../models/User.js'
import Category from '../models/Category.js'
import Shop from '../models/Shop.js'
import Product from '../models/Product.js'
import Address from '../models/Address.js'
import Order from '../models/Order.js'
import { transitionOrder } from '../services/orderService.js'
import { nearbyShops } from '../services/catalogService.js'

process.env.JWT_SECRET = 'test-secret-value-123456'
process.env.TAX_RATE = '0'
process.env.DEMO_TRACKING = 'false'

const app = createApp()
let mongo

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
  await Promise.all([
    User.init(),
    Shop.init(),
    Product.init(),
  ])
}, 60000)

afterAll(async () => {
  await mongoose.disconnect()
  if (mongo) await mongo.stop()
})

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections()
  await Promise.all(collections.map((collection) => collection.deleteMany({})))
})

async function register(role, extra = {}) {
  const email = `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}@neare.test`
  const response = await request(app).post('/api/auth/register').send({
    name: 'Test User',
    email,
    phone: '9000000099',
    password: 'Password1',
    role,
    ...extra,
  })
  return { email, ...response.body.data, status: response.status, body: response.body }
}

describe('auth', () => {
  it('registers, rejects a bad password, and blocks protected routes', async () => {
    const created = await register('CUSTOMER')
    expect(created.status).toBe(201)
    const bad = await request(app).post('/api/auth/login').send({ email: created.email, password: 'wrong-pass' })
    expect(bad.status).toBe(401)
    const hidden = await request(app).get('/api/orders')
    expect(hidden.status).toBe(401)
    const admin = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${created.token}`)
    expect(admin.status).toBe(403)
  })
})

describe('cart, orders, delivery, reviews, and nearby shops', () => {
  async function fixture() {
    const category = await Category.create({ name: 'Grocery', slug: 'grocery' })
    const owner = await User.create({
      name: 'Owner',
      email: 'owner@neare.test',
      phone: '9000000002',
      password: await bcrypt.hash('Password1', 4),
      role: 'SHOP_OWNER',
    })
    const otherOwner = await User.create({
      name: 'Other',
      email: 'other@neare.test',
      phone: '9000000008',
      password: await bcrypt.hash('Password1', 4),
      role: 'SHOP_OWNER',
    })
    const customer = await register('CUSTOMER')
    const shop = await Shop.create({
      name: 'FreshMart',
      owner: owner._id,
      category: category._id,
      address: 'LB Block',
      city: 'Kolkata',
      state: 'West Bengal',
      pinCode: '700091',
      location: { type: 'Point', coordinates: [88.41, 22.58] },
      approvalStatus: 'APPROVED',
      openingTime: '00:00',
      closingTime: '00:00',
      deliveryRadius: 8,
    })
    const otherShop = await Shop.create({
      name: 'Bake House',
      owner: otherOwner._id,
      category: category._id,
      address: 'Sector V',
      city: 'Kolkata',
      state: 'West Bengal',
      pinCode: '700156',
      location: { type: 'Point', coordinates: [88.48, 22.59] },
      approvalStatus: 'APPROVED',
      openingTime: '00:00',
      closingTime: '00:00',
    })
    const milk = await Product.create({
      shop: shop._id,
      name: 'Milk',
      category: category._id,
      price: 64,
      unit: '1 L',
      stock: 5,
    })
    const bread = await Product.create({
      shop: otherShop._id,
      name: 'Bread',
      category: category._id,
      price: 40,
      unit: 'loaf',
      stock: 4,
    })
    return { customer, shop, otherShop, milk, bread, owner }
  }

  it('keeps one shop in the cart and rejects oversell', async () => {
    const { customer, milk, bread } = await fixture()
    const auth = { Authorization: `Bearer ${customer.token}` }
    const added = await request(app).post('/api/cart/items').set(auth).send({ productId: milk._id, quantity: 2 })
    expect(added.status).toBe(200)
    const clash = await request(app).post('/api/cart/items').set(auth).send({ productId: bread._id, quantity: 1 })
    expect(clash.status).toBe(409)
    expect(clash.body.code).toBe('CART_SHOP_CONFLICT')
    expect(clash.body.data.currentShop).toBe('FreshMart')
    expect(clash.body.data.nextShop).toBe('Bake House')
    const tooMany = await request(app).patch(`/api/cart/items/${milk._id}`).set(auth).send({ quantity: 9 })
    expect(tooMany.status).toBe(400)
    const removed = await request(app).delete(`/api/cart/items/${milk._id}`).set(auth)
    expect(removed.body.data.cart.items).toHaveLength(0)
  })

  it('places a pickup order, blocks an invalid transition, and restores stock on cancel', async () => {
    const { customer, milk, owner } = await fixture()
    const auth = { Authorization: `Bearer ${customer.token}` }
    await request(app).post('/api/cart/items').set(auth).send({ productId: milk._id, quantity: 2 })
    const quote = await request(app).post('/api/orders/quote').set(auth).send({ fulfillmentMethod: 'PICKUP' })
    expect(quote.status).toBe(200)
    const created = await request(app).post('/api/orders').set(auth).send({ fulfillmentMethod: 'PICKUP', paymentMethod: 'COD' })
    expect(created.status).toBe(201)
    const product = await Product.findById(milk._id)
    expect(product.stock).toBe(3)
    const order = await Order.findById(created.body.data.order._id)
    await expect(transitionOrder({ order, to: 'PREPARING', actor: owner, io: null })).rejects.toMatchObject({ code: 'INVALID_TRANSITION' })
    const cancelled = await request(app).post(`/api/orders/${order._id}/cancel`).set(auth)
    expect(cancelled.status).toBe(200)
    const restored = await Product.findById(milk._id)
    expect(restored.stock).toBe(5)
  })

  it('hides the full address until the assigned partner accepts', async () => {
    const { customer, shop, milk } = await fixture()
    const auth = { Authorization: `Bearer ${customer.token}` }
    const address = await Address.create({
      customer: customer.user._id,
      fullName: 'Aisha Rahman',
      phone: '9000000001',
      flat: '12B',
      area: 'Salt Lake',
      city: 'Kolkata',
      state: 'West Bengal',
      pinCode: '700091',
      location: { type: 'Point', coordinates: [88.412, 22.581] },
    })
    await request(app).post('/api/cart/items').set(auth).send({ productId: milk._id, quantity: 1 })
    const created = await request(app).post('/api/orders').set(auth).send({
      fulfillmentMethod: 'DELIVERY',
      paymentMethod: 'UPI',
      addressId: address._id,
    })
    const order = await Order.findById(created.body.data.order._id)
    order.orderStatus = 'READY'
    await order.save()

    const pending = await register('DELIVERY_PARTNER', {
      city: 'Kolkata',
      area: 'Salt Lake',
      longitude: 88.41,
      latitude: 22.58,
    })
    const offline = await request(app).patch('/api/delivery/status').set('Authorization', `Bearer ${pending.token}`).send({ isOnline: true })
    expect(offline.status).toBe(403)

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@neare.test',
      phone: '9000000004',
      password: await bcrypt.hash('Password1', 4),
      role: 'ADMIN',
    })
    const adminLogin = await request(app).post('/api/auth/login').send({ email: admin.email, password: 'Password1' })
    const approved = await request(app)
      .post(`/api/admin/delivery-partners/${pending.user._id}/decision`)
      .set('Authorization', `Bearer ${adminLogin.body.data.token}`)
      .send({ action: 'approve' })
    expect(approved.status).toBe(200)

    await request(app).patch('/api/delivery/status').set('Authorization', `Bearer ${pending.token}`).send({ isOnline: true })
    const { assignDelivery } = await import('../services/deliveryService.js')
    await assignDelivery(order, null)
    const offers = await request(app).get('/api/delivery/offers').set('Authorization', `Bearer ${pending.token}`)
    expect(offers.body.data.offers[0].customerAddress).toBeUndefined()
    expect(offers.body.data.offers[0].destinationArea).toBe('Salt Lake')
    const accepted = await request(app).post(`/api/delivery/${offers.body.data.offers[0].deliveryId}/accept`).set('Authorization', `Bearer ${pending.token}`)
    expect(accepted.status).toBe(200)
    const active = await request(app).get('/api/delivery/active').set('Authorization', `Bearer ${pending.token}`)
    expect(active.body.data.delivery.customerAddress.flat).toBe('12B')

    const stranger = await register('DELIVERY_PARTNER', {
      city: 'Kolkata',
      area: 'Salt Lake',
      longitude: 88.411,
      latitude: 22.582,
    })
    await User.updateOne({ _id: stranger.user._id }, { 'partnerProfile.partnerStatus': 'APPROVED', isOnline: true })
    const stolen = await request(app).post(`/api/delivery/${offers.body.data.offers[0].deliveryId}/complete`).set('Authorization', `Bearer ${stranger.token}`)
    expect(stolen.status).toBe(403)
    expect(shop.name).toBe('FreshMart')
  })

  it('requires a completed order before a review and rejects a duplicate', async () => {
    const { customer, milk } = await fixture()
    const auth = { Authorization: `Bearer ${customer.token}` }
    await request(app).post('/api/cart/items').set(auth).send({ productId: milk._id, quantity: 1 })
    const created = await request(app).post('/api/orders').set(auth).send({ fulfillmentMethod: 'PICKUP', paymentMethod: 'COD' })
    const early = await request(app).post('/api/reviews').set(auth).send({ orderId: created.body.data.order._id, rating: 5, comment: 'Good' })
    expect(early.status).toBe(400)
    await Order.updateOne({ _id: created.body.data.order._id }, { orderStatus: 'PICKED_UP' })
    const saved = await request(app).post('/api/reviews').set(auth).send({ orderId: created.body.data.order._id, rating: 5, comment: 'Good' })
    expect(saved.status).toBe(201)
    const again = await request(app).post('/api/reviews').set(auth).send({ orderId: created.body.data.order._id, rating: 4 })
    expect(again.status).toBe(409)
  })

  it('sorts nearby shops and respects the radius', async () => {
    const { shop, otherShop } = await fixture()
    const near = await nearbyShops({ longitude: 88.41, latitude: 22.58, radius: 3000 })
    expect(near[0].shop.name).toBe(shop.name)
    expect(near.some((row) => row.shop.name === otherShop.name)).toBe(false)
    const wider = await nearbyShops({ longitude: 88.41, latitude: 22.58, radius: 20000 })
    const names = wider.map((row) => row.shop.name)
    expect(names.indexOf('FreshMart')).toBeLessThan(names.indexOf('Bake House'))
  })
})
