import { format, differenceInDays } from 'date-fns'

export const getCategoryColor = (category) => {
  const colors = {
    'Produce': '#4ade80',
    'Freezer': '#60a5fa',
    'Meat': '#f87171',
    'Shelf Staples': '#fbbf24',
    'Deli': '#a78bfa',
    'Eggs & Dairy': '#fbbf24',
    'Leftovers': '#60a5fa',
  }
  return colors[category] || '#6b7280'
}

export const getStatusColor = (expirationDate, location) => {
  const now = new Date()
  const expDate = new Date(expirationDate)
  const daysUntilExpiry = differenceInDays(expDate, now)
  
  if (location === 'freezer') {
    return 'blue'
  }
  
  if (location === 'pantry' && daysUntilExpiry > 90) {
    return 'black'
  }
  
  if (daysUntilExpiry < 0) {
    return 'red' // Expired
  } else if (daysUntilExpiry < 3) {
    return 'red'
  } else if (daysUntilExpiry < 7) {
    return 'yellow'
  } else {
    return 'green'
  }
}

export const getStatusText = (expirationDate) => {
  const now = new Date()
  const expDate = new Date(expirationDate)
  const daysUntilExpiry = differenceInDays(expDate, now)
  
  if (daysUntilExpiry < 0) {
    return 'Expired'
  } else if (daysUntilExpiry === 0) {
    return 'Expires today'
  } else if (daysUntilExpiry === 1) {
    return 'Expires tomorrow'
  } else {
    return `Expires in ${daysUntilExpiry} days`
  }
}
