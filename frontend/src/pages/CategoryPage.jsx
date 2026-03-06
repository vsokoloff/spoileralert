import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Edit, Trash2, CheckSquare, Square, SlidersHorizontal, X } from 'lucide-react'
import { getItems } from '../api/items'
import { getItemsByCategory } from '../api/categories'
import { deleteItem } from '../api/items'
import { getStatusColor, getStatusText, getCategoryColor } from '../utils/colors'
import './CategoryPage.css'

const SORT_OPTIONS = [
  { value: 'expiration_asc',  label: 'Expiring soonest' },
  { value: 'expiration_desc', label: 'Expiring latest' },
  { value: 'name_asc',        label: 'Name (A–Z)' },
  { value: 'name_desc',       label: 'Name (Z–A)' },
  { value: 'added_desc',      label: 'Recently added' },
]

const FILTER_CATEGORIES = ['All', 'Produce', 'Meat', 'Eggs & Dairy', 'Deli', 'Pantry', 'Freezer', 'Leftovers']
const FILTER_STATUS = ['All', 'Good', 'Expiring Soon', 'Expired']

function sortItems(items, sortBy) {
  const sorted = [...items]
  switch (sortBy) {
    case 'expiration_asc':
      return sorted.sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date))
    case 'expiration_desc':
      return sorted.sort((a, b) => new Date(b.expiration_date) - new Date(a.expiration_date))
    case 'name_asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name))
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name))
    case 'added_desc':
      return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    default:
      return sorted
  }
}

function filterItems(items, filterCategory, filterStatus) {
  return items.filter(item => {
    // Category filter
    if (filterCategory !== 'All' && item.category !== filterCategory) return false

    // Status filter
    if (filterStatus !== 'All') {
      const now = new Date()
      const exp = new Date(item.expiration_date)
      const daysLeft = Math.floor((exp - now) / (1000 * 60 * 60 * 24))
      if (filterStatus === 'Expired'      && daysLeft >= 0) return false
      if (filterStatus === 'Expiring Soon' && (daysLeft < 0 || daysLeft >= 7)) return false
      if (filterStatus === 'Good'         && daysLeft < 7) return false
    }

    return true
  })
}

