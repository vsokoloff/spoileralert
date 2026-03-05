import { useNavigate } from 'react-router-dom'
import { getStatusColor } from '../utils/colors'
import { differenceInDays } from 'date-fns'
import './InventoryPreview.css'

function InventoryPreview({ items, totalCount, onViewAll }) {
  const navigate = useNavigate()
  const moreCount = totalCount - items.length

  // Sort items by expiration urgency
  const sortedItems = [...items].sort((a, b) => {
    const now = new Date()
    const expA = new Date(a.expiration_date)
    const expB = new Date(b.expiration_date)
    const daysA = differenceInDays(expA, now)
    const daysB = differenceInDays(expB, now)
    
    // Get priority: red (1) > yellow (2) > green (3) > blue/black (4)
    const getPriority = (item) => {
      const statusColor = getStatusColor(item.expiration_date, item.location)
      if (statusColor === 'red') return 1
      if (statusColor === 'yellow') return 2
      if (statusColor === 'green') return 3
      return 4
    }
    
    const priorityA = getPriority(a)
    const priorityB = getPriority(b)
    
    // First sort by priority (urgency)
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    
    // Then by days until expiration (soonest first)
    return daysA - daysB
  })

  // Group items by urgency
  const urgentItems = sortedItems.filter(item => {
    const statusColor = getStatusColor(item.expiration_date, item.location)
    return statusColor === 'red'
  })
  
  const soonItems = sortedItems.filter(item => {
    const statusColor = getStatusColor(item.expiration_date, item.location)
    return statusColor === 'yellow'
  })
  
  const goodItems = sortedItems.filter(item => {
    const statusColor = getStatusColor(item.expiration_date, item.location)
    return statusColor === 'green' || statusColor === 'blue' || statusColor === 'black'
  })

  return (
    <div className="inventory-preview" onClick={onViewAll}>
      <div className="preview-header">
        <h2>In Your Fridge</h2>
        {moreCount > 0 && <span className="more-count">+{moreCount} more</span>}
      </div>
      
      {/* Color Legend */}
      <div className="color-legend">
        <span className="legend-item"><span className="dot red"></span> Expiring (&lt;3 days)</span>
        <span className="legend-item"><span className="dot yellow"></span> Soon (4-7 days)</span>
        <span className="legend-item"><span className="dot green"></span> Good (7+ days)</span>
      </div>

      {/* Scrollable Area */}
      <div className="preview-scroll-area">
        {/* Expiring Soon */}
        {urgentItems.length > 0 && (
          <div className="preview-section">
            <div className="section-label">Expiring Soon</div>
            <div className="preview-tags">
              {urgentItems.map((item) => (
                <div key={item.id} className="preview-tag red">
                  <span className="tag-name">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expiring This Week */}
        {soonItems.length > 0 && (
          <div className="preview-section">
            <div className="section-label">Expiring This Week</div>
            <div className="preview-tags">
              {soonItems.map((item) => (
                <div key={item.id} className="preview-tag yellow">
                  <span className="tag-name">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Still Good */}
        {goodItems.length > 0 && (
          <div className="preview-section">
            <div className="section-label">Still Good</div>
            <div className="preview-tags">
              {goodItems.map((item) => (
                <div key={item.id} className="preview-tag green">
                  <span className="tag-name">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InventoryPreview