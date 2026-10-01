import { describe, expect, it } from 'vitest'
import { canTransition, isTerminal } from '../utils/orderMachine.js'

describe('order state machine', () => {
  it('allows the delivery flow and blocks finished orders from going backwards', () => {
    expect(canTransition('DELIVERY', 'PLACED', 'ACCEPTED')).toBe(true)
    expect(canTransition('DELIVERY', 'READY', 'OUT_FOR_DELIVERY')).toBe(true)
    expect(canTransition('DELIVERY', 'DELIVERED', 'PREPARING')).toBe(false)
    expect(canTransition('PICKUP', 'READY', 'PICKED_UP')).toBe(true)
    expect(canTransition('PICKUP', 'READY', 'OUT_FOR_DELIVERY')).toBe(false)
    expect(isTerminal('DELIVERED')).toBe(true)
    expect(isTerminal('PREPARING')).toBe(false)
  })
})
