import { useNavigate } from 'react-router-dom'
import './LocationGrid.css'

const LOCATIONS = [
  { name: 'Fridge', icon: '🧊', color: '#60a5fa' },
  { name: 'Freezer', icon: '❄️', color: '#3b82f6' },
  { name: 'Pantry', icon: '🥫', color: '#fbbf24' },
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
              backgroundColor: `${location.color}15`,
              borderColor: location.color
            }}
          >
            <div className="location-icon">{location.icon}</div>
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
