// Notification settings — persisted locally, read by NotificationsPage and
// FridgePage. Every setting here changes real behavior.

const KEY = 'notifSettings'

export const DEFAULT_SETTINGS = {
  masterEnabled: true,
  expirationAlerts: true,   // server alerts for items expiring within urgencyDays
  urgencyDays: 3,           // 1–7, passed to the backend
  expiredAlerts: true,      // server alerts for already-expired items
  duplicateItems: true,     // local alert: same item name twice — use oldest first
  emptyFridge: false,       // local alert: inventory is empty
  recipeSuggestions: true,  // local alert: expiring items → suggest asking SPOY
  digestEnabled: true,      // device notification: one daily summary
  digestTime: '9:00 AM',    // when the daily digest fires
}

export const getNotifSettings = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY))
    return { ...DEFAULT_SETTINGS, ...(saved || {}) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export const saveNotifSettings = (settings) => {
  localStorage.setItem(KEY, JSON.stringify(settings))
}

// ── Locally-computed alerts (no backend state needed) ─────────────────────────

export const buildLocalAlerts = (items, settings) => {
  const alerts = []
  if (!settings.masterEnabled) return alerts

  const active = (items || []).filter(i => !i.consumed)

  if (settings.emptyFridge && active.length === 0) {
    alerts.push({
      localId: 'empty-fridge',
      message: 'Your fridge is empty — time to go shopping!',
    })
  }

  if (settings.duplicateItems && active.length > 0) {
    const byName = {}
    active.forEach(i => {
      const key = (i.name || '').trim().toLowerCase()
      if (!key) return
      byName[key] = byName[key] || []
      byName[key].push(i)
    })
    Object.values(byName)
      .filter(group => group.length > 1)
      .forEach(group => {
        alerts.push({
          localId: `dup-${group[0].name}`,
          message: `You have ${group.length}× ${group[0].name} — use the oldest first`,
        })
      })
  }

  if (settings.recipeSuggestions && active.length > 0) {
    const now = new Date()
    const cutoff = new Date(now.getTime() + settings.urgencyDays * 24 * 60 * 60 * 1000)
    const expiring = active.filter(i => {
      const exp = new Date(i.expiration_date)
      return exp >= now && exp <= cutoff
    })
    if (expiring.length > 0) {
      alerts.push({
        localId: 'recipe-suggestion',
        message: `${expiring.length} item${expiring.length > 1 ? 's' : ''} expiring soon — ask SPOY for recipe ideas`,
        link: '/spoy',
      })
    }
  }

  return alerts
}
