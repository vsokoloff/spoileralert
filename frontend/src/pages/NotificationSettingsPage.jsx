import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Clock, Zap, ShoppingCart, AlertTriangle, Ban, Users, Trash2, RotateCcw, History } from 'lucide-react'
import { deleteAccount, logout } from '../api/auth'
import { getItems, getRecentlyDeleted, restoreItem } from '../api/items'
import { getNotifSettings, saveNotifSettings } from '../utils/notifSettings'
import { rescheduleAll, ensurePermission } from '../utils/localNotifications'
import './NotificationSettingsPage.css'

// Every toggle here controls real behavior: expiration/expired alerts and the
// urgency threshold drive both the in-app Notifications page and the device
// notifications scheduled via @capacitor/local-notifications (which fire even
// when the app is closed). Saving reschedules everything.

const DIGEST_TIMES = ['8:00 AM', '9:00 AM', '10:00 AM', '12:00 PM', '6:00 PM', '8:00 PM']

function Toggle({ value, onChange }) {
  return (
    <button
      className={`toggle ${value ? 'on' : ''}`}
      onClick={() => onChange(!value)}
      aria-label={value ? 'Disable' : 'Enable'}
    >
      <span className="toggle-thumb" />
    </button>
  )
}

function SettingRow({ icon, title, subtitle, children }) {
  return (
    <div className="setting-row">
      <div className="setting-icon">{icon}</div>
      <div className="setting-text">
        <p className="setting-title">{title}</p>
        {subtitle && <p className="setting-subtitle">{subtitle}</p>}
      </div>
      <div className="setting-control">{children}</div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="notif-section">
      <p className="section-label">{title}</p>
      <div className="section-card">{children}</div>
    </div>
  )
}

function NotificationSettingsPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(getNotifSettings())
  const [deleting, setDeleting] = useState(false)

  // Recently deleted items (restorable)
  const [deletedItems, setDeletedItems] = useState([])
  const [restoringId, setRestoringId] = useState(null)

  useEffect(() => {
    getRecentlyDeleted()
      .then(items => setDeletedItems(items || []))
      .catch(err => console.error('Error loading recently deleted:', err))
  }, [])

  const handleRestore = async (deletedId) => {
    setRestoringId(deletedId)
    try {
      await restoreItem(deletedId)
      setDeletedItems(prev => prev.filter(d => d.id !== deletedId))
    } catch (error) {
      console.error('Error restoring item:', error)
      alert('Could not restore that item. Please try again.')
    } finally {
      setRestoringId(null)
    }
  }

  const set = (key) => (val) => setSettings(prev => ({ ...prev, [key]: val }))

  const handleMasterToggle = async (val) => {
    set('masterEnabled')(val)
    // Ask for device notification permission the moment alerts are enabled,
    // so the user sees the iOS/Android prompt in context.
    if (val) await ensurePermission()
  }

  const handleSave = async () => {
    saveNotifSettings(settings)
    try {
      // Reschedule device notifications to match the new settings.
      const items = await getItems()
      await rescheduleAll(items)
    } catch (error) {
      console.error('Could not reschedule notifications:', error)
    }
    navigate(-1)
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Delete your account?\n\nThis permanently removes your account and all your food items, notifications, and history. This cannot be undone.'
    )
    if (!confirmed) return
    setDeleting(true)
    try {
      await deleteAccount()
      logout() // clears token + redirects to /login
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Could not delete your account. Please try again.')
      setDeleting(false)
    }
  }

  return (
    <div className="notif-page">
      <header className="notif-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Notifications</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="notif-content">

        {/* Master toggle */}
        <div className="master-toggle-card">
          <div className="master-toggle-left">
            <Bell size={22} color="var(--accent)" />
            <div>
              <p className="master-title">Notifications</p>
              <p className="master-subtitle">
                {settings.masterEnabled
                  ? 'On — alerts appear even when the app is closed'
                  : 'All notifications disabled'}
              </p>
            </div>
          </div>
          <Toggle value={settings.masterEnabled} onChange={handleMasterToggle} />
        </div>

        <div className={`notif-sections ${!settings.masterEnabled ? 'disabled' : ''}`}>

          {/* Expiration alerts */}
          <Section title="EXPIRATION ALERTS">
            <SettingRow
              icon={<Clock size={18} color="#eab308" />}
              title="Expiring soon"
              subtitle={`Alert when items expire within ${settings.urgencyDays} day${settings.urgencyDays !== 1 ? 's' : ''}`}
            >
              <Toggle value={settings.expirationAlerts} onChange={set('expirationAlerts')} />
            </SettingRow>

            {/* Urgency threshold slider */}
            {settings.expirationAlerts && (
              <div className="slider-row">
                <div className="slider-labels">
                  <span>1 day</span>
                  <span className="slider-value">{settings.urgencyDays} day{settings.urgencyDays !== 1 ? 's' : ''} before expiry</span>
                  <span>7 days</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={settings.urgencyDays}
                  onChange={e => set('urgencyDays')(Number(e.target.value))}
                  className="urgency-slider"
                />
              </div>
            )}

            <div className="row-divider" />
            <SettingRow
              icon={<Ban size={18} color="#ef4444" />}
              title="Already expired"
              subtitle="Remind me to throw away expired items"
            >
              <Toggle value={settings.expiredAlerts} onChange={set('expiredAlerts')} />
            </SettingRow>
          </Section>

          {/* Smart alerts */}
          <Section title="SMART ALERTS">
            <SettingRow
              icon={<Zap size={18} color="#a855f7" />}
              title="Recipe suggestions"
              subtitle="Suggest asking SPOY when items are expiring soon"
            >
              <Toggle value={settings.recipeSuggestions} onChange={set('recipeSuggestions')} />
            </SettingRow>
            <div className="row-divider" />
            <SettingRow
              icon={<Users size={18} color="var(--accent)" />}
              title="Duplicate items"
              subtitle="Alert when you have the same item twice — use oldest first"
            >
              <Toggle value={settings.duplicateItems} onChange={set('duplicateItems')} />
            </SettingRow>
            <div className="row-divider" />
            <SettingRow
              icon={<ShoppingCart size={18} color="#10b981" />}
              title="Empty fridge reminder"
              subtitle="Alert when your inventory is empty"
            >
              <Toggle value={settings.emptyFridge} onChange={set('emptyFridge')} />
            </SettingRow>
          </Section>

          {/* Daily digest */}
          <Section title="DAILY DIGEST">
            <SettingRow
              icon={<Clock size={18} color="var(--accent)" />}
              title="Daily summary"
              subtitle="One notification per day with all expiring items"
            >
              <Toggle value={settings.digestEnabled} onChange={set('digestEnabled')} />
            </SettingRow>
            {settings.digestEnabled && (
              <div className="digest-time-row">
                <p className="digest-time-label">Send at</p>
                <div className="time-chips">
                  {DIGEST_TIMES.map(t => (
                    <button
                      key={t}
                      className={`time-chip ${settings.digestTime === t ? 'active' : ''}`}
                      onClick={() => set('digestTime')(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Example notification preview */}
          <Section title="PREVIEW">
            <div className="notif-preview">
              <div className="preview-header">
                <span className="preview-app">Spoiler Alert</span>
                <span className="preview-time">now</span>
              </div>
              <p className="preview-title">
                <AlertTriangle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Eggs expire tomorrow
              </p>
              <p className="preview-body">Alerts like this appear on your lock screen when items are close to expiring — even when the app is closed.</p>
            </div>
          </Section>

        </div>

        {/* Recently deleted — outside the notifications wrapper so it stays
            usable even when notifications are turned off. */}
        <Section title="RECENTLY DELETED">
          {deletedItems.length === 0 ? (
            <div className="notif-empty">
              <History size={28} />
              <p>Nothing deleted recently. Deleted items can be restored from here for 24 hours.</p>
            </div>
          ) : (
            deletedItems.map(d => (
              <div key={d.id} className="notif-item">
                <History size={18} color="var(--text-secondary, #888)" />
                <p className="notif-message">
                  {d.name}
                  {d.deleted_at && (
                    <span className="setting-subtitle"> — deleted {new Date(d.deleted_at).toLocaleDateString()}</span>
                  )}
                </p>
                <button
                  className="notif-action-btn"
                  onClick={() => handleRestore(d.id)}
                  disabled={restoringId === d.id}
                  title="Restore item"
                >
                  <RotateCcw size={16} />
                  {restoringId === d.id ? 'Restoring…' : 'Restore'}
                </button>
              </div>
            ))
          )}
        </Section>

        {/* Account — also outside the notifications wrapper. */}
        <Section title="ACCOUNT">
          <div className="account-row">
            <div className="account-text">
              <p className="account-title">Delete account</p>
              <p className="account-subtitle">Permanently remove your account and all your data. This can&apos;t be undone.</p>
            </div>
            <button
              className="delete-account-btn"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              <Trash2 size={16} />
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Section>

        <button className="save-btn" onClick={handleSave}>
          Save Preferences
        </button>
      </div>
    </div>
  )
}

export default NotificationSettingsPage
