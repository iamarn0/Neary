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

export function formatAgo(value) {
  const then = new Date(value).getTime()
  if (!Number.isFinite(then)) return ''
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function greeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
