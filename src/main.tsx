import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { UnitsProvider } from './contexts/UnitsContext'
import { PremiumProvider } from './contexts/PremiumContext'
import { PlannerProvider } from './contexts/PlannerContext'
import { purchaseService } from './services/purchaseService'
import App from './App.tsx'
import './index.css'

// Kick off RevenueCat configure immediately before React renders.
// This ensures the native iOS SDK singleton is fully ready long before
// any component calls getCustomerInfo(), getOfferings(), etc.
purchaseService.configureEarly();

// Disable browser's automatic scroll restoration
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PremiumProvider>
          <ToastProvider>
            <UnitsProvider>
              <PlannerProvider>
                <App />
              </PlannerProvider>
            </UnitsProvider>
          </ToastProvider>
        </PremiumProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
