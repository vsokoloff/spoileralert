import { Link, useLocation } from 'react-router-dom'
import { Home, Plus, MessageSquare } from 'lucide-react'
import './BottomNav.css'

function BottomNav() {
  const location = useLocation()
  
  return (
    <nav className="bottom-nav">
      <Link 
        to="/" 
        className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
      >
        <Home size={24} />
        <span>Fridge</span>
      </Link>
      <Link 
        to="/add" 
        className={`nav-item ${location.pathname === '/add' ? 'active' : ''}`}
      >
        <Plus size={24} />
        <span>Add</span>
      </Link>
      <Link 
        to="/spoy" 
        className={`nav-item ${location.pathname === '/spoy' ? 'active' : ''}`}
      >
        <MessageSquare size={24} />
        <span>SPOY</span>
      </Link>
    </nav>
  )
}

export default BottomNav
