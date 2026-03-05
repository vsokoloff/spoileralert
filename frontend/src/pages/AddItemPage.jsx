import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, FileText } from 'lucide-react'
import { createItem } from '../api/items'
import { scanReceipt, confirmReceiptItems } from '../api/receipt'
import './AddItemPage.css'

const CATEGORIES = ['Deli', 'Eggs & Dairy', 'Produce', 'Freezer', 'Shelf Staples', 'Meat', 'Leftovers']
const LOCATIONS = ['fridge', 'freezer', 'pantry']

function AddItemPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('select') // 'select', 'manual', 'scan'
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    category: 'Produce',
    location: 'fridge',
    expiration_date: '',
    purchase_date: '',
  })
  const [scanning, setScanning] = useState(false)
  const [scannedItems, setScannedItems] = useState([])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      // Allow empty string for quantity so the user can backspace the "1"
      [name]: name === 'quantity' ? (value === '' ? '' : value) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // 1. Only format expirationDate IF the user actually typed one in
      let expirationDate = undefined;
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
      }
      
      // 2. Only attach it to the payload if it exists
      if (expirationDate) {
         itemData.expiration_date = expirationDate;
      }
      
      console.log('Submitting item:', itemData)
      const result = await createItem(itemData)
      console.log('Item created:', result)
      navigate('/')
    } catch (error) {
      console.error('Error creating item:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Error creating item. Please try again.'
      alert(`Error: ${errorMessage}`)
    }
  }

  const handleScanReceipt = async () => {
    setScanning(true)
    try {
      // For MVP, we'll use a file input
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.capture = 'environment' // opens rear camera directly on mobile
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
              console.error('Error scanning receipt:', error)
              alert('Error scanning receipt. Please try again.')
            } finally {
              setScanning(false)
            }
          }
          reader.readAsDataURL(file)
        }
      }
      input.click()
    } catch (error) {
      console.error('Error:', error)
      setScanning(false)
    }
  }

  const handleConfirmScanned = async () => {
    try {
      const items = scannedItems.map(item => ({
        ...item,
        // We REMOVED the hardcoded 7-day fallback here! 
        // The backend will now intercept this and calculate it properly.
        purchase_date: new Date().toISOString(),
        consumed: false,
      }))
      await confirmReceiptItems(items)
      navigate('/')
    } catch (error) {
      console.error('Error confirming items:', error)
      alert('Error saving items. Please try again.')
    }
  }

  if (mode === 'select') {
    return (
      <div className="add-item-page">
        <header className="add-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={24} />
          </button>
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
              <span>{scanning ? 'AI is reading receipt...' : 'Scan Receipt'}</span>
              {scanning && <div className="loading-subtitle" style={{fontSize: '12px', marginTop: '4px', color: '#666'}}>This may take a few seconds</div>}
            </button>
            <button 
              className="mode-btn manual"
              onClick={() => setMode('manual')}
            >
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
      <div className="add-item-page">
        <header className="add-header">
          <button className="back-btn" onClick={() => setMode('select')}>
            <ArrowLeft size={24} />
          </button>
          <h1>Review Scanned Items</h1>
          <div style={{ width: 24 }} />
        </header>

        <div className="add-content">
          <div className="scanned-items">
            {scannedItems.map((item, index) => (
              <div key={index} className="scanned-item">
                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p>{item.category} • {item.location}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="action-buttons">
            <button className="btn secondary" onClick={() => setMode('select')}>
              Cancel
            </button>
            <button className="btn primary" onClick={handleConfirmScanned}>
              Confirm & Add
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="add-item-page">
      <header className="add-header">
        <button className="back-btn" onClick={() => setMode('select')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Add Item</h1>
        <div style={{ width: 24 }} />
      </header>

      <form className="add-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Item Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="e.g., Milk, Chicken, Tomatoes"
          />
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
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Location</label>
          <select
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
          >
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
          <label>Purchase Date (optional)</label>
          <input
            type="date"
            name="purchase_date"
            value={formData.purchase_date}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button type="submit" className="btn primary">
            Add Item
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddItemPage