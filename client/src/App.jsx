import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import CustomerLayout from './layouts/CustomerLayout'
import DashboardLayout from './layouts/DashboardLayout'
import ProtectedRoute from './routes/ProtectedRoute'
import EmptyState from './components/ui/EmptyState'

const LandingPage = lazy(() => import('./pages/public/LandingPage'))
const HowItWorksPage = lazy(() => import('./pages/public/HowItWorksPage'))
const CoveragePage = lazy(() => import('./pages/public/CoveragePage'))
const PublicCategoriesPage = lazy(() => import('./pages/public/CategoriesPage'))
const ForShopsPage = lazy(() => import('./pages/public/ForShopsPage'))
const ForDeliveryPage = lazy(() => import('./pages/public/ForDeliveryPage'))
const AboutPage = lazy(() => import('./pages/public/AboutPage'))
const HelpPage = lazy(() => import('./pages/public/HelpPage'))
const ContactPage = lazy(() => import('./pages/public/ContactPage'))
const PrivacyPage = lazy(() => import('./pages/public/LegalPages').then((module) => ({ default: module.PrivacyPage })))
const TermsPage = lazy(() => import('./pages/public/LegalPages').then((module) => ({ default: module.TermsPage })))
const HomePage = lazy(() => import('./pages/customer/HomePage'))
const ExplorePage = lazy(() => import('./pages/customer/ExplorePage'))
const SearchPage = lazy(() => import('./pages/customer/SearchPage'))
const ShopPage = lazy(() => import('./pages/customer/ShopPage'))
const ProductPage = lazy(() => import('./pages/customer/ProductPage'))
const CartPage = lazy(() => import('./pages/customer/CartPage'))
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'))
const OrdersPage = lazy(() => import('./pages/customer/OrdersPage'))
const OrderDetailPage = lazy(() => import('./pages/customer/OrderDetailPage'))
const TrackPage = lazy(() => import('./pages/customer/TrackPage'))
const ProfilePage = lazy(() => import('./pages/customer/ProfilePage'))
const AddressesPage = lazy(() => import('./pages/customer/AddressesPage'))
const FavoritesPage = lazy(() => import('./pages/customer/FavoritesPage'))
const NotificationsPage = lazy(() => import('./pages/customer/NotificationsPage'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const ShopRegisterPage = lazy(() => import('./pages/shop/ShopRegisterPage'))
const ShopDashboardPage = lazy(() => import('./pages/shop/ShopDashboardPage'))
const ShopOrdersPage = lazy(() => import('./pages/shop/ShopOrdersPage'))
const ShopBillPage = lazy(() => import('./pages/shop/ShopBillPage'))
const ShopInventoryPage = lazy(() => import('./pages/shop/ShopInventoryPage'))
const ShopAnalyticsPage = lazy(() => import('./pages/shop/ShopAnalyticsPage'))
const ShopSettingsPage = lazy(() => import('./pages/shop/ShopSettingsPage'))
const DeliveryDashboardPage = lazy(() => import('./pages/delivery/DeliveryDashboardPage'))
const ActiveDeliveryPage = lazy(() => import('./pages/delivery/ActiveDeliveryPage'))
const DeliveryHistoryPage = lazy(() => import('./pages/delivery/DeliveryHistoryPage'))
const EarningsPage = lazy(() => import('./pages/delivery/EarningsPage'))
const DeliveryProfilePage = lazy(() => import('./pages/delivery/DeliveryProfilePage'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminOrdersPage })))
const AdminProductsPage = lazy(() => import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminProductsPage })))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminPages').then((module) => ({ default: module.AdminSettingsPage })))
const CategoriesPage = lazy(() => import('./pages/admin/AdminPages').then((module) => ({ default: module.CategoriesPage })))
const DeliveryPartnersPage = lazy(() => import('./pages/admin/AdminPages').then((module) => ({ default: module.DeliveryPartnersPage })))
const ReportsPage = lazy(() => import('./pages/admin/AdminPages').then((module) => ({ default: module.ReportsPage })))
const ReviewsPage = lazy(() => import('./pages/admin/AdminPages').then((module) => ({ default: module.ReviewsPage })))
const ShopsPage = lazy(() => import('./pages/admin/AdminPages').then((module) => ({ default: module.ShopsPage })))
const UsersPage = lazy(() => import('./pages/admin/AdminPages').then((module) => ({ default: module.UsersPage })))

const shopNav = [
  { to: '/shop', label: 'Overview', end: true },
  { to: '/shop/orders', label: 'Orders' },
  { to: '/shop/new-order', label: 'New order' },
  { to: '/shop/inventory', label: 'Inventory' },
  { to: '/shop/analytics', label: 'Analytics' },
  { to: '/shop/settings', label: 'Settings' },
]

const deliveryNav = [
  { to: '/delivery', label: 'Dashboard', end: true },
  { to: '/delivery/active', label: 'Active Delivery' },
  { to: '/delivery/history', label: 'History' },
  { to: '/delivery/earnings', label: 'Earnings' },
  { to: '/delivery/profile', label: 'Profile' },
]

const adminNav = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/shops', label: 'Shops' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/delivery', label: 'Delivery' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/settings', label: 'Settings' },
]

function NotFound() {
  return <EmptyState title="Page not found" body="That NEARE page does not exist." />
}

function PageFallback() {
  return <p className="px-4 py-10 text-sm text-muted">Loading page…</p>
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/coverage" element={<CoveragePage />} />
        <Route path="/categories" element={<PublicCategoriesPage />} />
        <Route path="/for-shops" element={<ForShopsPage />} />
        <Route path="/for-delivery" element={<ForDeliveryPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
        <Route element={<CustomerLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/shops/:id" element={<ShopPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/orders/:id/track" element={<TrackPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/addresses" element={<AddressesPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['SHOP_OWNER']} />}>
        <Route element={<DashboardLayout title="Shop" items={shopNav} />}>
          <Route path="/shop" element={<ShopDashboardPage />} />
          <Route path="/shop/register" element={<ShopRegisterPage />} />
          <Route path="/shop/orders" element={<ShopOrdersPage />} />
          <Route path="/shop/new-order" element={<ShopBillPage />} />
          <Route path="/shop/products" element={<Navigate to="/shop/inventory" replace />} />
          <Route path="/shop/inventory" element={<ShopInventoryPage />} />
          <Route path="/shop/analytics" element={<ShopAnalyticsPage />} />
          <Route path="/shop/settings" element={<ShopSettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['DELIVERY_PARTNER']} />}>
        <Route element={<DashboardLayout title="Delivery" items={deliveryNav} />}>
          <Route path="/delivery" element={<DeliveryDashboardPage />} />
          <Route path="/delivery/active" element={<ActiveDeliveryPage />} />
          <Route path="/delivery/history" element={<DeliveryHistoryPage />} />
          <Route path="/delivery/earnings" element={<EarningsPage />} />
          <Route path="/delivery/profile" element={<DeliveryProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['ADMIN']} />}>
        <Route element={<DashboardLayout title="Admin" items={adminNav} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/shops" element={<ShopsPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/categories" element={<CategoriesPage />} />
          <Route path="/admin/delivery" element={<DeliveryPartnersPage />} />
          <Route path="/admin/reviews" element={<ReviewsPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

    </Routes>
    </Suspense>
  )
}
