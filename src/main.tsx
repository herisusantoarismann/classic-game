import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { RetroErrorBoundary } from './components/organisms/RetroErrorBoundary.tsx'
import { CrashTelemetryService } from './core/services/CrashTelemetryService.ts'

// Initialize client-side crash telemetry & unhandled error listeners
CrashTelemetryService.initGlobalListeners()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RetroErrorBoundary>
      <App />
    </RetroErrorBoundary>
  </StrictMode>,
)
