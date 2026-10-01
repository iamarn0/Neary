import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { adminApi } from '../../services'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useToast } from '../../context/ToastContext'
import { formatINR, formatStatus } from '../../lib/format'
import Button from '../../components/ui/Button'
import Pagination from '../../components/ui/Pagination'
import { Field, TextInput } from '../../components/ui/Field'
import ShopMap from '../../components/maps/ShopMap'

function useAdminMeta(title) {
  usePageMeta(`${title} · NEARE`)
}

export function UsersPage() {
  useAdminMeta('Users')
  const toast = useToast()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const users = useQuery({ queryKey: ['admin-users', page], queryFn: () => adminApi.users({ page }) })
  const toggle = useMutation({
    mutationFn: ({ id, isActive }) => adminApi.setUser(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    onError: (error) => toast.error(error.message),
  })
  return (
    <div>
      <h1 className="text-2xl font-semibold">Users</h1>
      <div className="mt-4 space-y-2">
        {(users.data?.users || []).map((user) => (
          <article key={user._id} className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-muted">{user.email} · {formatStatus(user.role)}</p>
            </div>
            <Button variant="ghost" onClick={() => toggle.mutate({ id: user._id, isActive: !user.isActive })}>
              {user.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </article>
        ))}
      </div>
      <Pagination page={users.data?.pagination?.page} pages={users.data?.pagination?.pages} onPage={setPage} />
    </div>
  )
}

export function ShopsPage() {
  useAdminMeta('Shops')
  const toast = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('PENDING_APPROVAL')
  const [page, setPage] = useState(1)
  const shops = useQuery({ queryKey: ['admin-shops', status, page], queryFn: () => adminApi.shops(status, page) })
  const decide = useMutation({
    mutationFn: ({ id, action }) => adminApi.decideShop(id, { action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-shops'] }),
    onError: (error) => toast.error(error.message),
  })
  return (
    <div>
      <h1 className="text-2xl font-semibold">Shops</h1>
      <div className="mt-4 flex gap-2">
        {['PENDING_APPROVAL', 'APPROVED', 'REJECTED'].map((item) => (
          <button key={item} type="button" className={`rounded-lg border px-3 py-2 text-sm ${status === item ? 'bg-ink text-white' : 'border-line bg-white'}`} onClick={() => { setStatus(item); setPage(1) }}>{formatStatus(item)}</button>
        ))}
      </div>
      <div className="mt-4 space-y-4">
        {(shops.data?.shops || []).map((shop) => (
          <article key={shop._id} className="rounded-2xl border border-line bg-white p-4">
            <p className="font-semibold">{shop.name}</p>
            <p className="text-sm text-muted">{shop.owner?.name} · {shop.phone} · {shop.category?.name}</p>
            <p className="text-sm text-muted">{shop.address}, {shop.city} {shop.pinCode}</p>
            <div className="mt-3"><ShopMap shop={shop} className="h-48" /></div>
            {shop.approvalStatus === 'PENDING_APPROVAL' ? (
              <div className="mt-3 flex gap-2">
                <Button onClick={() => decide.mutate({ id: shop._id, action: 'approve' })}>Approve</Button>
                <Button variant="danger" onClick={() => decide.mutate({ id: shop._id, action: 'reject' })}>Reject</Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
      <Pagination page={shops.data?.pagination?.page} pages={shops.data?.pagination?.pages} onPage={setPage} />
    </div>
  )
}

export function AdminOrdersPage() {
  useAdminMeta('Orders')
  const [page, setPage] = useState(1)
  const orders = useQuery({ queryKey: ['admin-orders', page], queryFn: () => adminApi.orders(undefined, page) })
  return (
    <div>
      <h1 className="text-2xl font-semibold">Orders</h1>
      <div className="mt-4 space-y-2 text-sm">
        {(orders.data?.orders || []).map((order) => (
          <article key={order._id} className="flex justify-between rounded-xl border border-line bg-white px-4 py-3">
            <span>{order.orderNumber} · {order.shop?.name} · {order.customer?.name}</span>
            <span>{formatStatus(order.orderStatus)} · {formatINR(order.total)}</span>
          </article>
        ))}
      </div>
      <Pagination page={orders.data?.pagination?.page} pages={orders.data?.pagination?.pages} onPage={setPage} />
    </div>
  )
}

export function AdminProductsPage() {
  useAdminMeta('Products')
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const products = useQuery({ queryKey: ['admin-products', page], queryFn: () => adminApi.products(page) })
  const toggle = useMutation({
    mutationFn: ({ id, isAvailable }) => adminApi.setProduct(id, isAvailable),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] }),
  })
  return (
    <div>
      <h1 className="text-2xl font-semibold">Products</h1>
      <div className="mt-4 space-y-2 text-sm">
        {(products.data?.products || []).map((product) => (
          <article key={product._id} className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3">
            <span>{product.name} · {product.shop?.name}</span>
            <Button variant="ghost" onClick={() => toggle.mutate({ id: product._id, isAvailable: !product.isAvailable })}>
              {product.isAvailable ? 'Hide' : 'Show'}
            </Button>
          </article>
        ))}
      </div>
      <Pagination page={products.data?.pagination?.page} pages={products.data?.pagination?.pages} onPage={setPage} />
    </div>
  )
}

export function CategoriesPage() {
  useAdminMeta('Categories')
  const toast = useToast()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const categories = useQuery({ queryKey: ['admin-categories'], queryFn: adminApi.categories })
  const create = useMutation({
    mutationFn: () => adminApi.createCategory({ name }),
    onSuccess: () => {
      setName('')
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    },
    onError: (error) => toast.error(error.message),
  })
  const remove = useMutation({
    mutationFn: adminApi.deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] }),
    onError: (error) => toast.error(error.message),
  })
  return (
    <div>
      <h1 className="text-2xl font-semibold">Categories</h1>
      <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); create.mutate() }}>
        <Field label="New category"><TextInput value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Button className="self-end" type="submit">Add</Button>
      </form>
      <ul className="mt-4 space-y-2">
        {(categories.data?.categories || []).map((category) => (
          <li key={category._id} className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-sm">
            {category.name}
            <Button variant="ghost" onClick={() => remove.mutate(category._id)}>Delete</Button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function DeliveryPartnersPage() {
  useAdminMeta('Delivery partners')
  const toast = useToast()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const partners = useQuery({ queryKey: ['admin-partners', status], queryFn: () => adminApi.partners(status || undefined) })
  const decide = useMutation({
    mutationFn: ({ id, action }) => adminApi.decidePartner(id, { action }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-partners'] }),
    onError: (error) => toast.error(error.message),
  })
  return (
    <div>
      <h1 className="text-2xl font-semibold">Delivery partners</h1>
      <p className="mt-1 text-sm text-muted">Approve applicants before they can go online. This demo does not collect identity documents.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {['', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'].map((item) => (
          <button key={item || 'all'} type="button" className={`rounded-lg border px-3 py-2 text-sm ${status === item ? 'bg-ink text-white' : 'border-line bg-white'}`} onClick={() => setStatus(item)}>
            {item ? formatStatus(item) : 'All'}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-2 text-sm">
        {(partners.data?.partners || []).map((partner) => {
          const current = partner.partnerProfile?.partnerStatus || 'PENDING'
          return (
            <article key={partner._id} className="rounded-xl border border-line bg-white px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{partner.name}</p>
                  <p className="text-muted">{partner.email} · {partner.phone}</p>
                  <p className="text-muted">{partner.partnerProfile?.area}, {partner.partnerProfile?.city} · {formatStatus(current)} · {partner.isOnline ? 'Online' : 'Offline'}</p>
                  <p className="text-muted">{partner.deliveries} deliveries · {formatINR(partner.earnings)} · {partner.partnerProfile?.payoutLabel || 'Demo payout profile'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {current !== 'APPROVED' ? <Button onClick={() => decide.mutate({ id: partner._id, action: current === 'SUSPENDED' ? 'reactivate' : 'approve' })}>{current === 'SUSPENDED' ? 'Reactivate' : 'Approve'}</Button> : null}
                  {current === 'PENDING' ? <Button variant="danger" onClick={() => decide.mutate({ id: partner._id, action: 'reject' })}>Reject</Button> : null}
                  {current === 'APPROVED' ? <Button variant="danger" onClick={() => decide.mutate({ id: partner._id, action: 'suspend' })}>Suspend</Button> : null}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export function ReviewsPage() {
  useAdminMeta('Reviews')
  const queryClient = useQueryClient()
  const reviews = useQuery({ queryKey: ['admin-reviews'], queryFn: adminApi.reviews })
  const remove = useMutation({
    mutationFn: adminApi.deleteReview,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  })
  return (
    <div>
      <h1 className="text-2xl font-semibold">Reviews</h1>
      <div className="mt-4 space-y-2">
        {(reviews.data?.reviews || []).map((review) => (
          <article key={review._id} className="rounded-xl border border-line bg-white p-4 text-sm">
            <p className="font-medium">{review.shop?.name} · {review.rating}/5</p>
            <p>{review.comment}</p>
            <p className="text-muted">{review.customer?.name}</p>
            <Button className="mt-2" variant="ghost" onClick={() => remove.mutate(review._id)}>Remove</Button>
          </article>
        ))}
      </div>
    </div>
  )
}

export function ReportsPage() {
  useAdminMeta('Reports')
  const reports = useQuery({ queryKey: ['admin-reports'], queryFn: adminApi.reports })
  const data = reports.data
  if (!data) return <p className="text-sm text-muted">Loading reports…</p>
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reports</h1>
      <p className="text-sm text-muted">Figures come from orders stored in this database. GMV counts delivered and picked-up orders only.</p>
      <p className="text-2xl font-semibold">{formatINR(data.gmv)} <span className="text-base font-normal text-muted">from {data.orders} orders</span></p>
      <div className="h-56 rounded-2xl border border-line bg-white p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.revenueByDay}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="#111827" radius={4} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ul className="rounded-2xl border border-line bg-white p-4 text-sm">
          {data.byStatus.map((item) => <li key={item.status} className="flex justify-between py-1"><span>{formatStatus(item.status)}</span><span>{item.count}</span></li>)}
        </ul>
        <ul className="rounded-2xl border border-line bg-white p-4 text-sm">
          {data.topShops.map((item) => <li key={item.shop} className="flex justify-between py-1"><span>{item.shop}</span><span>{formatINR(item.revenue)}</span></li>)}
        </ul>
      </div>
    </div>
  )
}

export function AdminSettingsPage() {
  useAdminMeta('Settings')
  const settings = useQuery({ queryKey: ['admin-settings'], queryFn: adminApi.settings })
  const data = settings.data
  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>
      <dl className="mt-4 max-w-lg space-y-3 rounded-2xl border border-line bg-white p-5 text-sm">
        <div className="flex justify-between"><dt>Currency</dt><dd>{data?.currency}</dd></div>
        <div className="flex justify-between"><dt>Tax rate</dt><dd>{data?.taxRate}</dd></div>
        <div className="flex justify-between"><dt>Payments</dt><dd>Mock provider</dd></div>
        <div className="flex justify-between"><dt>Demo tracking</dt><dd>{data?.demoTracking ? 'On' : 'Off'}</dd></div>
      </dl>
      <p className="mt-3 max-w-lg text-sm text-muted">These values come from server environment variables. They are shown here so the marketplace configuration is visible, not edited in the browser.</p>
    </div>
  )
}
