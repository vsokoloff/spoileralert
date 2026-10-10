import { useEffect } from 'react'
// HashRouter: the app runs from the local filesystem inside Capacitor's
// webview, where there is no server to rewrite deep paths to index.html —
// hash-based routing works everywhere without rewrites.
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import FridgePage from './pages/FridgePage'
import CategoryPage from './pages/CategoryPage'
import AddItemPage from './pages/AddItemPage'
import EditItemPage from './pages/EditItemPage'
import SPOYPage from './pages/SPOYPage'
import NotificationSettingsPage from './pages/NotificationSettingsPage'
import NotificationsPage from './pages/NotificationsPage'
import CategoryColorsPage from './pages/CategoryColorsPage'
import LoginPage from './pages/LoginPage'
import BottomNav from './components/BottomNav'
import { isLoggedIn, getMe } from './api/auth'
import { setLocalCategoryColors } from './utils/colors'

// ── Protected route — redirects to /login if not authenticated ────────────────
function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }
  return children
}

// ── Bottom nav, re-evaluated on every navigation ──────────────────────────────
// useLocation makes this re-render on route changes, so the nav appears
// immediately after login (App itself never re-renders on navigate()).
function BottomNavGate() {
  const location = useLocation()
  if (!isLoggedIn() || location.pathname === '/login') return null
  return <BottomNav />
}

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    document.documentElement.setAttribute('data-theme', savedTheme)

    // Refresh category colors from the server so they sync across devices.
    if (isLoggedIn()) {
      getMe()
        .then((me) => {
          if (me?.category_colors) setLocalCategoryColors(me.category_colors)
        })
        .catch(() => { /* offline or not authed — keep cached colors */ })
    }
  }, [])

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><FridgePage /></ProtectedRoute>} />
          <Route path="/category/:category" element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
          <Route path="/add" element={<ProtectedRoute><AddItemPage /></ProtectedRoute>} />
          <Route path="/edit/:id" element={<ProtectedRoute><EditItemPage /></ProtectedRoute>} />
          <Route path="/spoy" element={<ProtectedRoute><SPOYPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/notifications/settings" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
          <Route path="/settings/colors" element={<ProtectedRoute><CategoryColorsPage /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Only show bottom nav when logged in */}
        <BottomNavGate />
      </div>
    </Router>
  )
}

export default App
