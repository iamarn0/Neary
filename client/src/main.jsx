import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LocationProvider } from './context/LocationContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 20_000,
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              <LocationProvider>
                <App />
              </LocationProvider>
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
