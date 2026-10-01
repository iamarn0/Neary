import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shopOwnerApi } from '../../services'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useToast } from '../../context/ToastContext'
import { formatINR } from '../../lib/format'
import Media from '../../components/Media'
import Button from '../../components/ui/Button'
import { Field, TextInput } from '../../components/ui/Field'

function sellingPrice(product) {
  const sale = product.salePrice
  if (sale != null && sale !== '' && Number(sale) >= 0 && Number(sale) < Number(product.price)) return Number(sale)
  return Number(product.price)
}

const payments = [
  ['CASH', 'Cash'],
  ['UPI', 'UPI'],
  ['CARD', 'Card'],
]

export default function ShopBillPage() {
  usePageMeta('New order · NEARE')
  const toast = useToast()
  const queryClient = useQueryClient()
  const barcodeRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const inventory = useQuery({ queryKey: ['inventory'], queryFn: shopOwnerApi.inventory })
  const [quantities, setQuantities] = useState({})
  const [query, setQuery] = useState('')
  const [barcode, setBarcode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const products = inventory.data?.products || []

  const lines = useMemo(
    () => products
      .map((product) => ({ product, quantity: quantities[product._id] || 0 }))
      .filter((line) => line.quantity > 0),
    [products, quantities]
  )
  const total = lines.reduce((sum, line) => sum + sellingPrice(line.product) * line.quantity, 0)
  const needle = query.trim().toLowerCase()
  const matches = needle
    ? products.filter((product) => product.name.toLowerCase().includes(needle)).slice(0, 6)
    : []

  function stopScan() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setScanning(false)
  }

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
  }, [])

  function addProduct(product) {
    if (!product.isAvailable || product.stock < 1) {
      toast.error(`${product.name} is out of stock.`)
      return false
    }
    let added = false
    setQuantities((existing) => {
      const current = existing[product._id] || 0
      if (current >= product.stock) return existing
      added = true
      return { ...existing, [product._id]: current + 1 }
    })
    if (!added) toast.error(`Only ${product.stock} ${product.unit} of ${product.name} in stock.`)
    return added
  }

  function setQty(product, next) {
    const quantity = Math.max(0, Math.min(product.stock, next))
    setQuantities((current) => ({ ...current, [product._id]: quantity }))
  }

  function findBarcode(event) {
    event.preventDefault()
    const code = barcode.replace(/\s+/g, '')
    if (!code) return
    const product = products.find((item) => item.barcode && item.barcode.toLowerCase() === code.toLowerCase())
    if (!product) {
      toast.error('No product with that barcode.')
      return
    }
    if (addProduct(product)) {
      setBarcode('')
      setQuery('')
      barcodeRef.current?.focus()
    }
  }

  useEffect(() => {
    if (!scanning) return undefined
    const video = videoRef.current
    const stream = streamRef.current
    if (!video || !stream || !('BarcodeDetector' in window)) return undefined
    video.srcObject = stream
    let detector
    try {
      detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'] })
    } catch {
      detector = new window.BarcodeDetector()
    }
    let timer
    let stopped = false
    const watch = async () => {
      if (stopped || !streamRef.current) return
      if (video.readyState >= 2) {
        try {
          const codes = await detector.detect(video)
          const value = codes[0]?.rawValue?.replace(/\s+/g, '')
          if (value) {
            const product = products.find((item) => item.barcode && item.barcode.toLowerCase() === value.toLowerCase())
            stopScan()
            if (!product) toast.error('No product with that barcode.')
            else addProduct(product)
            return
          }
        } catch {
          // The frame was not readable. Keep looking.
        }
      }
      timer = setTimeout(watch, 250)
    }
    watch()
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [scanning, products])

  async function startScan() {
    if (!('BarcodeDetector' in window)) {
      toast.error('This browser has no camera scanner. Use a barcode scanner in the barcode field.')
      barcodeRef.current?.focus()
      return
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      setScanning(true)
    } catch {
      stopScan()
      toast.error('Allow the camera, or type the barcode.')
    }
  }

  const bill = useMutation({
    mutationFn: () => shopOwnerApi.createBill({
      customerName,
      customerPhone,
      paymentMethod,
      items: lines.map((line) => ({ product: line.product._id, quantity: line.quantity })),
    }),
    onSuccess: (result) => {
      toast.success(`${result.order.orderNumber} billed ${formatINR(result.order.total)}`)
      setQuantities({})
      setQuery('')
      setBarcode('')
      setCustomerName('')
      setCustomerPhone('')
      setPaymentMethod('CASH')
      stopScan()
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['shop-orders'] })
      queryClient.invalidateQueries({ queryKey: ['shop-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['shop-analytics'] })
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold">New order</h1>
      <p className="mt-1 text-sm text-muted">Search by name or scan a barcode. Only the products you add appear on the bill.</p>
      <div className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-4">
            <Field label="Product search">
              <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type a product name" autoComplete="off" />
            </Field>
            {needle ? (
              <ul className="mt-3 divide-y divide-line">
                {matches.length === 0 ? <li className="py-2 text-sm text-muted">No matching product.</li> : null}
                {matches.map((product) => (
                  <li key={product._id} className="flex items-center justify-between gap-3 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <Media src={product.image} alt="" className="h-10 w-10 shrink-0 rounded-lg" />
                      <div className="min-w-0">
                        <p className="truncate text-sm">{product.name}</p>
                        <p className="text-xs text-muted">{formatINR(sellingPrice(product))} · {product.unit} · Stock {product.stock}</p>
                      </div>
                    </div>
                    <Button className="px-3 py-2" disabled={product.stock < 1 || !product.isAvailable} onClick={() => addProduct(product)}>Add</Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <form className="rounded-2xl border border-line bg-white p-4" onSubmit={findBarcode}>
            <Field label="Barcode">
              <TextInput
                ref={barcodeRef}
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                placeholder="Scan or type a barcode"
                autoComplete="off"
                autoFocus
              />
            </Field>
            <div className="mt-3 flex gap-2">
              <Button type="submit">Find</Button>
              {scanning ? <Button type="button" variant="ghost" onClick={stopScan}>Stop camera</Button> : <Button type="button" variant="ghost" onClick={startScan}>Scan with camera</Button>}
            </div>
            {scanning ? <video ref={videoRef} className="mt-3 aspect-video w-full rounded-lg bg-ink object-cover" autoPlay muted playsInline /> : null}
          </form>
        </div>
        <form
          className="rounded-2xl border border-line bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!lines.length) return
            bill.mutate()
          }}
        >
          <h2 className="font-semibold">Bill</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {lines.length === 0 ? <li className="text-muted">No items yet.</li> : null}
            {lines.map((line) => (
              <li key={line.product._id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Media src={line.product.image} alt="" className="h-10 w-10 shrink-0 rounded-lg" />
                  <div className="min-w-0">
                    <p className="truncate">{line.product.name}</p>
                    <p className="text-xs text-muted">{formatINR(sellingPrice(line.product) * line.quantity)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="px-3 py-2" onClick={() => setQty(line.product, line.quantity - 1)} aria-label={`Remove one ${line.product.name}`}>−</Button>
                  <span className="w-6 text-center">{line.quantity}</span>
                  <Button variant="ghost" className="px-3 py-2" disabled={line.quantity >= line.product.stock} onClick={() => setQty(line.product, line.quantity + 1)} aria-label={`Add one ${line.product.name}`}>+</Button>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between border-t border-line pt-3 text-sm font-medium">
            <span>To collect</span>
            <span>{formatINR(total)}</span>
          </p>
          <div className="mt-4 grid gap-3">
            <Field label="Customer name">
              <TextInput value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Walk-in" />
            </Field>
            <Field label="Mobile">
              <TextInput value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value.replace(/[^\d]/g, '').slice(0, 10))} inputMode="numeric" placeholder="Optional" />
            </Field>
            <fieldset>
              <legend className="text-sm font-medium">Payment</legend>
              <div className="mt-2 flex gap-2">
                {payments.map(([value, name]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    className={`rounded-lg border px-3 py-2 text-sm ${paymentMethod === value ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <Button type="submit" className="mt-4 w-full" disabled={!lines.length || bill.isPending}>Create bill</Button>
        </form>
      </div>
    </div>
  )
}
