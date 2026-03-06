import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Clock, Zap, ShoppingCart, ChefHat, AlertTriangle } from 'lucide-react'
import './NotificationSettingsPage.css'

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

  // Notification type toggles
  const [settings, setSettings] = useState({
    masterEnabled: true,
    expiringToday: true,
    expiringSoon: true,       // within 3 days
    expired: true,
    duplicateItems: true,     // you have two of the same item
    emptyFridge: false,
    recipeRecommendations: true,
    ingredientExpired: true,  // meal ingredient has expired
  })

  // Urgency threshold
  const [urgencyDays, setUrgencyDays] = useState(3)

  // Daily digest
  const [digestEnabled, setDigestEnabled] = useState(true)
  const [digestTime, setDigestTime] = useState('12:00 PM')

  const set = (key) => (val) => setSettings(prev => ({ ...prev, [key]: val }))

  const handleSave = () => {
    // In a real app, persist to backend/localStorage
    const prefs = { settings, urgencyDays, digestEnabled, digestTime }
    localStorage.setItem('notifSettings', JSON.stringify(prefs))
    alert('Notification preferences saved!')
    navigate(-1)
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
              <p className="master-title">Push Notifications</p>
              <p className="master-subtitle">
                {settings.masterEnabled ? 'Notifications are on' : 'All notifications disabled'}
              </p>
            </div>
          </div>
          <Toggle value={settings.masterEnabled} onChange={set('masterEnabled')} />
        </div>

        <div className={`notif-sections ${!settings.masterEnabled ? 'disabled' : ''}`}>

          {/* Expiration alerts */}
          <Section title="EXPIRATION ALERTS">
            <SettingRow
              icon={<AlertTriangle size={18} color="#ef4444" />}
              title="Expires today"
              subtitle="Alert when an item expires today"
            >
              <Toggle value={settings.expiringToday} onChange={set('expiringToday')} />
            </SettingRow>
            <div className="row-divider" />
            <SettingRow
              icon={<Clock size={18} color="#eab308" />}
              title="Expiring soon"
              subtitle={`Alert when items expire within ${urgencyDays} day${urgencyDays !== 1 ? 's' : ''}`}
            >
              <Toggle value={settings.expiringSoon} onChange={set('expiringSoon')} />
            </SettingRow>

            {/* Urgency threshold slider */}
            {settings.expiringSoon && (
              <div className="slider-row">
                <div className="slider-labels">
                  <span>1 day</span>
                  <span className="slider-value">{urgencyDays} days before expiry</span>
                  <span>7 days</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={urgencyDays}
                  onChange={e => setUrgencyDays(Number(e.target.value))}
                  className="urgency-slider"
                />
              </div>
            )}

            <div className="row-divider" />
            <SettingRow
              icon={<span style={{ fontSize: 18 }}>🚫</span>}
              title="Already expired"
              subtitle="Remind me to throw away expired items"
            >
              <Toggle value={settings.expired} onChange={set('expired')} />
            </SettingRow>
          </Section>

          {/* Smart alerts */}
          <Section title="SMART ALERTS">
            <SettingRow
              icon={<ChefHat size={18} color="var(--accent)" />}
              title="Recipe ingredient expired"
              subtitle="Alert when a saved meal's ingredient goes bad"
            >
              <Toggle value={settings.ingredientExpired} onChange={set('ingredientExpired')} />
            </SettingRow>
            <div className="row-divider" />
            <SettingRow
              icon={<Zap size={18} color="#a855f7" />}
              title="Recipe recommendations"
              subtitle="Daily suggestion based on expiring items"
            >
              <Toggle value={settings.recipeRecommendations} onChange={set('recipeRecommendations')} />
            </SettingRow>
            <div className="row-divider" />
            <SettingRow
              icon={<span style={{ fontSize: 18 }}>👯</span>}
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
              <Toggle value={digestEnabled} onChange={setDigestEnabled} />
            </SettingRow>
            {digestEnabled && (
              <div className="digest-time-row">
                <p className="digest-time-label">Send at</p>
                <div className="time-chips">
                  {DIGEST_TIMES.map(t => (
                    <button
                      key={t}
                      className={`time-chip ${digestTime === t ? 'active' : ''}`}
                      onClick={() => setDigestTime(t)}
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
                <span className="preview-app">⚠️ Spoiler Alert</span>
                <span className="preview-time">now</span>
              </div>
              <p className="preview-title">Your eggs expire tomorrow!</p>
              <p className="preview-body">You can make an omelette with items in your inventory. Tap to see SPOY's suggestions.</p>
            </div>
            <div className="notif-preview" style={{ marginTop: 10 }}>
              <div className="preview-header">
                <span className="preview-app">⚠️ Spoiler Alert</span>
                <span className="preview-time">12:00 PM</span>
              </div>
              <p className="preview-title">Daily digest — 3 items expiring soon</p>
              <p className="preview-body">Blueberries (1d), Chicken Breast (2d), Greek Yogurt (3d). Tap to manage.</p>
            </div>
          </Section>

        </div>

        <button className="save-btn" onClick={handleSave}>
          Save Preferences
        </button>
      </div>
    </div>
  )
}

export default NotificationSettingsPage
