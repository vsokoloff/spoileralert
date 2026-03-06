import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HelpCircle, Bell } from 'lucide-react'
import { getItems } from '../api/items'
import { getCategories, getItemsByCategory } from '../api/categories'
import { getCategoryColor, getStatusColor } from '../utils/colors'
import LocationGrid from '../components/LocationGrid'
import CategoryGrid from '../components/CategoryGrid'
import InventoryPreview from '../components/InventoryPreview'
import EmptyState from '../components/EmptyState'
import HelpModal from '../components/HelpModal'
import './FridgePage.css'

const CATEGORIES = [
  { name: 'Produce',     color: '#10b981' },
  { name: 'Meat',        color: '#ef4444' },
  { name: 'Eggs & Dairy',color: '#f59e0b' },
  { name: 'Pantry',      color: '#facc15' },
  { name: 'Deli',        color: '#8b5cf6' },
  { name: 'Freezer',     color: '#3b82f6' },
  { name: 'Leftovers',   color: '#ec4899' },
]

function FridgePage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [helpOpen, setHelpOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
    // Show tutorial on first visit
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
        getCategories().catch(err => { console.error('Error fetching categories:', err); return [] })
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
      { name: 'fridge', count: counts.fridge },
      { name: 'freezer', count: counts.freezer },
      { name: 'pantry', count: counts.pantry },
    ]
  }

  if (loading) return <div className="loading">Loading...</div>

  if (items.length === 0) return <EmptyState onAddClick={() => navigate('/add')} />

  return (
    <div className="fridge-page">
      <header className="fridge-header">
        <h1>My Fridge</h1>
        <div className="fridge-header-actions">
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
        </div>
      </header>

      <div className="fridge-content">
        <InventoryPreview
          items={items}
          totalCount={items.length}
          onViewAll={() => navigate('/category/all')}
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

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}

export default FridgePage