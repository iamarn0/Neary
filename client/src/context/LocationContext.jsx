import { createContext, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'neare.location'
const LocationContext = createContext(null)

function readSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function LocationProvider({ children }) {
  const [location, setLocationState] = useState(readSaved)

  const value = useMemo(() => ({
    location,
    setLocation(next) {
      setLocationState(next)
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      else localStorage.removeItem(STORAGE_KEY)
    },
  }), [location])

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocationSelection() {
  return useContext(LocationContext)
}
