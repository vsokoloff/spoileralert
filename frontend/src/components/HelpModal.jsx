import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Camera, FileText, Bell, Sparkles, Tags, Trash2, Filter, Search } from 'lucide-react'
import './HelpModal.css'

const STEPS = [
  {
    icon: '🥦',
    title: 'Welcome to Spoiler Alert',
    subtitle: 'Your smart fridge companion',
    body: 'Spoiler Alert helps you track food before it goes bad, reduce waste, and get recipe ideas from what you already have. Here\'s a quick tour of everything you can do.',
    tip: null,
  },
  {
    icon: <Camera size={32} />,
    title: 'Scan a Receipt',
    subtitle: 'Add items in seconds',
    body: 'Tap "Add Items" then "Scan Receipt" to photograph a grocery receipt. The app reads it automatically and pulls out all your food items — just review and confirm.',
    tip: '💡 Works best with clear, flat receipts in good lighting.',
  },
  {
    icon: <FileText size={32} />,
    title: 'Manual Entry with Smart Fill',
    subtitle: 'Type a food name and we\'ll do the rest',
    body: 'Start typing any food name and a dropdown appears with suggestions. Tap one to auto-fill the category, storage location, and expiration date — all based on real food safety guidelines.',
    tip: '💡 You can always override the filled-in values.',
  },
  {
    icon: '🟢',
    title: 'Color Status System',
    subtitle: 'Know what needs attention at a glance',
    body: (
      <div className="help-color-list">
        <div className="help-color-row"><span className="dot green" /> <span><strong>Green</strong> — 7+ days, you\'re good</span></div>
        <div className="help-color-row"><span className="dot yellow" /> <span><strong>Yellow</strong> — 3–6 days, use it soon</span></div>
        <div className="help-color-row"><span className="dot red" /> <span><strong>Red</strong> — under 3 days or expired</span></div>
      </div>
    ),
    tip: '💡 Items are sorted by expiration by default so red ones bubble up.',
  },
  {
    icon: <Filter size={32} />,
    title: 'Sort, Filter & Bulk Delete',
    subtitle: 'Find and manage items fast',
    body: 'On the All Items page, tap the sliders icon to sort by expiration, name, or recently added, and filter by category or status. Tap the checkbox icon to select multiple items and delete them at once.',
    tip: '💡 Filter by "Expiring Soon" to quickly see what needs eating.',
  },
  {
    icon: <Sparkles size={32} />,
    title: 'SPOY — Recipe Assistant',
    subtitle: 'Cook what you have, waste less',
    body: 'SPOY is your AI recipe assistant. It knows what\'s in your fridge and prioritizes items expiring soon. Ask it anything — "quick 15-min dinner", "use my expiring chicken", or "healthy ideas tonight".',
    tip: '💡 SPOY opens with automatic suggestions every time you visit.',
  },
  {
    icon: <Tags size={32} />,
    title: 'Roommate Sharing',
    subtitle: 'Tag who food belongs to',
    body: 'When adding or editing an item, use the "Shared With" field to tag a roommate\'s name. Their name appears as a badge on the item card so everyone knows whose food is whose.',
    tip: '💡 Try "Sarah", "Everyone", or "Mine" as tags.',
  },
  {
    icon: <Bell size={32} />,
    title: 'Notifications',
    subtitle: 'Never let food expire silently',
    body: 'Go to Notification Settings to configure when and how you get alerted. Get push notifications when food is about to expire, when a recipe uses expiring items, or when your fridge is empty.',
    tip: '💡 Daily digest at noon keeps you on top of expiring items.',
  },
  {
    icon: <Trash2 size={32} />,
    title: 'Undo Deletes',
    subtitle: 'Accidentally deleted something?',
    body: 'Every deleted item is saved for a short window. Go to Settings → Recently Deleted to restore anything you removed by mistake.',
    tip: '💡 Items are kept for 24 hours before being permanently removed.',
  },
]

export function HelpModal({ isOpen, onClose, startAtStep = 0 }) {
  const [step, setStep] = useState(startAtStep)

  useEffect(() => {
    if (isOpen) setStep(startAtStep)
  }, [isOpen, startAtStep])

  if (!isOpen) return null

  const current = STEPS[step]
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="help-overlay" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <button className="help-close" onClick={onClose}><X size={20} /></button>

        {/* Progress bar */}
        <div className="help-progress-track">
          <div className="help-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Step counter */}
        <p className="help-step-count">{step + 1} of {STEPS.length}</p>

        {/* Content */}
        <div className="help-content">
          <div className="help-icon">
            {typeof current.icon === 'string' ? (
              <span className="help-emoji">{current.icon}</span>
            ) : (
              <span className="help-icon-svg">{current.icon}</span>
            )}
          </div>
          <h2 className="help-title">{current.title}</h2>
          <p className="help-subtitle">{current.subtitle}</p>
          <div className="help-body">
            {typeof current.body === 'string' ? <p>{current.body}</p> : current.body}
          </div>
          {current.tip && (
            <div className="help-tip">{current.tip}</div>
          )}
        </div>

        {/* Navigation */}
        <div className="help-nav">
          <button
            className="help-nav-btn secondary"
            onClick={() => setStep(s => s - 1)}
            disabled={isFirst}
          >
            <ChevronLeft size={18} /> Back
          </button>

          {/* Dot indicators */}
          <div className="help-dots">
            {STEPS.map((_, i) => (
              <button
                key={i}
                className={`help-dot ${i === step ? 'active' : ''}`}
                onClick={() => setStep(i)}
              />
            ))}
          </div>

          {isLast ? (
            <button className="help-nav-btn primary" onClick={onClose}>
              Got it! ✓
            </button>
          ) : (
            <button className="help-nav-btn primary" onClick={() => setStep(s => s + 1)}>
              Next <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default HelpModal
