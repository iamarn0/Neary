import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shopApi, shopOwnerApi } from '../../services'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useToast } from '../../context/ToastContext'
import { formatINR } from '../../lib/format'
import Media from '../../components/Media'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Field, TextArea, TextInput } from '../../components/ui/Field'

const tone = { IN: 'text-success', LOW: 'text-brand', OUT: 'text-danger' }
const label = { IN: 'In stock', LOW: 'Low stock', OUT: 'Out of stock' }
const blank = { name: '', description: '', category: '', price: '', salePrice: '', unit: '', barcode: '', stock: '', lowStockThreshold: 5, isAvailable: true }

function sellingPrice(product) {
  const sale = product.salePrice
  if (sale != null && sale !== '' && Number(sale) >= 0 && Number(sale) < Number(product.price)) return Number(sale)
  return Number(product.price)
}

function AddQuantity({ product, pending, onAdd }) {
  const [quantity, setQuantity] = useState('')
  const value = Number(quantity)
  const ready = Number.isInteger(value) && value >= 1

  return (
    <form
      className="flex items-center justify-end gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (!ready) return
        onAdd(product._id, value, () => setQuantity(''))
      }}
    >
      <input
        aria-label={`Quantity to add for ${product.name}`}
        inputMode="numeric"
        min="1"
        step="1"
        value={quantity}
        onChange={(event) => setQuantity(event.target.value.replace(/[^\d]/g, ''))}
        placeholder="Qty"
        className="w-20 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none"
      />
      <Button type="submit" className="px-3 py-2" disabled={pending || !ready}>Add</Button>
    </form>
  )
}

