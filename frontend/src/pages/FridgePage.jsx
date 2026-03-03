import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getItems } from '../api/items'
import { getCategories, getItemsByCategory } from '../api/categories'
import { getCategoryColor, getStatusColor } from '../utils/colors'
import LocationGrid from '../components/LocationGrid'
import CategoryGrid from '../components/CategoryGrid'
import InventoryPreview from '../components/InventoryPreview'
import EmptyState from '../components/EmptyState'
import './FridgePage.css'

const CATEGORIES = [
  { name: 'Deli', icon: '🥓', color: '#a78bfa' },
  { name: 'Eggs & Dairy', icon: '🥛', color: '#fbbf24' },
  { name: 'Produce', icon: '🥬', color: '#4ade80' },
  { name: 'Meat', icon: '🥩', color: '#f87171' },
  { name: 'Pantry', icon: '🌾', color: '#fbbf24' },
  { name: 'Leftovers', icon: '🍱', color: '#94a3b8' },
]

function FridgePage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [itemsData, categoriesData] = await Promise.all([
        getItems().catch(err => {
          console.error('Error fetching items:', err)
          return []
        }),
        getCategories().catch(err => {
          console.error('Error fetching categories:', err)
          return []
        })
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

  const handleLocationClick = (location) => {
    navigate(`/category/all?location=${location}`)
  }

  const handleCategoryClick = (category) => {
    navigate(`/category/${category}`)
  }

  // Get location counts
  const getLocationCounts = () => {
    const counts = {
      fridge: 0,
      freezer: 0,
      pantry: 0,
    }
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

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (items.length === 0) {
    return <EmptyState onAddClick={() => navigate('/add')} />
  }

  return (
    <div className="fridge-page">
      <header className="fridge-header">
        <h1>My Fridge</h1>
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
          <div className="category-section-title">Categories</div>
          <CategoryGrid 
            categories={CATEGORIES}
            categoryCounts={categories}
            onCategoryClick={handleCategoryClick}
          />
        </div>
      </div>
    </div>
  )
}

export default FridgePage
