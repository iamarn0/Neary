import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shopApi, shopOwnerApi } from '../../services'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useToast } from '../../context/ToastContext'
import LocationPicker from '../../components/maps/LocationPicker'
import Button from '../../components/ui/Button'
import { Field, TextArea, TextInput } from '../../components/ui/Field'

export default function ShopSettingsPage() {
  usePageMeta('Shop settings · NEARE')
  const toast = useToast()
  const queryClient = useQueryClient()
  const shop = useQuery({ queryKey: ['my-shop'], queryFn: shopOwnerApi.mine })
  const categories = useQuery({ queryKey: ['categories'], queryFn: shopApi.categories })
  const [form, setForm] = useState(null)
  useEffect(() => {
    if (!shop.data?.shop || form) return
    const record = shop.data.shop
    setForm({
      ...record,
      category: record.category?._id || record.category,
      longitude: record.location?.coordinates?.[0],
      latitude: record.location?.coordinates?.[1],
    })
  }, [shop.data, form])
  const save = useMutation({
    mutationFn: () => shopOwnerApi.update(form),
    onSuccess: () => {
      toast.success('Shop updated')
      queryClient.invalidateQueries({ queryKey: ['my-shop'] })
    },
    onError: (error) => toast.error(error.message),
  })
  if (!form) return <p className="text-sm text-muted">Loading shop…</p>
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value })

  return (
    <form className="max-w-3xl space-y-3" onSubmit={(event) => { event.preventDefault(); save.mutate() }}>
      <h1 className="text-2xl font-semibold">Shop settings</h1>
      <Field label="Name"><TextInput value={form.name} onChange={set('name')} /></Field>
      <Field label="Description"><TextArea value={form.description} onChange={set('description')} rows={3} /></Field>
      <Field label="Category">
        <select className="w-full rounded-lg border border-line px-3 py-2" value={form.category || ''} onChange={set('category')}>
          {(categories.data?.categories || []).map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
        </select>
      </Field>
      <Field label="Address"><TextInput value={form.address} onChange={set('address')} /></Field>
      <Field label="GSTIN"><TextInput value={form.gstin || ''} onChange={set('gstin')} /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Opens"><TextInput type="time" value={form.openingTime} onChange={set('openingTime')} /></Field>
        <Field label="Closes"><TextInput type="time" value={form.closingTime} onChange={set('closingTime')} /></Field>
      </div>
      <label className="block text-sm"><input type="checkbox" checked={Boolean(form.pickupAvailable)} onChange={set('pickupAvailable')} /> Pickup available</label>
      <label className="block text-sm"><input type="checkbox" checked={Boolean(form.deliveryAvailable)} onChange={set('deliveryAvailable')} /> Delivery available</label>
      <label className="block text-sm"><input type="checkbox" checked={Boolean(form.isManuallyClosed)} onChange={set('isManuallyClosed')} /> Closed for now</label>
      <LocationPicker
        value={form.longitude != null ? [Number(form.longitude), Number(form.latitude)] : null}
        onChange={([longitude, latitude]) => setForm({ ...form, longitude, latitude })}
      />
      <Button type="submit">Save shop</Button>
    </form>
  )
}
