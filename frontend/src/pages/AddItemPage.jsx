import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, FileText, Trash2 } from 'lucide-react'
import { createItem } from '../api/items'
import { scanReceipt, confirmReceiptItems } from '../api/receipt'
import './AddItemPage.css'

// 1. ADDED 'Auto-detect' to the top of the list
const CATEGORIES = ['Auto-detect', 'Deli', 'Eggs & Dairy', 'Produce', 'Freezer', 'Pantry', 'Meat', 'Leftovers']
const LOCATIONS = ['fridge', 'freezer', 'pantry']

// Shelf life in days, mirrored from expiration_db.py.
const SHELF_LIFE_DAYS = {
  // Produce
  'Apple': 30, 'Banana': 7, 'Orange': 14, 'Lettuce': 7, 'Spinach': 5, 'Kale': 5, 'Arugula': 5,
  'Carrot': 21, 'Tomato': 7, 'Onion': 60, 'Potato': 30, 'Sweet Potato': 30, 'Garlic': 60,
  'Broccoli': 7, 'Cauliflower': 7, 'Cucumber': 7, 'Bell Pepper': 10, 'Mushroom': 5,
  'Avocado': 5, 'Strawberry': 5, 'Blueberry': 7, 'Raspberry': 3, 'Blackberry': 3, 'Grapes': 14,
  'Lemon': 21, 'Lime': 21, 'Grapefruit': 21, 'Melon': 7, 'Watermelon': 7, 'Celery': 14,
  'Zucchini': 7, 'Squash': 14, 'Asparagus': 5, 'Green Beans': 7, 'Cabbage': 14,
  
  // Eggs & Dairy
  'Milk': 7, 'Eggs': 28, 'Cheese': 14, 'Feta': 10, 'Yogurt': 14, 'Greek Yogurt': 14,
  'Butter': 30, 'Cream': 7, 'Sour Cream': 14, 'Cottage Cheese': 10, 'Cream Cheese': 14,
  'Oat Milk': 8, 'Almond Milk': 8, 'Soy Milk': 8, 'Nut Milk': 8, 'Plant Milk': 8,
  'Parmesan': 60, 'Cheddar': 30, 'Mozzarella': 14, 'Brie': 10,

  // Meat & Seafood
  'Chicken': 2, 'Chicken Breast': 2, 'Beef': 4, 'Steak': 4, 'Pork': 4, 'Pork Chop': 4,
  'Fish': 2, 'Salmon': 2, 'Tuna': 2, 'Shrimp': 2, 'Crab': 2, 'Scallops': 2,
  'Ground Beef': 2, 'Ground Turkey': 2, 'Turkey': 2, 'Bacon': 14, 'Sausage': 3, 'Hot Dogs': 14,

  // Deli & Plant-Based Proteins
  'Deli Meat': 5, 'Ham': 5, 'Turkey Breast': 5, 'Salami': 14, 'Prosciutto': 14,
  'Tofu': 7, 'Tempeh': 7, 'Seitan': 7, 'Hummus': 7, 'Guacamole': 3,

  // Beverages
  'Juice': 14, 'Orange Juice': 14, 'Apple Juice': 14, 'Lemonade': 14,
  'Soda': 365, 'Water': 730, 'Sparkling Water': 365, 'Kombucha': 30,
  'Coffee': 365, 'Tea': 365, 'Beer': 180, 'Wine': 5,

  // Condiments & Sauces
  'Ketchup': 180, 'Mustard': 365, 'Mayonnaise': 60, 'Mayo': 60, 'BBQ Sauce': 120,
  'Salad Dressing': 90, 'Soy Sauce': 365, 'Hot Sauce': 365, 'Salsa': 14, 'Relish': 180,
  'Syrup': 365, 'Maple Syrup': 365, 'Peanut Butter': 180, 'Almond Butter': 180, 'Jam': 180, 'Jelly': 180,

  // Pantry Dry Goods
  'Rice': 365, 'Pasta': 365, 'Flour': 365, 'Sugar': 730, 'Brown Sugar': 365,
  'Bread': 7, 'Bagels': 7, 'Tortillas': 14, 'Cereal': 180, 'Oats': 365, 'Quinoa': 365,
  'Olive Oil': 365, 'Vegetable Oil': 365, 'Vinegar': 730, 'Honey': 730,
  'Chips': 60, 'Popcorn': 180, 'Pretzels': 60, 'Crackers': 90, 
  'Nuts': 180, 'Almonds': 180, 'Walnuts': 180, 'Peanuts': 180, 'Seeds': 180,
  'Chocolate': 365, 'Baking Soda': 365, 'Baking Powder': 365,

  // Canned Goods & Broth
  'Canned Beans': 730, 'Canned Tomatoes': 365, 'Canned Soup': 730, 'Canned Tuna': 730,
  'Chicken Broth': 7, 'Beef Broth': 7, 'Vegetable Broth': 7, 'Stock': 7,

  // Leftovers & Prepared
  'Leftovers': 4, 'Cooked Chicken': 4, 'Cooked Beef': 4, 'Cooked Rice': 4, 'Cooked Pasta': 4, 'Meal Prep': 4
}

