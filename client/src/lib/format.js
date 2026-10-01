export function formatINR(value) {
  const amount = Number(value) || 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}

export function formatDistance(km) {
  const value = Number(km)
  if (!Number.isFinite(value)) return ''
  if (value < 1) return `${Math.round(value * 1000)} m`
  return `${(Math.round(value * 10) / 10).toFixed(1)} km`
}

export function formatStatus(status) {
  return String(status || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
