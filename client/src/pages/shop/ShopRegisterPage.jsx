import { useNavigate } from 'react-router-dom'
import { shopOwnerApi } from '../../services'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useToast } from '../../context/ToastContext'
import ShopApplication from '../../components/shop/ShopApplication'

export default function ShopRegisterPage() {
  usePageMeta('Register shop · NEARE')
  const navigate = useNavigate()
  const toast = useToast()

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Register your shop</h1>
      <p className="mt-2 mb-6 text-sm text-muted">
        Tell NEARE what you sell, where the shop is, and how customers can collect or receive an order. The shop stays pending until an admin approves it.
      </p>
      <ShopApplication
        onSubmit={async ({ shop }) => {
          await shopOwnerApi.register(shop)
          toast.success('Submitted for approval')
          navigate('/shop')
        }}
      />
    </div>
  )
}
