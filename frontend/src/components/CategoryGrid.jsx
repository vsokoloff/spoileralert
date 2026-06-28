import { getContrastText } from '../utils/colors'
import './CategoryGrid.css'

function CategoryGrid({ categories, categoryCounts, onCategoryClick }) {
  const getCount = (categoryName) => {
    const category = categoryCounts.find(c => c.name === categoryName)
    return category ? category.count : 0
  }

  return (
    <div className="category-grid">
      {categories.map((category) => {
        const count = getCount(category.name)
        return (
          <div
            key={category.name}
            className="category-tile"
            onClick={() => onCategoryClick(category.name)}
            style={{
              backgroundColor: category.color,
              borderColor: category.color,
              color: getContrastText(category.color),
            }}
          >
            <div className="category-name">{category.name}</div>
            {count > 0 && (
              <div className="category-count">{count} items</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default CategoryGrid
