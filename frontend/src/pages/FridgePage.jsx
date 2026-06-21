import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { HelpCircle, Bell, Sun, Moon, LogOut } from 'lucide-react'
import { getItems } from '../api/items'
import { getCategories } from '../api/categories'
import { logout, getUser } from '../api/auth'
import LocationGrid from '../components/LocationGrid'
import CategoryGrid from '../components/CategoryGrid'
import InventoryPreview from '../components/InventoryPreview'
import InventoryList from '../components/InventoryList'
import EmptyState from '../components/EmptyState'
import HelpModal from '../components/HelpModal'
import './FridgePage.css'

const CATEGORIES = [
  { name: 'Produce',      color: '#10b981' },
  { name: 'Meat',         color: '#ef4444' },
  { name: 'Eggs & Dairy', color: '#f59e0b' },
  { name: 'Pantry',       color: '#facc15' },
  { name: 'Deli',         color: '#8b5cf6' },
  { name: 'Freezer',      color: '#3b82f6' },
  { name: 'Leftovers',    color: '#ec4899' },
]

function FridgePage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [helpOpen, setHelpOpen] = useState(false)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [page, setPage] = useState(0)
  const swipeRef = useRef(null)
  const navigate = useNavigate()

  const user = getUser()

  const goToPage = (i) => {
    const el = swipeRef.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
    setPage(i)
  }

  const handleSwipeScroll = () => {
    const el = swipeRef.current
    if (!el) return
    const i = Math.round(el.scrollLeft / el.clientWidth)
    if (i !== page) setPage(i)
  }

  useEffect(() => {
    loadData()
    const seen = localStorage.getItem('helpSeen')
    if (!seen) {
      setHelpOpen(true)
      localStorage.setItem('helpSeen', 'true')
    }
  }, [])

  const loadData = async () => {
    try {
      const [itemsData, categoriesData] = await Promise.all([
        getItems().catch(err => { console.error('Error fetching items:', err); return [] }),
        getCategories().catch(err => { console.error('Error fetching categories:', err); return [] }),
      ])
      setItems(itemsData || [])
      setCategories(categoriesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      setItems([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const handleLogout = () => {
    if (window.confirm('Sign out of Spoiler Alert?')) {
      logout()
    }
  }

  const handleLocationClick = (location) => navigate(`/category/all?location=${location}`)
  const handleCategoryClick = (category) => navigate(`/category/${category}`)

  const getLocationCounts = () => {
    const counts = { fridge: 0, freezer: 0, pantry: 0 }
    items.forEach(item => {
      if (item.location === 'fridge') counts.fridge++
      else if (item.location === 'freezer') counts.freezer++
      else if (item.location === 'pantry') counts.pantry++
    })
    return [
      { name: 'fridge',  count: counts.fridge },
      { name: 'freezer', count: counts.freezer },
      { name: 'pantry',  count: counts.pantry },
    ]
  }

  if (loading) return <div className="loading">Loading...</div>

  if (items.length === 0) return <EmptyState onAddClick={() => navigate('/add')} />

  return (
    <div className="fridge-page">
      <header className="fridge-header">
        <div className="fridge-header-left">
          <h1>My Fridge</h1>
          {user && <p className="fridge-user">Hi, {user.name}</p>}
        </div>
        <div className="fridge-header-actions">
          <button
            className="header-icon-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            className="header-icon-btn"
            onClick={() => navigate('/notifications/settings')}
            title="Notification settings"
          >
            <Bell size={20} />
          </button>
          <button
            className="header-icon-btn"
            onClick={() => setHelpOpen(true)}
            title="Help & Tutorial"
          >
            <HelpCircle size={20} />
          </button>
          <button
            className="header-icon-btn"
            onClick={handleLogout}
            title="Sign out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="fridge-tabs">
        <button
          className={`fridge-tab ${page === 0 ? 'active' : ''}`}
          onClick={() => goToPage(0)}
        >
          Overview
        </button>
        <button
          className={`fridge-tab ${page === 1 ? 'active' : ''}`}
          onClick={() => goToPage(1)}
        >
          Inventory
        </button>
      </div>

      <div className="swipe-container" ref={swipeRef} onScroll={handleSwipeScroll}>
        {/* Page 1 — Overview dashboard */}
        <section className="swipe-page">
          <div className="fridge-content">
            <InventoryPreview
              items={items}
              totalCount={items.length}
              onViewAll={() => goToPage(1)}
            />

            <LocationGrid
              locationCounts={getLocationCounts()}
              onLocationClick={handleLocationClick}
            />

            <div className="category-section">
              <div className="category-section-title">Filter Inventory by Category</div>
              <CategoryGrid
                categories={CATEGORIES}
                categoryCounts={categories}
                onCategoryClick={handleCategoryClick}
              />
            </div>
          </div>
        </section>

        {/* Page 2 — Full inventory list, grouped by expiration */}
        <section className="swipe-page">
          <div className="fridge-content">
            <InventoryList items={items} onChanged={loadData} />
          </div>
        </section>
      </div>

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}

export default FridgePage
