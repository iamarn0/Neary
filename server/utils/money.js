export function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

export function unitPrice(product) {
  const price = Number(product.price)
  const sale = product.salePrice
  if (sale != null && sale !== '' && Number(sale) >= 0 && Number(sale) < price) {
    return round2(sale)
  }
  return round2(price)
}

export function quoteTotals({ subtotal, distanceKm, fulfillment }) {
  const taxRate = Number(process.env.TAX_RATE || 0)
  const deliveryFee = fulfillment === 'DELIVERY' ? round2(20 + distanceKm * 8) : 0
  const tax = round2(subtotal * taxRate)
  const discount = 0
  const total = round2(subtotal + deliveryFee + tax - discount)
  return {
    subtotal: round2(subtotal),
    deliveryFee,
    tax,
    discount,
    total,
    distanceKm: round2(distanceKm),
    taxRate,
  }
}

export function etaRange(shop, distanceKm, fulfillment) {
  const prepMin = shop.prepTimeMin || 15
  const prepMax = shop.prepTimeMax || 30
  if (fulfillment === 'PICKUP') return { min: prepMin, max: prepMax }
  const travel = Math.max(5, Math.round((distanceKm / 18) * 60))
  return { min: prepMin + travel, max: prepMax + travel + 5 }
}
