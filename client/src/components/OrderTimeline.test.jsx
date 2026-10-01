import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import OrderTimeline from './OrderTimeline.jsx'

describe('OrderTimeline', () => {
  it('marks the current delivery step', () => {
    render(<OrderTimeline steps={['PLACED', 'ACCEPTED', 'PREPARING']} status="PREPARING" />)
    expect(screen.getByText('Preparing')).toBeTruthy()
    expect(screen.getByText(/current/)).toBeTruthy()
  })
})
