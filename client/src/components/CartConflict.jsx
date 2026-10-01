import Modal from './ui/Modal'
import Button from './ui/Button'

export default function CartConflict({ open, currentShop, nextShop, onKeep, onClear }) {
  const current = currentShop || 'another shop'
  const next = nextShop || 'the new shop'
  return (
    <Modal open={open} title="Start a new cart?" onClose={onKeep}>
      <p className="text-sm">Your cart contains items from {current}.</p>
      <p className="mt-2 text-sm text-muted">Start a new cart with {next}?</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onKeep}>Keep current cart</Button>
        <Button onClick={onClear}>Clear cart</Button>
      </div>
    </Modal>
  )
}
