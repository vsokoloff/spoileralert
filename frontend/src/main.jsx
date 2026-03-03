import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

// Verify root element exists
const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ Root element not found! Check index.html')
  document.body.innerHTML = '<div style="padding:40px;color:red;font-size:24px;">❌ Error: Root element not found. Check index.html</div>'
} else {
  console.log('✅ Root element found, rendering app...')
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
}
