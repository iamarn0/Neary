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
  const [pickerToken, setPickerToken] = useState(0)

  const value = useMemo(() => ({
    location,
    pickerToken,
    openPicker() {
      setPickerToken((token) => token + 1)
    },
    setLocation(next) {
      setLocationState(next)
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      else localStorage.removeItem(STORAGE_KEY)
    },
  }), [location, pickerToken])

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocationSelection() {
  return useContext(LocationContext)
}
