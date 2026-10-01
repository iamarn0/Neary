import api from '../lib/api'

const data = (response) => response.data.data

export const authApi = {
  updateMe: (payload) => api.patch('/auth/me', payload).then(data),
  updatePassword: (payload) => api.patch('/auth/password', payload).then(data),
}

export const shopApi = {
  nearby: (params) => api.get('/shops/nearby', { params }).then(data),
  get: (id, params) => api.get(`/shops/${id}`, { params }).then(data),
  products: (id, params) => api.get(`/shops/${id}/products`, { params }).then(data),
  reviews: (id) => api.get(`/shops/${id}/reviews`).then(data),
  search: (params) => api.get('/search', { params }).then(data),
  categories: () => api.get('/categories').then(data),
  favorite: (id) => api.post(`/shops/${id}/favorite`).then(data),
  favoriteProduct: (id) => api.post(`/products/${id}/favorite`).then(data),
  favorites: (params) => api.get('/shops/favorites', { params }).then(data),
}

export const productApi = {
  get: (id, params) => api.get(`/products/${id}`, { params }).then(data),
}

export const cartApi = {
  get: () => api.get('/cart').then(data),
  add: (payload) => api.post('/cart/items', payload).then(data),
  update: (productId, quantity) => api.patch(`/cart/items/${productId}`, { quantity }).then(data),
  remove: (productId) => api.delete(`/cart/items/${productId}`).then(data),
  clear: () => api.delete('/cart').then(data),
}

export const orderApi = {
  quote: (payload) => api.post('/orders/quote', payload).then(data),
  create: (payload) => api.post('/orders', payload).then(data),
  list: () => api.get('/orders').then(data),
  get: (id) => api.get(`/orders/${id}`).then(data),
  cancel: (id) => api.post(`/orders/${id}/cancel`).then(data),
  track: (id) => api.get(`/orders/${id}/track`).then(data),
}

export const addressApi = {
  list: () => api.get('/addresses').then(data),
  create: (payload) => api.post('/addresses', payload).then(data),
  update: (id, payload) => api.patch(`/addresses/${id}`, payload).then(data),
  remove: (id) => api.delete(`/addresses/${id}`).then(data),
}

export const deliveryApi = {
  dashboard: () => api.get('/delivery').then(data),
  offers: () => api.get('/delivery/offers').then(data),
  active: () => api.get('/delivery/active').then(data),
  setOnline: (isOnline) => api.patch('/delivery/status', { isOnline }).then(data),
  accept: (id) => api.post(`/delivery/${id}/accept`).then(data),
  decline: (id) => api.post(`/delivery/${id}/decline`).then(data),
  pickup: (id) => api.post(`/delivery/${id}/pickup`).then(data),
  complete: (id) => api.post(`/delivery/${id}/complete`).then(data),
  location: (id, payload) => api.post(`/delivery/${id}/location`, payload).then(data),
  history: () => api.get('/delivery/history').then(data),
  earnings: () => api.get('/delivery/earnings').then(data),
}

export const reviewApi = {
  create: (payload) => api.post('/reviews', payload).then(data),
  mine: () => api.get('/reviews/mine').then(data),
}

function toFileForm(payload, fileKey) {
  if (!(payload?.[fileKey] instanceof File)) {
    const rest = { ...payload }
    delete rest[fileKey]
    return rest
  }
  const body = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value == null || value === '') return
    body.append(key, value instanceof File ? value : String(value))
  })
  return body
}

export const shopOwnerApi = {
  mine: () => api.get('/shop-owner').then(data),
  register: (payload) => api.post('/shop-owner/register', toFileForm(payload, 'logo')).then(data),
  update: (payload) => api.patch('/shop-owner/settings', payload).then(data),
  dashboard: () => api.get('/shop-owner/dashboard').then(data),
  orders: (status) => api.get('/shop-owner/orders', { params: { status } }).then(data),
  act: (id, payload) => api.post(`/shop-owner/orders/${id}/actions`, payload).then(data),
  products: () => api.get('/shop-owner/products').then(data),
  createProduct: (payload) => api.post('/shop-owner/products', toFileForm(payload, 'image')).then(data),
  updateProduct: (id, payload) => api.patch(`/shop-owner/products/${id}`, toFileForm(payload, 'image')).then(data),
  deleteProduct: (id) => api.delete(`/shop-owner/products/${id}`).then(data),
  inventory: () => api.get('/shop-owner/inventory').then(data),
  addStock: (id, quantity) => api.post(`/shop-owner/inventory/${id}`, { quantity }).then(data),
  createBill: (payload) => api.post('/shop-owner/bills', payload).then(data),
  analytics: () => api.get('/shop-owner/analytics').then(data),
}

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard').then(data),
  users: (role) => api.get('/admin/users', { params: role && typeof role === 'object' ? role : { role } }).then(data),
  setUser: (id, isActive) => api.patch(`/admin/users/${id}`, { isActive }).then(data),
  shops: (status, page = 1) => api.get('/admin/shops', { params: { status, page } }).then(data),
  decideShop: (id, payload) => api.post(`/admin/shops/${id}/decision`, payload).then(data),
  orders: (status, page = 1) => api.get('/admin/orders', { params: { status, page } }).then(data),
  products: (page = 1) => api.get('/admin/products', { params: { page } }).then(data),
  setProduct: (id, isAvailable) => api.patch(`/admin/products/${id}`, { isAvailable }).then(data),
  categories: () => api.get('/admin/categories').then(data),
  createCategory: (payload) => api.post('/admin/categories', payload).then(data),
  updateCategory: (id, payload) => api.patch(`/admin/categories/${id}`, payload).then(data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`).then(data),
  partners: (status) => api.get('/admin/delivery-partners', { params: { status } }).then(data),
  decidePartner: (id, payload) => api.post(`/admin/delivery-partners/${id}/decision`, payload).then(data),
  reviews: (page = 1) => api.get('/admin/reviews', { params: { page } }).then(data),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`).then(data),
  reports: () => api.get('/admin/reports').then(data),
  settings: () => api.get('/admin/settings').then(data),
}

export const notificationApi = {
  list: () => api.get('/notifications').then(data),
  readAll: () => api.patch('/notifications/read').then(data),
}

export const geoApi = {
  suggest: (q) => api.get('/geo/suggest', { params: { q } }).then(data),
}