export default function ShopInventoryPage() {
  usePageMeta('Inventory · NEARE')
  const toast = useToast()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState('')
  const previewUrl = useRef('')
  const fileRef = useRef(null)
  useEffect(() => () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
  }, [])
  const inventory = useQuery({ queryKey: ['inventory'], queryFn: shopOwnerApi.inventory })
  const categories = useQuery({ queryKey: ['categories'], queryFn: shopApi.categories })
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] })
    queryClient.invalidateQueries({ queryKey: ['shop-dashboard'] })
  }
  const add = useMutation({
    mutationFn: ({ id, quantity }) => shopOwnerApi.addStock(id, quantity),
    onSuccess: (result, variables) => {
      toast.success(`${result.product.name} is now ${result.product.stock}`)
      variables.clear()
      refresh()
    },
    onError: (error) => toast.error(error.message),
  })
  const save = useMutation({
    mutationFn: ({ id, payload }) => (id ? shopOwnerApi.updateProduct(id, payload) : shopOwnerApi.createProduct(payload)),
    onSuccess: () => {
      toast.success(editing ? 'Product updated' : 'Product added')
      setOpen(false)
      refresh()
    },
    onError: (error) => toast.error(error.message),
  })
  const remove = useMutation({
    mutationFn: shopOwnerApi.deleteProduct,
    onSuccess: () => {
      toast.success('Product removed')
      refresh()
    },
    onError: (error) => toast.error(error.message),
  })
  const set = (key) => (event) => setForm({ ...form, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value })
  const products = inventory.data?.products || []

  function showPreview(next) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    previewUrl.current = next.startsWith('blob:') ? next : ''
    setPreview(next)
  }

  function openCreate() {
    setEditing(null)
    setForm(blank)
    setImage(null)
    showPreview('')
    setOpen(true)
  }

  function openEdit(product) {
    setEditing(product._id)
    setForm({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      price: product.price,
      salePrice: product.salePrice ?? '',
      unit: product.unit,
      barcode: product.barcode || '',
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold,
      isAvailable: product.isAvailable,
    })
    setImage(null)
    showPreview(product.image || '')
    setOpen(true)
  }

  function onImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('The image must be under 2 MB.')
      event.target.value = ''
      return
    }
    setImage(file)
    showPreview(URL.createObjectURL(file))
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Inventory</h1>
          <p className="mt-1 text-sm text-muted">Add a product, or add the quantity that just came in.</p>
        </div>
        <Button onClick={openCreate}>Add product</Button>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Add quantity</th>
              <th className="px-4 py-3 text-right font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-b border-line last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Media src={product.image} alt={product.name} className="h-12 w-12 rounded-lg" />
                    <div>
                      <p>{product.name}</p>
                      <p className="text-xs text-muted">{formatINR(sellingPrice(product))} · {product.unit}{product.barcode ? ` · ${product.barcode}` : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{product.stock}</td>
                <td className={`px-4 py-3 ${tone[product.status]}`}>{label[product.status]}</td>
                <td className="px-4 py-3">
                  <AddQuantity
                    product={product}
                    pending={add.isPending && add.variables?.id === product._id}
                    onAdd={(id, quantity, clear) => add.mutate({ id, quantity, clear })}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" className="px-3 py-2" onClick={() => openEdit(product)}>Edit</Button>
                    <Button variant="danger" className="px-3 py-2" onClick={() => remove.mutate(product._id)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 ? <p className="px-4 py-6 text-sm text-muted">No products yet. Add the first one to start billing.</p> : null}
      </div>
      <section className="mt-8">
        <h2 className="font-semibold">Stock movements</h2>
        <ul className="mt-3 divide-y divide-line border border-line bg-white text-sm">
          {(inventory.data?.movements || []).map((movement) => (
            <li key={movement._id} className="flex flex-wrap justify-between gap-2 px-4 py-2">
              <span>{movement.product?.name || 'Product'} · {String(movement.type).toLowerCase().replace(/_/g, ' ')}</span>
              <span>{movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}</span>
            </li>
          ))}
          {!inventory.data?.movements?.length ? <li className="px-4 py-3 text-muted">Adjustments and reservations will show up here.</li> : null}
        </ul>
      </section>
      <Modal open={open} title={editing ? 'Edit product' : 'Add product'} onClose={() => setOpen(false)}>
        <form
          className="grid max-h-[70vh] gap-3 overflow-auto pr-1"
          onSubmit={(event) => {
            event.preventDefault()
            const payload = image ? { ...form, image } : form
            save.mutate({ id: editing, payload })
          }}
        >
          <div>
            <p className="text-sm font-medium">Product image</p>
            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-line bg-canvas p-3">
              {preview ? (
                <img src={preview} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-dashed border-line bg-white text-xs text-muted">None</div>
              )}
              <div className="min-w-0">
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onImage} className="sr-only" />
                <Button variant="ghost" className="bg-white px-3 py-2" onClick={() => fileRef.current?.click()}>
                  {preview ? 'Change image' : 'Add image'}
                </Button>
                <p className="mt-1.5 truncate text-xs text-muted">{image ? image.name : 'JPEG, PNG, or WebP, under 2 MB'}</p>
              </div>
            </div>
          </div>
          <Field label="Name"><TextInput value={form.name} onChange={set('name')} required /></Field>
          <Field label="Description"><TextArea value={form.description} onChange={set('description')} rows={2} /></Field>
          <Field label="Category">
            <select className="w-full rounded-lg border border-line px-3 py-2" value={form.category} onChange={set('category')} required>
              <option value="">Select</option>
              {(categories.data?.categories || []).map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
            </select>
          </Field>
          <Field label="Price"><TextInput value={form.price} onChange={set('price')} inputMode="decimal" required /></Field>
          <Field label="Sale price"><TextInput value={form.salePrice ?? ''} onChange={set('salePrice')} inputMode="decimal" /></Field>
          <Field label="Unit"><TextInput value={form.unit} onChange={set('unit')} required /></Field>
          <Field label="Barcode"><TextInput value={form.barcode} onChange={set('barcode')} placeholder="Optional" /></Field>
          <Field label="Stock"><TextInput value={form.stock} onChange={set('stock')} inputMode="numeric" required /></Field>
          <Field label="Low stock threshold"><TextInput value={form.lowStockThreshold} onChange={set('lowStockThreshold')} inputMode="numeric" /></Field>
          <label className="text-sm"><input type="checkbox" checked={Boolean(form.isAvailable)} onChange={set('isAvailable')} /> Available</label>
          <Button type="submit" disabled={save.isPending}>Save</Button>
        </form>
      </Modal>
    </div>
  )
}
