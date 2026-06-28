import { getContrastText } from '../utils/colors'
import './LocationGrid.css'

const LOCATIONS = [
  { name: 'Fridge', color: '#2e9bd6' },
  { name: 'Freezer', color: '#5b7cfa' },
  { name: 'Pantry', color: '#f08c00' },
]

function LocationGrid({ locationCounts, onLocationClick }) {
  const getCount = (locationName) => {
    const location = locationCounts.find(l => l.name === locationName.toLowerCase())
    return location ? location.count : 0
  }

  return (
    <div className="location-grid">
      {LOCATIONS.map((location) => {
        const count = getCount(location.name)
        return (
          <div
            key={location.name}
            className="location-tile"
            onClick={() => onLocationClick(location.name.toLowerCase())}
            style={{
              backgroundColor: location.color,
              borderColor: location.color,
              color: getContrastText(location.color),
            }}
          >
            <div className="location-name">{location.name}</div>
            {count > 0 && (
              <div className="location-count">{count} items</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default LocationGrid
