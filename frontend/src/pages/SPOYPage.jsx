import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { chatWithSPOY, getSPOYHistory, getAutoRecommendations } from '../api/spoy'
import './SPOYPage.css'

const QUICK_SUGGESTIONS = [
  "What can I make tonight?",
  "Use my expiring items",
  "Quick 15-min recipes",
  "Healthy dinner ideas",
]

function MessageText({ content }) {
  // Render line breaks and bold text properly
  const lines = content.split('\n')
  return (
    <>
      {lines.map((line, i) => {
        // Bold **text** or numbered list items
        const parts = line.split(/(\*\*[^*]+\*\*)/g)
        return (
          <span key={i}>
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j}>{part.slice(2, -2)}</strong>
                : part
            )}
            {i < lines.length - 1 && <br />}
          </span>
        )
      })}
    </>
  )
}

function SPOYPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoLoading, setAutoLoading] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    loadAutoRecommendations()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const loadAutoRecommendations = async () => {
    setAutoLoading(true)
    try {
      const recommendation = await getAutoRecommendations()
      if (recommendation && recommendation.response) {
        setMessages([{ role: 'assistant', content: recommendation.response }])
      }
    } catch (error) {
      console.error('Error loading auto recommendations:', error)
      setMessages([])
    } finally {
      setAutoLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return
    const userMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    try {
      const response = await chatWithSPOY(text)
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }])
    } catch (error) {
      console.error('Error chatting with SPOY:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I ran into an error. Please try again.'
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSend = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleSuggestion = (suggestion) => {
    sendMessage(suggestion)
  }

  const showSuggestions = !autoLoading && messages.length <= 1

  return (
    <div className="spoy-page">
      <header className="spoy-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <div className="spoy-title">
          <div className="spoy-avatar">S</div>
          <div>
            <h1>SPOY</h1>
            <p className="subtitle">Recipe Assistant</p>
          </div>
        </div>
        <div style={{ width: 40 }} />
      </header>

      <div className="messages-container">
        {/* Loading state */}
        {autoLoading && messages.length === 0 && (
          <div className="message assistant">
            <div className="msg-avatar">S</div>
            <div className="message-content loading">
              <span className="typing-indicator">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!autoLoading && messages.length === 0 && (
          <div className="empty-chat">
            <div className="empty-avatar">S</div>
            <h3>Hey! I'm SPOY</h3>
            <p>Ask me for recipe ideas based on what's in your fridge. I'll prioritize items expiring soon.</p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.role === 'assistant' && <div className="msg-avatar">S</div>}
            <div className="message-content">
              <MessageText content={msg.content} />
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="message assistant">
            <div className="msg-avatar">S</div>
            <div className="message-content loading">
              <span className="typing-indicator">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions */}
      {showSuggestions && (
        <div className="suggestions-row">
          {QUICK_SUGGESTIONS.map((s) => (
            <button key={s} className="suggestion-chip" onClick={() => handleSuggestion(s)} disabled={loading}>
              {s}
            </button>
          ))}
        </div>
      )}

      <form className="input-form" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for recipes..."
          className="message-input"
          disabled={loading}
        />
        <button type="submit" className="send-btn" disabled={loading || !input.trim()}>
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}

export default SPOYPage
