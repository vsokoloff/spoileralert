import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, FileText, Trash2 } from 'lucide-react'
import { createItem } from '../api/items'
import { scanReceipt, confirmReceiptItems } from '../api/receipt'
import './AddItemPage.css'

const CATEGORIES = ['Deli', 'Eggs & Dairy', 'Produce', 'Freezer', 'Shelf Staples', 'Meat', 'Leftovers']
const LOCATIONS = ['fridge', 'freezer', 'pantry']

function AddItemPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('select') // 'select', 'manual', 'scan', 'review'
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? (value === '' ? '' : value) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
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
        shared_with: formData.shared_with || null,
      }
      
      if (expirationDate) {
         itemData.expiration_date = expirationDate;
      }
      
      await createItem(itemData)
      navigate('/')
    } catch (error) {
      console.error('Error:', error)
      alert('Error creating item. Please try again.')
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

  // --- RENDERING MODES ---

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
            <button className={`mode-btn scan ${scanning ? 'scanning' : ''}`} onClick={handleScanReceipt} disabled={scanning}>
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
      <div className="add-item-page">
        <header className="add-header">
          <button className="back-btn" onClick={() => setMode('select')}><ArrowLeft size={24} /></button>
          <h1>Review Items</h1>
          <div style={{ width: 24 }} />
        </header>
        <div className="add-content">
          <div className="scanned-items">
            {scannedItems.map((item, index) => (
              <div key={index} className="scanned-item editable">
                <div className="scanned-item-header">
                  <input type="text" value={item.name} className="edit-input name-input" onChange={(e) => handleScannedItemChange(index, 'name', e.target.value)} />
                  <button className="remove-item-btn" onClick={() => handleRemoveScannedItem(index)}><Trash2 size={18} /></button>
                </div>
                <div className="scanned-item-controls">
                  <input type="number" value={item.quantity} className="edit-input qty-input" onChange={(e) => handleScannedItemChange(index, 'quantity', e.target.value)} />
                  <select value={item.category} className="edit-input select-input" onChange={(e) => handleScannedItemChange(index, 'category', e.target.value)}>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <select value={item.location} className="edit-input select-input" onChange={(e) => handleScannedItemChange(index, 'location', e.target.value)}>
                    {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="action-buttons">
            <button className="btn secondary" onClick={() => setMode('select')}>Cancel</button>
            <button className="btn primary" onClick={handleConfirmScanned}>Confirm & Add ({scannedItems.length})</button>
          </div>
        </div>
      </div>
    )
  }

  // MANUAL MODE
  return (
    <div className="add-item-page">
      <header className="add-header">
        <button className="back-btn" onClick={() => setMode('select')}><ArrowLeft size={24} /></button>
        <h1>Add Item</h1>
        <div style={{ width: 24 }} />
      </header>
      <form className="add-form" onSubmit={handleSubmit}>
        <div className="form-group"><label>Item Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required /></div>
        <div className="form-group"><label>Quantity</label><input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} /></div>
        <div className="form-group">
          <label>Category</label>
          <select name="category" value={formData.category} onChange={handleInputChange}>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Location</label>
          <select name="location" value={formData.location} onChange={handleInputChange}>
            {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Shared With</label><input type="text" name="shared_with" value={formData.shared_with} onChange={handleInputChange} placeholder="Sarah, Shared, etc." /></div>
        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={() => setMode('select')}>Cancel</button>
          <button type="submit" className="btn primary">Add Item</button>
        </div>
      </form>
    </div>
  )
}

export default AddItemPage