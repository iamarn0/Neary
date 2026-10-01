import { formatINR, formatStatus } from './format'

function money(value) {
  return (Number(value) || 0).toFixed(2)
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function billParty(order) {
  return {
    name: order.customer?.name || order.customerName || 'Walk-in',
    phone: order.customer?.phone || order.customerPhone || '',
  }
}

export function billWhen(order) {
  return new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

function pad(value, width, side = 'end') {
  const text = String(value)
  if (text.length >= width) return text.slice(0, width)
  return side === 'start' ? text.padStart(width) : text.padEnd(width)
}

export function receiptLines(shop, order) {
  const party = billParty(order)
  const lines = [
    shop?.name || 'NEARE',
    [shop?.address, shop?.city, shop?.state, shop?.pinCode].filter(Boolean).join(', '),
    [shop?.phone ? `Phone ${shop.phone}` : '', shop?.gstin ? `GSTIN ${shop.gstin}` : ''].filter(Boolean).join('  '),
    '',
    `Bill ${order.orderNumber}`,
    billWhen(order),
    `Customer  ${party.name}`,
  ]
  if (party.phone) lines.push(`Mobile    ${party.phone}`)
  lines.push(`${formatStatus(order.fulfillmentMethod)}  ·  ${formatStatus(order.paymentMethod)}  ·  ${formatStatus(order.paymentStatus)}`)
  lines.push('')
  lines.push(`${pad('Item', 24)}${pad('Qty', 6, 'start')}${pad('Rate', 10, 'start')}${pad('Amount', 12, 'start')}`)
  order.items.forEach((item) => {
    const name = item.unit ? `${item.name} (${item.unit})` : item.name
    lines.push(`${pad(name, 24)}${pad(item.quantity, 6, 'start')}${pad(money(item.price), 10, 'start')}${pad(money(item.price * item.quantity), 12, 'start')}`)
  })
  lines.push('')
  lines.push(`${pad('Subtotal', 40)}${pad(money(order.subtotal), 12, 'start')}`)
  if (order.deliveryFee) lines.push(`${pad('Delivery', 40)}${pad(money(order.deliveryFee), 12, 'start')}`)
  if (order.discount) lines.push(`${pad('Discount', 40)}${pad(money(order.discount), 12, 'start')}`)
  lines.push(`${pad('Tax', 40)}${pad(money(order.tax), 12, 'start')}`)
  lines.push(`${pad('Total', 40)}${pad(money(order.total), 12, 'start')}`)
  if (order.notes) lines.push('', order.notes)
  lines.push('', 'Thank you')
  return lines.filter((line) => line != null)
}

function receiptHtml(shop, order) {
  const party = billParty(order)
  const rows = order.items.map((item) => `
    <tr>
      <td>${escapeHtml(item.name)}${item.unit ? `<div class="muted">${escapeHtml(item.unit)}</div>` : ''}</td>
      <td class="right">${item.quantity}</td>
      <td class="right">${escapeHtml(formatINR(item.price))}</td>
      <td class="right">${escapeHtml(formatINR(item.price * item.quantity))}</td>
    </tr>`).join('')
  const extra = [
    ['Subtotal', order.subtotal],
    order.deliveryFee ? ['Delivery', order.deliveryFee] : null,
    order.discount ? ['Discount', order.discount] : null,
    ['Tax', order.tax],
  ].filter(Boolean)
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(order.orderNumber)}</title>
  <style>
    body { font-family: "Segoe UI", sans-serif; color: #111827; margin: 24px; }
    h1 { font-size: 20px; margin: 0; }
    p { margin: 2px 0; }
    .muted { color: #4b5563; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; font-size: 12px; color: #4b5563; border-bottom: 1px solid #e5e7eb; padding: 6px 0; }
    td { font-size: 14px; padding: 6px 0; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
    .right { text-align: right; }
    .total { font-size: 16px; font-weight: 650; }
  </style>
</head>
<body>
  <h1>${escapeHtml(shop?.name || 'NEARE')}</h1>
  <p class="muted">${escapeHtml([shop?.address, shop?.city, shop?.state, shop?.pinCode].filter(Boolean).join(', '))}</p>
  <p class="muted">${escapeHtml([shop?.phone, shop?.gstin ? `GSTIN ${shop.gstin}` : ''].filter(Boolean).join(' · '))}</p>
  <p style="margin-top:14px"><strong>${escapeHtml(order.orderNumber)}</strong></p>
  <p class="muted">${escapeHtml(billWhen(order))}</p>
  <p>${escapeHtml(party.name)}${party.phone ? ` · ${escapeHtml(party.phone)}` : ''}</p>
  <p class="muted">${escapeHtml(formatStatus(order.fulfillmentMethod))} · ${escapeHtml(formatStatus(order.paymentMethod))} · ${escapeHtml(formatStatus(order.paymentStatus))}</p>
  <table>
    <thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <table>
    ${extra.map(([label, value]) => `<tr><td>${label}</td><td class="right">${escapeHtml(formatINR(value))}</td></tr>`).join('')}
    <tr><td class="total">Total</td><td class="right total">${escapeHtml(formatINR(order.total))}</td></tr>
  </table>
  ${order.notes ? `<p class="muted" style="margin-top:12px">${escapeHtml(order.notes)}</p>` : ''}
  <p style="margin-top:16px">Thank you</p>
</body>
</html>`
}

export function printBill(shop, order) {
  const frame = document.createElement('iframe')
  frame.setAttribute('title', order.orderNumber)
  frame.style.position = 'fixed'
  frame.style.right = '0'
  frame.style.bottom = '0'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  frame.onload = () => {
    frame.contentWindow.focus()
    frame.contentWindow.print()
    setTimeout(() => frame.remove(), 1000)
  }
  document.body.appendChild(frame)
  const doc = frame.contentWindow.document
  doc.open()
  doc.write(receiptHtml(shop, order))
  doc.close()
}

function pdfEscape(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

export function buildPdf(lines) {
  const encoder = new TextEncoder()
  const text = [
    'BT',
    '/F1 10 Tf',
    '14 TL',
    '40 800 Td',
    `(${pdfEscape(lines[0] || '')}) Tj`,
    ...lines.slice(1).map((line) => `(${pdfEscape(line)}) '`),
    'ET',
  ].join('\n')
  const stream = encoder.encode(text)
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Count 1 /Kids [3 0 R] >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    null,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>',
  ]
  const chunks = []
  let size = 0
  const write = (value) => {
    const bytes = typeof value === 'string' ? encoder.encode(value) : value
    chunks.push(bytes)
    size += bytes.length
  }
  const offsets = [0]
  write('%PDF-1.4\n')
  objects.forEach((object, index) => {
    offsets.push(size)
    if (index === 3) {
      write(`4 0 obj\n<< /Length ${stream.length} >>\nstream\n`)
      write(stream)
      write('\nendstream\nendobj\n')
      return
    }
    write(`${index + 1} 0 obj\n${object}\nendobj\n`)
  })
  const xref = size
  write(`xref\n0 ${objects.length + 1}\n`)
  write('0000000000 65535 f \n')
  offsets.slice(1).forEach((offset) => write(`${String(offset).padStart(10, '0')} 00000 n \n`))
  write(`trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`)
  const pdf = new Uint8Array(size)
  let cursor = 0
  chunks.forEach((chunk) => {
    pdf.set(chunk, cursor)
    cursor += chunk.length
  })
  return pdf
}

export function downloadBill(shop, order) {
  const pdf = buildPdf(receiptLines(shop, order))
  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${order.orderNumber}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
