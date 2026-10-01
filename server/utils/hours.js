export function kolkataMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0)
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0)
  return hour * 60 + minute
}

function toMinutes(value) {
  const [hour, minute] = String(value || '00:00').split(':').map(Number)
  return hour * 60 + minute
}

export function isShopOpen(shop, date = new Date()) {
  if (!shop || shop.isManuallyClosed) return false
  const now = kolkataMinutes(date)
  const open = toMinutes(shop.openingTime)
  const close = toMinutes(shop.closingTime)
  if (open === close) return true
  if (close > open) return now >= open && now < close
  return now >= open || now < close
}

export function withOpenFlag(shop) {
  const plain = typeof shop.toObject === 'function' ? shop.toObject() : { ...shop }
  plain.isOpen = isShopOpen(plain)
  return plain
}
