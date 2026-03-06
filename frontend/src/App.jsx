import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import FridgePage from './pages/FridgePage'
import CategoryPage from './pages/CategoryPage'
import AddItemPage from './pages/AddItemPage'
import EditItemPage from './pages/EditItemPage'
import SPOYPage from './pages/SPOYPage'
import BottomNav from './components/BottomNav'
import TestPage from './TestPage'
import NotificationSettingsPage from './pages/NotificationSettingsPage'  // ADD THIS


function App() {
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
          <Route path="/notifications/settings" element={<NotificationSettingsPage />} />  {/* ADD THIS */}

        </Routes>
        <BottomNav />
      </div>
    </Router>
  )
}

export default App
