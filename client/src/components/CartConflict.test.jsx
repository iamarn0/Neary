import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import CartConflict from './CartConflict.jsx'

describe('CartConflict', () => {
  it('names both shops and keeps the current cart', () => {
    let kept = false
    render(
      <CartConflict
        open
        currentShop="FreshMart"
        nextShop="Bake House"
        onKeep={() => { kept = true }}
        onClear={() => {}}
      />
    )
    expect(screen.getByText(/FreshMart/)).toBeTruthy()
    expect(screen.getByText(/Bake House/)).toBeTruthy()
    screen.getByRole('button', { name: 'Keep current cart' }).click()
    expect(kept).toBe(true)
  })
})
