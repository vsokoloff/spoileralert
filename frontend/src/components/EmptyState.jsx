import './EmptyState.css'

function EmptyState({ onAddClick }) {
  return (
    <div className="empty-state">
      <div className="empty-illustration">🧊</div>
      <h2>Your fridge is empty</h2>
      <p>Start adding what you have at home</p>
      <button className="add-first-btn" onClick={onAddClick}>
        Add First Item
      </button>
    </div>
  )
}

export default EmptyState
