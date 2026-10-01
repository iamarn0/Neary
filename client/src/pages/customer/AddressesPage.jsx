import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addressApi } from '../../services'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useToast } from '../../context/ToastContext'
import AddressForm, { emptyAddress } from '../../components/AddressForm'
import Button from '../../components/ui/Button'

export default function AddressesPage() {
  usePageMeta('Addresses · NEARE')
  const toast = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyAddress)
  const [editing, setEditing] = useState(null)
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: addressApi.list })
  const save = useMutation({
    mutationFn: (payload) => (editing ? addressApi.update(editing, payload) : addressApi.create(payload)),
    onSuccess: () => {
      toast.success('Address saved')
      setForm(emptyAddress)
      setEditing(null)
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
    onError: (error) => toast.error(error.message),
  })
  const remove = useMutation({
    mutationFn: addressApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
    onError: (error) => toast.error(error.message),
  })

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h1 className="text-2xl font-semibold">Addresses</h1>
        <div className="mt-4 space-y-3">
          {(addresses.data?.addresses || []).map((address) => (
            <article key={address._id} className="rounded-2xl border border-line bg-white p-4 text-sm">
              <p className="font-medium">{address.fullName} {address.isDefault ? '· Default' : ''}</p>
              <p className="text-muted">{address.flat}, {address.building}, {address.area}, {address.city}, {address.state} {address.pinCode}</p>
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" onClick={() => {
                  setEditing(address._id)
                  setForm({
                    ...address,
                    longitude: address.location?.coordinates?.[0] ?? '',
                    latitude: address.location?.coordinates?.[1] ?? '',
                  })
                }}>Edit</Button>
                <Button variant="danger" onClick={() => remove.mutate(address._id)}>Delete</Button>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-line bg-white p-5">
        <h2 className="font-semibold">{editing ? 'Edit address' : 'New address'}</h2>
        <form className="mt-4" onSubmit={(event) => { event.preventDefault(); save.mutate(form) }}>
          <AddressForm value={form} onChange={setForm} />
          <Button className="mt-4" type="submit">Save address</Button>
        </form>
      </section>
    </div>
  )
}
