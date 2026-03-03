import client from './client'

export const chatWithSPOY = async (message) => {
  const response = await client.post('/api/spoy/chat', { message })
  return response.data
}

export const getSPOYHistory = async () => {
  const response = await client.get('/api/spoy/history')
  return response.data
}

export const getAutoRecommendations = async () => {
  const response = await client.get('/api/spoy/auto-recommend')
  return response.data
}
