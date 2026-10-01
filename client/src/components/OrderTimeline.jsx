import { formatStatus } from '../lib/format'

export default function OrderTimeline({ steps = [], status }) {
  const terminal = ['CANCELLED', 'REJECTED'].includes(status)
  const currentIndex = steps.indexOf(status)
  return (
    <ol className="space-y-3">
      {terminal ? (
        <li className="text-sm font-medium text-danger">{formatStatus(status)}</li>
      ) : null}
      {steps.map((step, index) => {
        const done = currentIndex >= index && !terminal
        const current = currentIndex === index && !terminal
        return (
          <li key={step} className="flex items-center gap-3 text-sm">
            <span
              className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] ${
                done ? 'border-ink bg-ink text-white' : 'border-line text-transparent'
              }`}
              aria-hidden="true"
            >
              ✓
            </span>
            <span className={current ? 'font-semibold' : done ? 'text-ink' : 'text-muted'}>
              {formatStatus(step)}
              {current ? <span className="sr-only">, current</span> : null}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
