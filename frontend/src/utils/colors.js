// Simplified color system per TA feedback:
// green = good (7+ days), yellow = expiring soon (3-7 days), red = bad (< 3 days or expired)
// Freezer and pantry items follow the same rules — no special blue/black treatment.

export function getStatusColor(expirationDate) {
  if (!expirationDate) return 'status-green'
  const now = new Date()
  const exp = new Date(expirationDate)
  const daysLeft = Math.floor((exp - now) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) return 'status-red'       // expired
  if (daysLeft < 3) return 'status-red'        // expires in < 3 days
  if (daysLeft < 7) return 'status-yellow'     // expires in 3–7 days
  return 'status-green'                        // 7+ days, good
}

export function getStatusText(expirationDate) {
  if (!expirationDate) return 'No expiration date'
  const now = new Date()
  const exp = new Date(expirationDate)
  const daysLeft = Math.floor((exp - now) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) return `Expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} ago`
  if (daysLeft === 0) return 'Expires today'
  if (daysLeft === 1) return 'Expires tomorrow'
  if (daysLeft < 7) return `Expires in ${daysLeft} days`
  if (daysLeft < 30) return `Expires in ${daysLeft} days`
  const weeks = Math.floor(daysLeft / 7)
  if (daysLeft < 60) return `Expires in ${weeks} week${weeks !== 1 ? 's' : ''}`
  const months = Math.floor(daysLeft / 30)
  return `Expires in ${months} month${months !== 1 ? 's' : ''}`
}

// ── Category colors (customizable per user) ──────────────────────────────────
export const DEFAULT_CATEGORY_COLORS = {
  'Produce':      '#10b981',
  'Meat':         '#ef4444',
  'Eggs & Dairy': '#f59e0b',
  'Pantry':       '#facc15',
  'Deli':         '#8b5cf6',
  'Freezer':      '#3b82f6',
  'Leftovers':    '#ec4899',
}

export const CATEGORY_NAMES = Object.keys(DEFAULT_CATEGORY_COLORS)

const COLORS_STORAGE_KEY = 'categoryColors'

// Returns the full map: defaults merged with the user's saved overrides.
export function getCategoryColors() {
  let overrides = {}
  try {
    const raw = localStorage.getItem(COLORS_STORAGE_KEY)
    if (raw) overrides = JSON.parse(raw) || {}
  } catch {
    overrides = {}
  }
  return { ...DEFAULT_CATEGORY_COLORS, ...overrides }
}

export function getCategoryColor(category) {
  return getCategoryColors()[category] || '#6b7280'
}

// Cache the user's colors locally (so getCategoryColor stays synchronous).
export function setLocalCategoryColors(map) {
  try {
    localStorage.setItem(COLORS_STORAGE_KEY, JSON.stringify(map || {}))
  } catch {
    /* ignore storage errors */
  }
}