function motionOk() {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function attachHover(element) {
  if (!motionOk()) return
  element.style.transition = 'transform 160ms ease'
  element.addEventListener('mouseenter', () => {
    element.style.zIndex = '4'
    element.style.transform = 'translateY(-3px) scale(1.08)'
  })
  element.addEventListener('mouseleave', () => {
    element.style.zIndex = element.dataset.z || ''
    element.style.transform = ''
  })
}

export function markerElement(item) {
  const element = document.createElement('div')
  const name = item.ariaLabel || item.label || 'Marker'
  element.setAttribute('aria-label', name)
  if (item.label) element.title = item.label
  if (item.zIndex) {
    element.dataset.z = String(item.zIndex)
    element.style.zIndex = String(item.zIndex)
  }

  if (item.variant === 'dot' || item.variant === 'you' || item.variant === 'rider') {
    if (item.variant === 'you') {
      element.className = 'grid h-8 place-items-center rounded-full border-2 border-white bg-[#E85D04] px-2 text-[10px] font-semibold tracking-wide text-white'
      element.textContent = 'You'
    } else if (item.variant === 'rider') {
      element.className = 'h-4 w-4 rounded-full border-2 border-white bg-[#2563EB]'
      if (item.pulse && motionOk()) {
        element.animate(
          [{ boxShadow: '0 0 0 0 rgba(37,99,235,0.45)' }, { boxShadow: '0 0 0 12px rgba(37,99,235,0)' }],
          { duration: 1600, iterations: Infinity },
        )
      }
    } else {
      element.className = 'h-3.5 w-3.5 rounded-full border-2 border-white'
      element.style.background = item.color || '#111827'
    }
    attachHover(element)
    return element
  }

  if (item.variant === 'index') {
    element.className = 'inline-flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white px-1.5 text-[11px] font-semibold text-white shadow-sm'
    element.style.background = item.color || '#111827'
    element.textContent = String(item.index ?? '')
    if (item.active && item.label) {
      const name = document.createElement('span')
      name.textContent = item.label
      name.className = 'pointer-events-none ml-1 max-w-[8.5rem] truncate pr-1 font-medium'
      element.appendChild(name)
      element.style.zIndex = '5'
    }
    element.addEventListener('click', (event) => {
      event.stopPropagation()
      item.onClick?.()
    })
    return element
  }

  element.className = 'rounded-full border-2 border-white px-2 py-1 text-[11px] font-semibold text-white shadow-sm'
  element.style.background = item.color || '#111827'
  element.textContent = item.label || ''
  if (item.variant === 'place') attachHover(element)
  return element
}

export default function MapMarker() {
  return null
}
