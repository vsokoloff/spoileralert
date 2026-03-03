// Simple test page to verify React is working
function TestPage() {
  return (
    <div style={{
      padding: '40px',
      background: '#1a1a1a',
      color: '#fff',
      minHeight: '100vh',
      fontSize: '24px'
    }}>
      <h1>✅ React is Working!</h1>
      <p>If you see this, the frontend is loading correctly.</p>
      <p style={{ color: '#4a9eff' }}>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  )
}

export default TestPage
