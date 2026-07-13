import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

import { AuthProvider } from './contexts/AuthContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

import { ClerkProvider } from '@clerk/clerk-react'

const isClerkEnabled = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.includes('Zm9vYmFy') && !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.includes('disabled');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isClerkEnabled ? (
      <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <WorkspaceProvider>
                <App />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    style: {
                      background: '#1c2128',
                      color: '#e6edf3',
                      border: '1px solid #30363d',
                      borderRadius: '10px',
                      fontSize: '13px',
                    },
                  }}
                />
              </WorkspaceProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ClerkProvider>
    ) : (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <WorkspaceProvider>
              <App />
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: '#1c2128',
                    color: '#e6edf3',
                    border: '1px solid #30363d',
                    borderRadius: '10px',
                    fontSize: '13px',
                  },
                }}
              />
            </WorkspaceProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    )}
  </React.StrictMode>
)
