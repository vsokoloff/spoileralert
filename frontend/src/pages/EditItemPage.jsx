import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getItem, updateItem } from '../api/items'
import './AddItemPage.css' // Reuse AddItemPage styles

const CATEGORIES = ['Deli', 'Eggs & Dairy', 'Produce', 'Freezer', 'Pantry', 'Meat', 'Leftovers']
const LOCATIONS = ['fridge', 'freezer', 'pantry']

function EditItemPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    category: 'Produce',
    location: 'fridge',
    expiration_date: '',
    purchase_date: '',
  })

  useEffect(() => {
    loadItem()
  }, [id])

  const loadItem = async () => {
    try {
      const item = await getItem(id)
      // Format dates for date input (YYYY-MM-DD)
      const expDate = item.expiration_date ? new Date(item.expiration_date).toISOString().split('T')[0] : ''
      const purDate = item.purchase_date ? new Date(item.purchase_date).toISOString().split('T')[0] : ''
      
      setFormData({
        name: item.name || '',
        quantity: item.quantity || 1,
        category: item.category || 'Produce',
        location: item.location || 'fridge',
        expiration_date: expDate,
        purchase_date: purDate,
      })
    } catch (error) {
      console.error('Error loading item:', error)
      alert('Error loading item. Please try again.')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseFloat(value) || 1 : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Format dates properly
      let expirationDate = formData.expiration_date
      if (expirationDate) {
        expirationDate = new Date(expirationDate + 'T00:00:00').toISOString()
      } else {
        const date = new Date()
        date.setDate(date.getDate() + 7)
        expirationDate = date.toISOString()
      }
      
      let purchaseDate = formData.purchase_date
      if (purchaseDate) {
        purchaseDate = new Date(purchaseDate + 'T00:00:00').toISOString()
      }

      const itemData = {
        name: formData.name,
        quantity: parseFloat(formData.quantity) || 1.0,
        category: formData.category,
        location: formData.location,
        expiration_date: expirationDate,
        purchase_date: purchaseDate || null,
      }
      
      console.log('Updating item:', itemData)
      await updateItem(id, itemData)
      console.log('Item updated successfully')
      navigate(-1) // Go back to previous page
    } catch (error) {
      console.error('Error updating item:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Error updating item. Please try again.'
      alert(`Error: ${errorMessage}`)
    }
  }

  if (loading) {
    return (
      <div className="add-item-page">
        <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>
          Loading item...
        </div>
      </div>
    )
  }

  return (
    <div className="add-item-page">
      <header className="add-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Edit Item</h1>
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
          <button type="button" className="btn secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn primary">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditItemPage
