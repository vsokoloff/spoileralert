import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react'
import { getItems } from '../api/items'
import { getItemsByCategory } from '../api/categories'
import { deleteItem } from '../api/items'
import { getStatusColor, getStatusText, getCategoryColor } from '../utils/colors'
import './CategoryPage.css'

function CategoryPage() {
  const { category } = useParams()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadItems()
  }, [category])

  const loadItems = async () => {
    try {
      let data
      if (category === 'all') {
        // Check for location filter in URL
        const urlParams = new URLSearchParams(window.location.search)
        const location = urlParams.get('location')
        if (location) {
          data = await getItems({ location })
        } else {
          data = await getItems()
        }
      } else {
        data = await getItemsByCategory(category)
      }
      setItems(data)
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id)
        loadItems()
      } catch (error) {
        console.error('Error deleting item:', error)
      }
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="category-page">
      <header className="category-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <h1>
          {category === 'all' 
            ? (new URLSearchParams(window.location.search).get('location') 
                ? `${new URLSearchParams(window.location.search).get('location').charAt(0).toUpperCase() + new URLSearchParams(window.location.search).get('location').slice(1)}` 
                : 'All Items')
            : category}
        </h1>
        <div style={{ width: 24 }} /> {/* Spacer */}
      </header>

      <div className="category-content">
        {items.length === 0 ? (
          <div className="empty-category">
            <p>No items in {category} yet.</p>
            <button className="add-btn" onClick={() => navigate('/add')}>
              <Plus size={20} />
              Add {category}
            </button>
          </div>
        ) : (
          <div className="items-list">
            {items.map((item) => {
              const statusColor = getStatusColor(item.expiration_date, item.location)
              const statusText = getStatusText(item.expiration_date)
              const categoryColor = getCategoryColor(item.category)
              
              return (
                <div key={item.id} className="item-card">
                  <div className="item-info">
                    <div className="item-header">
                      <h3>{item.name}</h3>
                      <span 
                        className="status-dot"
                        style={{ backgroundColor: `var(--${statusColor})` }}
                      />
                    </div>
                    <p className="status-text">{statusText}</p>
                    <div className="item-meta">
                      <span className="category-badge" style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}>
                        {item.category}
                      </span>
                      <span className="category-badge" style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}>
                        {item.category}
                      </span>
                      {/* NEW: Display the tag if it exists */}
                      {item.shared_with && (
                        <span className="shared-badge" style={{ backgroundColor: '#f3f4f6', color: '#4b5563', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>
                          👤 {item.shared_with}
                        </span>
                      )}
                      {item.quantity > 1 && (
                        <span className="quantity">Qty: {item.quantity}</span>
                      )}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button 
                      className="action-btn edit"
                      onClick={() => navigate(`/edit/${item.id}`)}
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <button className="floating-add-btn" onClick={() => navigate('/add')}>
        <Plus size={24} />
        Add Item
      </button>
    </div>
  )
}

export default CategoryPage
