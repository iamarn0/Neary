export const DELIVERY_FLOW = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED']
export const PICKUP_FLOW = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'PICKED_UP']

const TRANSITIONS = {
  DELIVERY: {
    PLACED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
    ACCEPTED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY'],
    READY: ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
  },
  PICKUP: {
    PLACED: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
    ACCEPTED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY'],
    READY: ['PICKED_UP'],
  },
}

export function canTransition(method, from, to) {
  return (TRANSITIONS[method]?.[from] || []).includes(to)
}

export function flowFor(method) {
  if (method === 'PICKUP') return PICKUP_FLOW
  if (method === 'COUNTER') return ['BILLED']
  return DELIVERY_FLOW
}

export function isCompleted(status) {
  return status === 'DELIVERED' || status === 'PICKED_UP' || status === 'BILLED'
}

export function isTerminal(status) {
  return isCompleted(status) || status === 'CANCELLED' || status === 'REJECTED'
}
