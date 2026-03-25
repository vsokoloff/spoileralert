import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import FridgePage from './pages/FridgePage'
import CategoryPage from './pages/CategoryPage'
import AddItemPage from './pages/AddItemPage'
import EditItemPage from './pages/EditItemPage'
import SPOYPage from './pages/SPOYPage'
import BottomNav from './components/BottomNav'
import TestPage from './TestPage'
import NotificationSettingsPage from './pages/NotificationSettingsPage'

function App() {
  // NEW: Check local storage for theme on startup and apply it to the whole app
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/test" element={<TestPage />} />
          <Route path="/" element={<FridgePage />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/add" element={<AddItemPage />} />
          <Route path="/edit/:id" element={<EditItemPage />} />
          <Route path="/spoy" element={<SPOYPage />} />
          <Route path="/notifications/settings" element={<NotificationSettingsPage />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  )
}

export default App