import { useState } from 'react'

export default function Media({ src, alt, className = '', loading = 'lazy', decoding = 'async' }) {
  const [failed, setFailed] = useState(false)
  const [seen, setSeen] = useState(src)
  if (src !== seen) {
    setSeen(src)
    setFailed(false)
  }
  if (!src || failed) {
    return (
      <div className={`grid place-items-center bg-[#F3F1EC] text-sm font-medium text-muted ${className}`} role="img" aria-label={alt}>
        {alt?.slice(0, 1) || 'N'}
      </div>
    )
  }
  return <img src={src} alt={alt} loading={loading} decoding={decoding} className={`object-cover ${className}`} onError={() => setFailed(true)} />
}
