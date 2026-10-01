export default function Button({ children, variant = 'primary', className = '', type = 'button', ...props }) {
  const styles = {
    primary: 'bg-ink text-white hover:bg-ink/90',
    brand: 'bg-brand text-white hover:bg-brand/90',
    ghost: 'bg-white text-ink border border-line hover:bg-canvas',
    danger: 'bg-white text-danger border border-danger/30 hover:bg-danger/5',
  }
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
