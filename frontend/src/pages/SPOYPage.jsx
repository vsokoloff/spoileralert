import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { chatWithSPOY, getSPOYHistory, getAutoRecommendations } from '../api/spoy'
import './SPOYPage.css'

function SPOYPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoLoading, setAutoLoading] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadAutoRecommendations()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadAutoRecommendations = async () => {
    setAutoLoading(true)
    try {
      const recommendation = await getAutoRecommendations()
      if (recommendation && recommendation.response) {
        setMessages([{ role: 'assistant', content: recommendation.response }])
      }
    } catch (error) {
      console.error('Error loading auto recommendations:', error)
      // Fallback to welcome message
      setMessages([])
    } finally {
      setAutoLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const history = await getSPOYHistory()
      const formatted = history.map(h => [
        { role: 'user', content: h.message },
        { role: 'assistant', content: h.response }
      ]).flat()
      setMessages(formatted)
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await chatWithSPOY(input)
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }])
    } catch (error) {
      console.error('Error chatting with SPOY:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="spoy-page">
      <header className="spoy-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={24} />
        </button>
        <div className="spoy-title">
          <h1>SPOY</h1>
          <p className="subtitle">Recipe Assistant</p>
        </div>
        <div style={{ width: 24 }} />
      </header>

      <div className="messages-container">
        {autoLoading && messages.length === 0 && (
          <div className="welcome-message">
            <p>👋 Hi! I'm SPOY, your recipe assistant. Checking what's expiring soon...</p>
            <span className="typing-indicator">
              <span></span><span></span><span></span>
            </span>
          </div>
        )}
        
        {!autoLoading && messages.length === 0 && (
          <div className="welcome-message">
            <p>Get recipe suggestions based on what's in your fridge.</p>
            <p className="example">Try: "What can I make with eggs and feta?"</p>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="message assistant">
            <div className="message-content loading">
              <span className="typing-indicator">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form className="input-form" onSubmit={handleSend}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask SPOY for recipe suggestions..."
          className="message-input"
          disabled={loading}
        />
        <button type="submit" className="send-btn" disabled={loading || !input.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  )
}

export default SPOYPage
