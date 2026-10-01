import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

export default function Modal({ open, title, children, onClose, className = 'max-w-md' }) {
  const reduce = useReducedMotion()
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-40 grid place-items-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close dialog"
            onMouseDown={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: 8 }}
            className={`relative z-10 w-full rounded-2xl border border-line bg-white p-5 shadow-sm ${className}`}
          >
            {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
            <div className={title ? 'mt-3' : ''}>{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
