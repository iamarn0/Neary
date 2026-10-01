import { useEffect, useRef, useState } from 'react'

export function useGeolocation({ watch = false, minInterval = 8000 } = {}) {
  const [status, setStatus] = useState('idle')
  const [coordinates, setCoordinates] = useState(null)
  const lastSent = useRef(0)

  function apply(position) {
    const now = Date.now()
    if (watch && now - lastSent.current < minInterval) return
    lastSent.current = now
    setCoordinates([position.coords.longitude, position.coords.latitude])
    setStatus('allowed')
  }

  function fail(error) {
    if (error?.code === 1) setStatus('denied')
    else if (error?.code === 3) setStatus('timeout')
    else setStatus('unavailable')
  }

  function request() {
    if (!navigator.geolocation) {
      setStatus('unsupported')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(apply, fail, { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 })
  }

  useEffect(() => {
    if (!watch) return undefined
    if (!navigator.geolocation) {
      setStatus('unsupported')
      return undefined
    }
    const id = navigator.geolocation.watchPosition(apply, fail, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 5000,
    })
    return () => navigator.geolocation.clearWatch(id)
  }, [watch, minInterval])

  return { status, coordinates, request }
}