function CategoryPage() {
  const { category } = useParams()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Sort & filter state
  const [showControls, setShowControls] = useState(false)
  const [sortBy, setSortBy] = useState('expiration_asc')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')

  // Bulk select state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const isAllPage = category === 'all'

  useEffect(() => {
    loadItems()
  }, [category])

  // Reset selection when leaving select mode
  useEffect(() => {
    if (!selectMode) setSelectedIds(new Set())
  }, [selectMode])

  const loadItems = async () => {
    setLoading(true)
    try {
      let data
      if (category === 'all') {
        const urlParams = new URLSearchParams(window.location.search)
        const location = urlParams.get('location')
        data = location ? await getItems({ location }) : await getItems()
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

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    if (!window.confirm(`Delete ${selectedIds.size} item${selectedIds.size !== 1 ? 's' : ''}?`)) return
    setBulkDeleting(true)
    try {
      await Promise.all([...selectedIds].map(id => deleteItem(id)))
      setSelectMode(false)
      loadItems()
    } catch (error) {
      console.error('Error bulk deleting:', error)
    } finally {
      setBulkDeleting(false)
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = (visibleItems) => {
    if (selectedIds.size === visibleItems.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(visibleItems.map(i => i.id)))
    }
  }

  const activeFilterCount = [
    filterCategory !== 'All',
    filterStatus !== 'All',
    sortBy !== 'expiration_asc',
  ].filter(Boolean).length

  const getPageTitle = () => {
    if (category === 'all') {
      const loc = new URLSearchParams(window.location.search).get('location')
      if (loc) return loc.charAt(0).toUpperCase() + loc.slice(1)
      return 'All Items'
    }
    return category
  }

  if (loading) return <div className="loading">Loading...</div>

  // Apply sort + filter
  const filtered = filterItems(items, filterCategory, filterStatus)
  const displayItems = sortItems(filtered, sortBy)

  return (
    <div className="category-page">
      <header className="category-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <h1>{getPageTitle()}</h1>
        <div className="header-actions">
          {isAllPage && (
            <button
              className={`icon-btn ${selectMode ? 'active' : ''}`}
              onClick={() => setSelectMode(m => !m)}
              title="Select items"
            >
              <CheckSquare size={20} />
            </button>
          )}
          {isAllPage && (
            <button
              className={`icon-btn ${activeFilterCount > 0 ? 'active' : ''}`}
              onClick={() => setShowControls(m => !m)}
              title="Sort & filter"
            >
              <SlidersHorizontal size={20} />
              {activeFilterCount > 0 && (
                <span className="filter-badge">{activeFilterCount}</span>
              )}
            </button>
          )}
        </div>
      </header>

      {/* Sort & Filter Panel */}
      {showControls && isAllPage && (
        <div className="controls-panel">
          <div className="controls-section">
            <p className="controls-label">Sort by</p>
            <div className="chip-row">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={`chip ${sortBy === opt.value ? 'chip-active' : ''}`}
                  onClick={() => setSortBy(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="controls-section">
            <p className="controls-label">Category</p>
            <div className="chip-row">
              {FILTER_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`chip ${filterCategory === cat ? 'chip-active' : ''}`}
                  onClick={() => setFilterCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="controls-section">
            <p className="controls-label">Status</p>
            <div className="chip-row">
              {FILTER_STATUS.map(s => (
                <button
                  key={s}
                  className={`chip ${filterStatus === s ? 'chip-active' : ''}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button
              className="reset-filters-btn"
              onClick={() => { setSortBy('expiration_asc'); setFilterCategory('All'); setFilterStatus('All') }}
            >
              <X size={14} /> Reset filters
            </button>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selectMode && (
        <div className="bulk-bar">
          <button
            className="bulk-select-all"
            onClick={() => toggleSelectAll(displayItems)}
          >
            {selectedIds.size === displayItems.length && displayItems.length > 0
              ? <CheckSquare size={18} />
              : <Square size={18} />
            }
            {selectedIds.size === displayItems.length && displayItems.length > 0
              ? 'Deselect all'
              : `Select all (${displayItems.length})`
            }
          </button>
          <div className="bulk-right">
            {selectedIds.size > 0 && (
              <button
                className="bulk-delete-btn"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
              >
                <Trash2 size={16} />
                {bulkDeleting ? 'Deleting...' : `Delete ${selectedIds.size}`}
              </button>
            )}
            <button className="bulk-cancel-btn" onClick={() => setSelectMode(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="category-content">
        {displayItems.length === 0 ? (
          <div className="empty-category">
            {filtered.length === 0 && items.length > 0
              ? <p>No items match your filters.</p>
              : <p>No items in {category} yet.</p>
            }
            {!selectMode && (
              <button className="add-btn" onClick={() => navigate('/add')}>
                <Plus size={20} /> Add Item
              </button>
            )}
          </div>
        ) : (
          <div className="items-list">
            {displayItems.map((item) => {
              const statusColor = getStatusColor(item.expiration_date)
              const statusText = getStatusText(item.expiration_date)
              const categoryColor = getCategoryColor(item.category)
              const isSelected = selectedIds.has(item.id)

              return (
                <div
                  key={item.id}
                  className={`item-card ${selectMode ? 'selectable' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={selectMode ? () => toggleSelect(item.id) : undefined}
                >
                  {/* Checkbox in select mode */}
                  {selectMode && (
                    <div className="item-checkbox">
                      {isSelected ? <CheckSquare size={20} color="var(--accent)" /> : <Square size={20} color="var(--text-secondary)" />}
                    </div>
                  )}

                  <div className="item-info">
                    <div className="item-header">
                      <h3>{item.name}</h3>
                      <span className={`status-dot ${statusColor}`} />
                    </div>
                    <p className="status-text">{statusText}</p>
                    <div className="item-meta">
                      <span
                        className="category-badge"
                        style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                      >
                        {item.category}
                      </span>
                      {item.shared_with && (
                        <span className="shared-badge">👤 {item.shared_with}</span>
                      )}
                      {item.quantity > 1 && (
                        <span className="quantity">Qty: {item.quantity}</span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons only when not in select mode */}
                  {!selectMode && (
                    <div className="item-actions">
                      <button className="action-btn edit" onClick={() => navigate(`/edit/${item.id}`)}>
                        <Edit size={18} />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {!selectMode && (
        <button className="floating-add-btn" onClick={() => navigate('/add')}>
          <Plus size={24} /> Add Item
        </button>
      )}
    </div>
  )
}

export default CategoryPage