// Full item metadata for autocomplete automatically generated from the list above
const KNOWN_ITEMS = Object.keys(SHELF_LIFE_DAYS).map(itemName => {
  let cat = 'Pantry'
  let loc = 'pantry'

  if (['Apple', 'Banana', 'Orange', 'Lettuce', 'Spinach', 'Kale', 'Arugula', 'Carrot', 'Tomato', 'Broccoli', 'Cauliflower', 'Cucumber', 'Bell Pepper', 'Mushroom', 'Avocado', 'Strawberry', 'Blueberry', 'Raspberry', 'Blackberry', 'Grapes', 'Lemon', 'Lime', 'Grapefruit', 'Melon', 'Watermelon', 'Celery', 'Zucchini', 'Squash', 'Asparagus', 'Green Beans', 'Cabbage'].includes(itemName)) {
    cat = 'Produce'; loc = 'fridge';
  } else if (['Onion', 'Potato', 'Sweet Potato', 'Garlic'].includes(itemName)) {
    cat = 'Produce'; loc = 'pantry';
  } else if (['Milk', 'Eggs', 'Cheese', 'Feta', 'Yogurt', 'Greek Yogurt', 'Butter', 'Cream', 'Sour Cream', 'Cottage Cheese', 'Cream Cheese', 'Oat Milk', 'Almond Milk', 'Soy Milk', 'Nut Milk', 'Plant Milk', 'Parmesan', 'Cheddar', 'Mozzarella', 'Brie'].includes(itemName)) {
    cat = 'Eggs & Dairy'; loc = 'fridge';
  } else if (['Chicken', 'Chicken Breast', 'Beef', 'Steak', 'Pork', 'Pork Chop', 'Fish', 'Salmon', 'Tuna', 'Shrimp', 'Crab', 'Scallops', 'Ground Beef', 'Ground Turkey', 'Turkey', 'Bacon', 'Sausage', 'Hot Dogs'].includes(itemName)) {
    cat = 'Meat'; loc = 'fridge';
  } else if (['Deli Meat', 'Ham', 'Turkey Breast', 'Salami', 'Prosciutto', 'Tofu', 'Tempeh', 'Seitan', 'Hummus', 'Guacamole'].includes(itemName)) {
    cat = 'Deli'; loc = 'fridge';
  } else if (['Leftovers', 'Cooked Chicken', 'Cooked Beef', 'Cooked Rice', 'Cooked Pasta', 'Meal Prep'].includes(itemName)) {
    cat = 'Leftovers'; loc = 'fridge';
  } else if (['Juice', 'Orange Juice', 'Apple Juice', 'Lemonade', 'Kombucha', 'Beer', 'Wine', 'Ketchup', 'Mustard', 'Mayonnaise', 'Mayo', 'BBQ Sauce', 'Salad Dressing', 'Salsa', 'Relish', 'Jam', 'Jelly', 'Chicken Broth', 'Beef Broth', 'Vegetable Broth', 'Stock'].includes(itemName)) {
    cat = 'Pantry'; loc = 'fridge'; // Usually refrigerated after opening
  }
  
  return { name: itemName, category: cat, location: loc }
})

/** Calculate expiration date string (YYYY-MM-DD) from today + shelf life days */
function calcExpirationDate(itemName, location) {
  const days = SHELF_LIFE_DAYS[itemName]
  if (!days) return ''

  let adjustedDays = days
  if (location === 'freezer') adjustedDays = days * 3
  else if (location === 'pantry' && days < 30) adjustedDays = 30

  const date = new Date()
  date.setDate(date.getDate() + adjustedDays)
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
    category: 'Auto-detect', // 2. Default is now Auto-detect
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
        location: formData.location,
        purchase_date: purchaseDate,
        consumed: false,
        shared_with: formData.shared_with || null,
      }

      // 3. ONLY send the category if they manually picked one. 
      // Otherwise, the backend will auto-detect it using AI.
      if (formData.category && formData.category !== 'Auto-detect') {
        itemData.category = formData.category
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
              // Ensure scanned items default to Auto-detect if AI didn't catch it
              const mappedItems = result.items.map(item => ({
                ...item,
                category: item.category || 'Auto-detect'
              }))
              setScannedItems(mappedItems)
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
      const items = scannedItems.map(item => {
        const payload = {
          name: item.name,
          quantity: parseFloat(item.quantity) || 1.0,
          location: item.location || 'fridge',
          purchase_date: new Date().toISOString(),
          consumed: false,
        }
        
        // 4. Same AI allowance for receipt scanning
        if (item.category && item.category !== 'Auto-detect') {
          payload.category = item.category
        }
        if (item.expiration_date) {
          payload.expiration_date = item.expiration_date
        }
        
        return payload
      })
      
      await confirmReceiptItems(items)
      navigate('/')
    } catch (error) {
      console.error('Error:', error)
      alert('Error saving items.')
    }
  }

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

  return (
    <div className="add-item-page">
      <header className="add-header">
        <button className="back-btn" onClick={() => setMode('select')}><ArrowLeft size={24} /></button>
        <h1>Add Item</h1>
        <div style={{ width: 24 }} />
      </header>
      <form className="add-form" onSubmit={handleSubmit}>

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