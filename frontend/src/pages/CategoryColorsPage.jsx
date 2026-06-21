import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Check } from 'lucide-react'
import {
  CATEGORY_NAMES,
  DEFAULT_CATEGORY_COLORS,
  getCategoryColors,
  setLocalCategoryColors,
} from '../utils/colors'
import { updateCategoryColors } from '../api/auth'
import './CategoryColorsPage.css'

function CategoryColorsPage() {
  const navigate = useNavigate()
  const [colors, setColors] = useState(() => getCategoryColors())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleChange = (category, value) => {
    setColors((prev) => ({ ...prev, [category]: value }))
    setSaved(false)
  }

  const handleReset = () => {
    setColors({ ...DEFAULT_CATEGORY_COLORS })
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    // Save locally first so the UI updates instantly even if the network is slow.
    setLocalCategoryColors(colors)
    try {
      await updateCategoryColors(colors)
    } catch (error) {
      console.error('Error saving category colors:', error)
    } finally {
      setSaving(false)
      setSaved(true)
    }
  }

  return (
    <div className="colors-page">
      <header className="colors-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Category Colors</h1>
        <button className="colors-reset" onClick={handleReset} title="Reset to defaults">
          <RotateCcw size={18} />
        </button>
      </header>

      <div className="colors-content">
        <p className="colors-hint">Tap a swatch to pick a new color for each category.</p>

        <div className="colors-list">
          {CATEGORY_NAMES.map((category) => (
            <label key={category} className="color-row">
              <span className="color-swatch" style={{ backgroundColor: colors[category] }}>
                <input
                  type="color"
                  value={colors[category]}
                  onChange={(e) => handleChange(category, e.target.value)}
                />
              </span>
              <span className="color-name">{category}</span>
              <span className="color-hex">{colors[category]}</span>
            </label>
          ))}
        </div>

        <button className="colors-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : saved ? (<><Check size={18} /> Saved</>) : 'Save colors'}
        </button>
      </div>
    </div>
  )
}

export default CategoryColorsPage
