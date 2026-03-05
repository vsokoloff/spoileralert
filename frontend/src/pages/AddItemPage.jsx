import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, FileText, Trash2 } from 'lucide-react'
import { createItem } from '../api/items'
import { scanReceipt, confirmReceiptItems } from '../api/receipt'
import './AddItemPage.css'

const CATEGORIES = ['Deli', 'Eggs & Dairy', 'Produce', 'Freezer', 'Pantry', 'Meat', 'Leftovers']
const LOCATIONS = ['fridge', 'freezer', 'pantry']

// Shelf life in days, mirrored from expiration_db.py.
// Used to auto-calculate expiration date when user picks a suggestion.
const SHELF_LIFE_DAYS = {
  // Produce
  'Apple': 30, 'Banana': 7, 'Orange': 14, 'Lettuce': 7, 'Spinach': 5,
  'Carrot': 21, 'Tomato': 7, 'Onion': 60, 'Potato': 30, 'Broccoli': 7,
  'Cauliflower': 7, 'Cucumber': 7, 'Bell Pepper': 7, 'Mushroom': 7,
  'Avocado': 5, 'Strawberry': 5, 'Blueberry': 7, 'Grapes': 7,
  // Eggs & Dairy
  'Milk': 7, 'Eggs': 21, 'Cheese': 14, 'Feta': 7, 'Yogurt': 14,
  'Butter': 30, 'Cream': 7, 'Sour Cream': 14, 'Cottage Cheese': 7,
  // Meat
  'Chicken': 2, 'Beef': 3, 'Pork': 3, 'Fish': 2, 'Salmon': 2,
  'Ground Beef': 2, 'Turkey': 2, 'Bacon': 7, 'Sausage': 2,
  // Deli
  'Deli Meat': 5, 'Ham': 5, 'Turkey Breast': 5, 'Salami': 7,
  // Pantry
  'Rice': 180, 'Pasta': 365, 'Flour': 365, 'Sugar': 730,
  'Bread': 7, 'Cereal': 180, 'Oats': 365,
  // Leftovers
  'Leftovers': 3,
}

// Full item metadata for autocomplete
const KNOWN_ITEMS = [
  { name: 'Apple',          category: 'Produce',     location: 'fridge'  },
  { name: 'Banana',         category: 'Produce',     location: 'fridge'  },
  { name: 'Orange',         category: 'Produce',     location: 'fridge'  },
  { name: 'Lettuce',        category: 'Produce',     location: 'fridge'  },
  { name: 'Spinach',        category: 'Produce',     location: 'fridge'  },
  { name: 'Carrot',         category: 'Produce',     location: 'fridge'  },
  { name: 'Tomato',         category: 'Produce',     location: 'fridge'  },
  { name: 'Onion',          category: 'Produce',     location: 'pantry'  },
  { name: 'Potato',         category: 'Produce',     location: 'pantry'  },
  { name: 'Broccoli',       category: 'Produce',     location: 'fridge'  },
  { name: 'Cauliflower',    category: 'Produce',     location: 'fridge'  },
  { name: 'Cucumber',       category: 'Produce',     location: 'fridge'  },
  { name: 'Bell Pepper',    category: 'Produce',     location: 'fridge'  },
  { name: 'Mushroom',       category: 'Produce',     location: 'fridge'  },
  { name: 'Avocado',        category: 'Produce',     location: 'fridge'  },
  { name: 'Strawberry',     category: 'Produce',     location: 'fridge'  },
  { name: 'Blueberry',      category: 'Produce',     location: 'fridge'  },
  { name: 'Grapes',         category: 'Produce',     location: 'fridge'  },
  { name: 'Milk',           category: 'Eggs & Dairy', location: 'fridge' },
  { name: 'Eggs',           category: 'Eggs & Dairy', location: 'fridge' },
  { name: 'Cheese',         category: 'Eggs & Dairy', location: 'fridge' },
  { name: 'Feta',           category: 'Eggs & Dairy', location: 'fridge' },
  { name: 'Yogurt',         category: 'Eggs & Dairy', location: 'fridge' },
  { name: 'Butter',         category: 'Eggs & Dairy', location: 'fridge' },
  { name: 'Cream',          category: 'Eggs & Dairy', location: 'fridge' },
  { name: 'Sour Cream',     category: 'Eggs & Dairy', location: 'fridge' },
  { name: 'Cottage Cheese', category: 'Eggs & Dairy', location: 'fridge' },
  { name: 'Chicken',        category: 'Meat',        location: 'fridge'  },
  { name: 'Beef',           category: 'Meat',        location: 'fridge'  },
  { name: 'Pork',           category: 'Meat',        location: 'fridge'  },
  { name: 'Fish',           category: 'Meat',        location: 'fridge'  },
  { name: 'Salmon',         category: 'Meat',        location: 'fridge'  },
  { name: 'Ground Beef',    category: 'Meat',        location: 'fridge'  },
  { name: 'Turkey',         category: 'Meat',        location: 'fridge'  },
  { name: 'Bacon',          category: 'Meat',        location: 'fridge'  },
  { name: 'Sausage',        category: 'Meat',        location: 'fridge'  },
  { name: 'Deli Meat',      category: 'Deli',        location: 'fridge'  },
  { name: 'Ham',            category: 'Deli',        location: 'fridge'  },
  { name: 'Turkey Breast',  category: 'Deli',        location: 'fridge'  },
  { name: 'Salami',         category: 'Deli',        location: 'fridge'  },
  { name: 'Rice',           category: 'Pantry',      location: 'pantry'  },
  { name: 'Pasta',          category: 'Pantry',      location: 'pantry'  },
  { name: 'Flour',          category: 'Pantry',      location: 'pantry'  },
  { name: 'Sugar',          category: 'Pantry',      location: 'pantry'  },
  { name: 'Bread',          category: 'Pantry',      location: 'pantry'  },
  { name: 'Cereal',         category: 'Pantry',      location: 'pantry'  },
  { name: 'Oats',           category: 'Pantry',      location: 'pantry'  },
  { name: 'Leftovers',      category: 'Leftovers',   location: 'fridge'  },
]

/** Calculate expiration date string (YYYY-MM-DD) from today + shelf life days */
function calcExpirationDate(itemName, location) {
  const days = SHELF_LIFE_DAYS[itemName]
  if (!days) return ''

  let adjustedDays = days
  if (location === 'freezer') adjustedDays = days * 3
  else if (location === 'pantry' && days < 30) adjustedDays = 30

  const date = new Date()
  date.setDate(date.getDate() + adjustedDays)
  // Format as YYYY-MM-DD for the date input
  return date.toISOString().split('T')[0]
}

function useAutocomplete(query) {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase()
  return KNOWN_ITEMS.filter(item => item.name.toLowerCase().includes(q)).slice(0, 6)
}

function AddItemPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('select')
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    category: 'Produce',
    location: 'fridge',
    expiration_date: '',
    purchase_date: '',
    shared_with: '',
  })
  const [scanning, setScanning] = useState(false)
  const [scannedItems, setScannedItems] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const nameInputRef = useRef(null)
  const suggestionsRef = useRef(null)

  const suggestions = useAutocomplete(formData.name)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        nameInputRef.current && !nameInputRef.current.contains(e.target) &&
        suggestionsRef.current && !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? (value === '' ? '' : value) : value
    }))
    if (name === 'name') setShowSuggestions(true)
  }

  // When user picks a suggestion: fill name, category, location, AND expiration date
  const handleSuggestionClick = (item) => {
    const expirationDate = calcExpirationDate(item.name, item.location)
    setFormData(prev => ({
      ...prev,
      name: item.name,
      category: item.category,
      location: item.location,
      expiration_date: expirationDate,
    }))
    setShowSuggestions(false)
    nameInputRef.current?.blur()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let expirationDate = undefined
      if (formData.expiration_date) {
        expirationDate = new Date(formData.expiration_date + 'T00:00:00').toISOString()
      }

      let purchaseDate = formData.purchase_date
        ? new Date(formData.purchase_date + 'T00:00:00').toISOString()
        : new Date().toISOString()

      const itemData = {
        name: formData.name,
        quantity: parseFloat(formData.quantity) || 1.0,
        category: formData.category,
        location: formData.location,
        purchase_date: purchaseDate,
        consumed: false,
        shared_with: formData.shared_with || null,
      }

      if (expirationDate) itemData.expiration_date = expirationDate

      await createItem(itemData)
      navigate('/')
    } catch (error) {
      console.error('Error:', error)
      alert('Error creating item.')
    }
  }

  const handleScanReceipt = async () => {
    setScanning(true)
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment'
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = async (event) => {
            const base64 = event.target.result.split(',')[1]
            try {
              const result = await scanReceipt(base64)
              setScannedItems(result.items)
              setMode('review')
            } catch (error) {
              console.error('Error:', error)
              alert('Error scanning receipt.')
            } finally {
              setScanning(false)
            }
          }
          reader.readAsDataURL(file)
        }
      }
      input.click()
    } catch (error) {
      setScanning(false)
    }
  }

  const handleScannedItemChange = (index, field, value) => {
    const updatedItems = [...scannedItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setScannedItems(updatedItems)
  }

  const handleRemoveScannedItem = (index) => {
    const updatedItems = scannedItems.filter((_, i) => i !== index)
    setScannedItems(updatedItems)
    if (updatedItems.length === 0) setMode('select')
  }

  const handleConfirmScanned = async () => {
    try {
      const items = scannedItems.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity) || 1.0,
        purchase_date: new Date().toISOString(),
        consumed: false,
      }))
      await confirmReceiptItems(items)
      navigate('/')
    } catch (error) {
      console.error('Error:', error)
      alert('Error saving items.')
    }
  }

  // ── Select Mode ──
  if (mode === 'select') {
    return (
      <div className="add-item-page">
        <header className="add-header">
          <button className="back-btn" onClick={() => navigate('/')}><ArrowLeft size={24} /></button>
          <h1>Add Items</h1>
          <div style={{ width: 24 }} />
        </header>
        <div className="add-content">
          <div className="mode-selector">
            <button
              className={`mode-btn scan ${scanning ? 'scanning' : ''}`}
              onClick={handleScanReceipt}
              disabled={scanning}
            >
              <Camera size={32} />
              <span>{scanning ? 'Reading receipt...' : 'Scan Receipt'}</span>
            </button>
            <button className="mode-btn manual" onClick={() => setMode('manual')}>
              <FileText size={32} />
              <span>Manual Entry</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Review Mode ──
  if (mode === 'review') {
    return (
      <div className="add-item-page review-mode">
        <header className="add-header">
          <button className="back-btn" onClick={() => setMode('select')}><ArrowLeft size={24} /></button>
          <h1>Review Items</h1>
          <div style={{ width: 24 }} />
        </header>
        <div className="review-layout">
          <div className="scanned-items-container">
            {scannedItems.map((item, index) => (
              <div key={index} className="scanned-item editable">
                <div className="scanned-item-header">
                  <input
                    type="text"
                    value={item.name}
                    className="edit-input name-input"
                    onChange={(e) => handleScannedItemChange(index, 'name', e.target.value)}
                  />
                  <button className="remove-item-btn" onClick={() => handleRemoveScannedItem(index)}>
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="scanned-item-controls">
                  <input
                    type="number"
                    value={item.quantity}
                    className="edit-input qty-input"
                    onChange={(e) => handleScannedItemChange(index, 'quantity', e.target.value)}
                  />
                  <select
                    value={item.category}
                    className="edit-input select-input"
                    onChange={(e) => handleScannedItemChange(index, 'category', e.target.value)}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <select
                    value={item.location}
                    className="edit-input select-input"
                    onChange={(e) => handleScannedItemChange(index, 'location', e.target.value)}
                  >
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="review-footer">
            <button className="btn secondary" onClick={() => setMode('select')}>Cancel</button>
            <button className="btn primary" onClick={handleConfirmScanned}>
              Confirm & Add ({scannedItems.length})
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Manual Entry Mode ──
  return (
    <div className="add-item-page">
      <header className="add-header">
        <button className="back-btn" onClick={() => setMode('select')}><ArrowLeft size={24} /></button>
        <h1>Add Item</h1>
        <div style={{ width: 24 }} />
      </header>
      <form className="add-form" onSubmit={handleSubmit}>

        {/* Name with autocomplete */}
        <div className="form-group autocomplete-wrapper">
          <label>Item Name</label>
          <input
            ref={nameInputRef}
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(true)}
            required
            placeholder="e.g., Milk, Chicken, Tomatoes"
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="autocomplete-list" ref={suggestionsRef}>
              {suggestions.map((item) => {
                const days = SHELF_LIFE_DAYS[item.name]
                const daysLabel = days
                  ? (days >= 365 ? `${Math.round(days/365)}yr` : days >= 30 ? `${Math.round(days/30)}mo` : `${days}d`)
                  : null
                return (
                  <li
                    key={item.name}
                    className="autocomplete-item"
                    onMouseDown={() => handleSuggestionClick(item)}
                  >
                    <span className="autocomplete-name">{item.name}</span>
                    <span className="autocomplete-meta">
                      {item.category} · {item.location}{daysLabel ? ` · ${daysLabel}` : ''}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="form-group">
          <label>Quantity</label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            min="0.1"
            step="0.1"
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select name="category" value={formData.category} onChange={handleInputChange}>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label>Location</label>
          <select name="location" value={formData.location} onChange={handleInputChange}>
            {LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc.charAt(0).toUpperCase() + loc.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Expiration Date</label>
          <input
            type="date"
            name="expiration_date"
            value={formData.expiration_date}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label>Shared With (optional)</label>
          <input
            type="text"
            name="shared_with"
            value={formData.shared_with}
            onChange={handleInputChange}
            placeholder="e.g., Sarah, Everyone"
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={() => setMode('select')}>Cancel</button>
          <button type="submit" className="btn primary">Add Item</button>
        </div>
      </form>
    </div>
  )
}

export default AddItemPage