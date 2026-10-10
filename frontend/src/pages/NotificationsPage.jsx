import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, BellOff, Settings, Check, Trash2, Sparkles } from 'lucide-react'
import { getNotifications, markAsRead, deleteNotification } from '../api/notifications'
import { getItems } from '../api/items'
import { getNotifSettings, buildLocalAlerts } from '../utils/notifSettings'
import './NotificationSettingsPage.css'

function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [localAlerts, setLocalAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const settings = getNotifSettings()

  const load = useCallback(async () => {
    const s = getNotifSettings()
    if (!s.masterEnabled) {
      setLoading(false)
      return
    }
    try {
      const [serverNotifs, items] = await Promise.all([
        s.expirationAlerts || s.expiredAlerts
          ? getNotifications(false, s.urgencyDays, s.expiredAlerts)
          : Promise.resolve([]),
        getItems(),
      ])
      // If expiration alerts are off but expired alerts are on (or vice versa),
      // filter accordingly: expired messages contain "expired".
      const filtered = serverNotifs.filter(n => {
        const isExpired = n.message.includes('expired')
        return isExpired ? s.expiredAlerts : s.expirationAlerts
      })
      setNotifications(filtered)
      setLocalAlerts(buildLocalAlerts(items, s))
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id)
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="notif-page">
      <header className="notif-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Notifications</h1>
        <button className="back-btn" onClick={() => navigate('/notifications/settings')} title="Notification settings">
          <Settings size={22} />
        </button>
      </header>

      <div className="notif-content">
        {!settings.masterEnabled ? (
          <div className="notif-empty">
            <BellOff size={40} />
            <p>Notifications are turned off.</p>
            <button className="save-btn" onClick={() => navigate('/notifications/settings')}>
              Open Settings
            </button>
          </div>
        ) : loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {localAlerts.length > 0 && (
              <div className="notif-section">
                <p className="section-label">SMART ALERTS</p>
                <div className="section-card">
                  {localAlerts.map(alert => (
                    <div
                      key={alert.localId}
                      className="notif-item"
                      onClick={() => alert.link && navigate(alert.link)}
                      style={{ cursor: alert.link ? 'pointer' : 'default' }}
                    >
                      <Sparkles size={18} color="var(--accent)" />
                      <p className="notif-message">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="notif-section">
              <p className="section-label">
                EXPIRATION ALERTS{unreadCount > 0 ? ` (${unreadCount} UNREAD)` : ''}
              </p>
              <div className="section-card">
                {notifications.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={32} />
                    <p>No expiration alerts — your food is safe for now.</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`notif-item ${n.read ? 'read' : ''}`}>
                      <Bell size={18} color={n.read ? 'var(--text-secondary)' : '#eab308'} />
                      <p className="notif-message">{n.message}</p>
                      <div className="notif-actions">
                        {!n.read && (
                          <button className="notif-action-btn" onClick={() => handleMarkRead(n.id)} title="Mark as read">
                            <Check size={16} />
                          </button>
                        )}
                        <button className="notif-action-btn" onClick={() => handleDelete(n.id)} title="Dismiss">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
