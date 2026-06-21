import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import FridgePage from './pages/FridgePage'
import CategoryPage from './pages/CategoryPage'
import AddItemPage from './pages/AddItemPage'
import EditItemPage from './pages/EditItemPage'
import SPOYPage from './pages/SPOYPage'
import NotificationSettingsPage from './pages/NotificationSettingsPage'
import CategoryColorsPage from './pages/CategoryColorsPage'
import LoginPage from './pages/LoginPage'
import BottomNav from './components/BottomNav'
import TestPage from './TestPage'
import { isLoggedIn, getMe } from './api/auth'
import { setLocalCategoryColors } from './utils/colors'

// ── Protected route — redirects to /login if not authenticated ────────────────
function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />
  }
  return children
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
          <Route path="/test" element={<TestPage />} />

          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><FridgePage /></ProtectedRoute>} />
          <Route path="/category/:category" element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
          <Route path="/add" element={<ProtectedRoute><AddItemPage /></ProtectedRoute>} />
          <Route path="/edit/:id" element={<ProtectedRoute><EditItemPage /></ProtectedRoute>} />
          <Route path="/spoy" element={<ProtectedRoute><SPOYPage /></ProtectedRoute>} />
          <Route path="/notifications/settings" element={<ProtectedRoute><NotificationSettingsPage /></ProtectedRoute>} />
          <Route path="/settings/colors" element={<ProtectedRoute><CategoryColorsPage /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Only show bottom nav when logged in */}
        {isLoggedIn() && <BottomNav />}
      </div>
    </Router>
  )
}

export default App
