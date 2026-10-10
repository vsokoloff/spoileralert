// Scheduled device notifications (lock screen / notification center, even when
// the app is closed) via @capacitor/local-notifications.
//
// All of Spoiler Alert's alerts derive from data already on the device —
// expiration dates are known the moment an item is added — so notifications
// are scheduled locally. No APNs keys, device-token storage, or server cron
// required. Call rescheduleAll() whenever items or settings change.

import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { getNotifSettings } from './notifSettings'

const ALERT_HOUR = 9 // expiry alerts fire at 9:00 AM local time

const isNative = () => Capacitor.isNativePlatform()

export const ensurePermission = async () => {
  if (!isNative()) return false
  try {
    const { display } = await LocalNotifications.checkPermissions()
    if (display === 'granted') return true
    const req = await LocalNotifications.requestPermissions()
    return req.display === 'granted'
  } catch (e) {
    console.error('Notification permission check failed:', e)
    return false
  }
}

// "9:00 AM" / "6:00 PM" → [hours24, minutes]
const parseTime = (label) => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec((label || '').trim())
  if (!m) return [9, 0]
  let h = Number(m[1]) % 12
  if (m[3].toUpperCase() === 'PM') h += 12
  return [h, Number(m[2])]
}

const dayAt = (date, hour, minute = 0, dayOffset = 0) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayOffset, hour, minute, 0)

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

/**
 * Cancel everything pending and schedule fresh notifications from the current
 * inventory + settings. Safe to call often; no-op in the browser.
 */
export const rescheduleAll = async (items) => {
  if (!isNative()) return

  const settings = getNotifSettings()

  try {
    const pending = await LocalNotifications.getPending()
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending)
    }
  } catch (e) {
    console.error('Could not clear pending notifications:', e)
  }

  if (!settings.masterEnabled) return
  if (!(await ensurePermission())) return

  const now = new Date()
  const active = (items || []).filter(i => !i.consumed && i.expiration_date)
  const notifs = []

  if (settings.expirationAlerts) {
    for (const item of active) {
      const exp = new Date(item.expiration_date)

      // Heads-up alert N days before expiry
      const headsUp = dayAt(exp, ALERT_HOUR, 0, -settings.urgencyDays)
      if (headsUp > now) {
        notifs.push({
          title: 'Expiring soon',
          body: `${item.name} expires in ${settings.urgencyDays} day${settings.urgencyDays !== 1 ? 's' : ''}`,
          when: headsUp,
        })
      }

      // Day-of alert
      const dayOf = dayAt(exp, ALERT_HOUR)
      if (dayOf > now) {
        notifs.push({
          title: 'Expires today',
          body: `${item.name} expires today — use it or freeze it!`,
          when: dayOf,
        })
      }
    }
  }

  if (settings.expiredAlerts) {
    for (const item of active) {
      const exp = new Date(item.expiration_date)
      const dayAfter = dayAt(exp, ALERT_HOUR, 0, 1)
      if (dayAfter > now) {
        notifs.push({
          title: 'Expired',
          body: `${item.name} expired yesterday — time to toss it`,
          when: dayAfter,
        })
      }
    }
  }

  // Daily digest: one summary per day (next 7 days) at the chosen time, only
  // on days when something is actually expiring within the urgency window.
  if (settings.digestEnabled) {
    const [h, m] = parseTime(settings.digestTime)
    for (let d = 0; d < 7; d++) {
      const when = dayAt(now, h, m, d)
      if (when <= now) continue
      const windowEnd = settings.urgencyDays * 86400000
      const expiring = active.filter(i => {
        const diff = startOfDay(new Date(i.expiration_date)) - startOfDay(when)
        return diff >= 0 && diff <= windowEnd
      })
      if (expiring.length === 0) continue
      notifs.push({
        title: `Daily digest — ${expiring.length} item${expiring.length !== 1 ? 's' : ''} expiring soon`,
        body: expiring.slice(0, 5).map(i => i.name).join(', ') + (expiring.length > 5 ? '…' : ''),
        when,
      })
    }
  }

  // iOS keeps at most 64 pending local notifications — keep the soonest.
  notifs.sort((a, b) => a.when - b.when)
  const limited = notifs.slice(0, 60).map((n, i) => ({
    id: i + 1,
    title: n.title,
    body: n.body,
    schedule: { at: n.when },
  }))

  if (limited.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications: limited })
    } catch (e) {
      console.error('Could not schedule notifications:', e)
    }
  }
}
