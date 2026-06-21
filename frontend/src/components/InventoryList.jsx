import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, Trash2, Plus } from 'lucide-react'
import { getStatusColor, getStatusText, getCategoryColor } from '../utils/colors'
import { deleteItem } from '../api/items'
import './InventoryList.css'

const LOCATIONS = ['All', 'Fridge', 'Freezer', 'Pantry']
const CATEGORIES = ['All', 'Produce', 'Meat', 'Eggs & Dairy', 'Deli', 'Pantry', 'Freezer', 'Leftovers']

// Expiration buckets, in display order (soonest/most urgent first).
const BUCKETS = [
  { key: 'expired', label: 'Expired' },
  { key: 'soon',    label: 'Expiring soon' },   // < 3 days
  { key: 'week',    label: 'This week' },        // 3–6 days
  { key: 'good',    label: 'Still good' },        // 7+ days
]

function daysLeft(date) {
  if (!date) return Infinity
  return Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24))
}

function bucketOf(item) {
  const d = daysLeft(item.expiration_date)
  if (d < 0) return 'expired'
  if (d < 3) return 'soon'
  if (d < 7) return 'week'
  return 'good'
}

function InventoryList({ items, onChanged }) {
  const navigate = useNavigate()
  const [loc, setLoc] = useState('All')
  const [cat, setCat] = useState('All')

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return
    try {
      await deleteItem(id)
      if (onChanged) onChanged()
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const filtered = items.filter((it) => {
    if (loc !== 'All' && it.location !== loc.toLowerCase()) return false
    if (cat !== 'All' && it.category !== cat) return false
    return true
  })

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.expiration_date) - new Date(b.expiration_date)
  )

  const grouped = BUCKETS
    .map((b) => ({ ...b, items: sorted.filter((it) => bucketOf(it) === b.key) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="inventory-list">
      <div className="inv-filters">
        <div className="inv-chip-row">
          {LOCATIONS.map((l) => (
            <button
              key={l}
              className={`inv-chip ${loc === l ? 'active' : ''}`}
              onClick={() => setLoc(l)}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="inv-chip-row">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`inv-chip ${cat === c ? 'active' : ''}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="inv-empty">No items match these filters.</div>
      ) : (
        grouped.map((group) => (
          <div key={group.key} className="inv-group">
            <div className={`inv-group-title bucket-${group.key}`}>
              {group.label}
              <span className="inv-count">{group.items.length}</span>
            </div>
            {group.items.map((item) => {
              const statusColor = getStatusColor(item.expiration_date)
              const categoryColor = getCategoryColor(item.category)
              return (
                <div key={item.id} className="inv-item">
                  <span className={`status-dot ${statusColor}`} />
                  <div className="inv-item-info">
                    <div className="inv-item-name">{item.name}</div>
                    <div className="inv-item-sub">{getStatusText(item.expiration_date)}</div>
                    <div className="inv-item-meta">
                      <span
                        className="inv-cat-badge"
                        style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                      >
                        {item.category}
                      </span>
                      {item.quantity > 1 && <span className="inv-qty">×{item.quantity}</span>}
                    </div>
                  </div>
                  <div className="inv-actions">
                    <button
                      className="inv-action"
                      onClick={() => navigate(`/edit/${item.id}`)}
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="inv-action delete"
                      onClick={() => handleDelete(item.id)}
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ))
      )}

      <button className="inv-add-btn" onClick={() => navigate('/add')}>
        <Plus size={20} /> Add Item
      </button>
    </div>
  )
}

export default InventoryList
