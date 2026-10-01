import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { protect, authorize, optionalProtect } from '../middleware/auth.js'
import { assertImageSignature, publishImage, uploadImage } from '../middleware/upload.js'
import * as auth from '../controllers/authController.js'
import * as catalog from '../controllers/catalogController.js'
import * as cart from '../controllers/cartController.js'
import * as addresses from '../controllers/addressController.js'
import * as orders from '../controllers/orderController.js'
import * as delivery from '../controllers/deliveryController.js'
import * as reviews from '../controllers/reviewController.js'
import * as notes from '../controllers/notificationController.js'
import * as geo from '../controllers/geoController.js'
import * as shopOwner from '../controllers/shopOwnerController.js'
import * as admin from '../controllers/adminController.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again shortly.' },
})

router.post('/auth/register', authLimiter, auth.registerRules, auth.register)
router.post('/auth/login', authLimiter, auth.loginRules, auth.login)
router.get('/auth/me', protect, auth.me)
router.patch('/auth/me', protect, auth.updateMe)
router.patch('/auth/password', protect, auth.updatePassword)

router.get('/geo/suggest', geo.suggest)
router.get('/categories', catalog.listCategories)
router.get('/shops/nearby', catalog.listNearby)
router.get('/shops/nearby/products', catalog.listNearbyProducts)
router.get('/shops/favorites', protect, authorize('CUSTOMER'), catalog.listFavorites)
router.get('/shops/:id', catalog.getShop)
router.get('/shops/:id/products', catalog.getShopProducts)
router.get('/shops/:id/reviews', catalog.getShopReviews)
router.post('/shops/:id/favorite', protect, authorize('CUSTOMER'), catalog.toggleFavorite)
router.post('/products/:id/favorite', protect, authorize('CUSTOMER'), catalog.toggleProductFavorite)
router.get('/products/:id', optionalProtect, catalog.getProduct)
router.get('/search', catalog.search)

router.get('/cart', protect, authorize('CUSTOMER'), cart.getCart)
router.post('/cart/items', protect, authorize('CUSTOMER'), cart.addItem)
router.patch('/cart/items/:productId', protect, authorize('CUSTOMER'), cart.updateItem)
router.delete('/cart/items/:productId', protect, authorize('CUSTOMER'), cart.updateItem)
router.delete('/cart', protect, authorize('CUSTOMER'), cart.clearCart)

router.get('/addresses', protect, authorize('CUSTOMER'), addresses.listAddresses)
router.post('/addresses', protect, authorize('CUSTOMER'), addresses.createAddress)
router.patch('/addresses/:id', protect, authorize('CUSTOMER'), addresses.updateAddress)
router.delete('/addresses/:id', protect, authorize('CUSTOMER'), addresses.deleteAddress)

router.post('/orders/quote', protect, authorize('CUSTOMER'), orders.quote)
router.post('/orders', protect, authorize('CUSTOMER'), orders.createOrder)
router.get('/orders', protect, authorize('CUSTOMER'), orders.listOrders)
router.get('/orders/:id', protect, orders.getOrder)
router.post('/orders/:id/cancel', protect, authorize('CUSTOMER'), orders.cancelOrder)
router.get('/orders/:id/track', protect, orders.trackOrder)

router.get('/delivery', protect, authorize('DELIVERY_PARTNER'), delivery.dashboard)
router.get('/delivery/offers', protect, authorize('DELIVERY_PARTNER'), delivery.listOffers)
router.get('/delivery/active', protect, authorize('DELIVERY_PARTNER'), delivery.getActive)
router.patch('/delivery/status', protect, authorize('DELIVERY_PARTNER'), delivery.setOnline)
router.post('/delivery/:id/accept', protect, authorize('DELIVERY_PARTNER'), delivery.accept)
router.post('/delivery/:id/decline', protect, authorize('DELIVERY_PARTNER'), delivery.decline)
router.post('/delivery/:id/pickup', protect, authorize('DELIVERY_PARTNER'), delivery.pickup)
router.post('/delivery/:id/complete', protect, authorize('DELIVERY_PARTNER'), delivery.complete)
router.post('/delivery/:id/location', protect, authorize('DELIVERY_PARTNER'), delivery.location)
router.get('/delivery/history', protect, authorize('DELIVERY_PARTNER'), delivery.history)
router.get('/delivery/earnings', protect, authorize('DELIVERY_PARTNER'), delivery.earnings)

router.post('/reviews', protect, authorize('CUSTOMER'), reviews.createReview)
router.get('/reviews/mine', protect, authorize('CUSTOMER'), reviews.myReviews)
router.get('/notifications', protect, notes.listNotifications)
router.patch('/notifications/read', protect, notes.markRead)
router.patch('/notifications/:id/read', protect, notes.markRead)

const shop = Router()
shop.use(protect, authorize('SHOP_OWNER'))
shop.get('/', shopOwner.myShop)
shop.post('/register', uploadImage.single('logo'), assertImageSignature, publishImage, shopOwner.registerShop)
shop.patch('/settings', uploadImage.single('logo'), assertImageSignature, publishImage, shopOwner.updateShop)
shop.get('/dashboard', shopOwner.dashboard)
shop.get('/orders', shopOwner.listOrders)
shop.post('/orders/:id/actions', shopOwner.actOnOrder)
shop.get('/products', shopOwner.listProducts)
shop.post('/products', uploadImage.single('image'), assertImageSignature, publishImage, shopOwner.createProduct)
shop.patch('/products/:id', uploadImage.single('image'), assertImageSignature, publishImage, shopOwner.updateProduct)
shop.delete('/products/:id', shopOwner.deleteProduct)
shop.get('/inventory', shopOwner.inventory)
shop.post('/inventory/:id', shopOwner.addStock)
shop.post('/bills', shopOwner.createBill)
shop.get('/analytics', shopOwner.analytics)
router.use('/shop-owner', shop)

const adminRouter = Router()
adminRouter.use(protect, authorize('ADMIN'))
adminRouter.get('/dashboard', admin.dashboard)
adminRouter.get('/users', admin.users)
adminRouter.patch('/users/:id', admin.setUserActive)
adminRouter.get('/shops', admin.shops)
adminRouter.post('/shops/:id/decision', admin.decideShop)
adminRouter.get('/orders', admin.orders)
adminRouter.get('/products', admin.products)
adminRouter.patch('/products/:id', admin.setProduct)
adminRouter.get('/categories', admin.categories)
adminRouter.post('/categories', admin.createCategory)
adminRouter.patch('/categories/:id', admin.updateCategory)
adminRouter.delete('/categories/:id', admin.deleteCategory)
adminRouter.get('/delivery-partners', admin.partners)
adminRouter.post('/delivery-partners/:id/decision', admin.decidePartner)
adminRouter.get('/reviews', admin.reviews)
adminRouter.delete('/reviews/:id', admin.deleteReview)
adminRouter.get('/reports', admin.reports)
adminRouter.get('/settings', admin.settings)
router.use('/admin', adminRouter)

export default router
