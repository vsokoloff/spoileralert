import client from './client'

export const getItems = async (filters = {}) => {
  const params = new URLSearchParams()
  if (filters.category) params.append('category', filters.category)
  if (filters.location) params.append('location', filters.location)
  if (filters.search) params.append('search', filters.search)
  if (filters.expired_only) params.append('expired_only', 'true')
  
  const response = await client.get(`/api/items?${params.toString()}`)
  return response.data
}

export const getItem = async (id) => {
  const response = await client.get(`/api/items/${id}`)
  return response.data
}

export const createItem = async (item) => {
  const response = await client.post('/api/items', item)
  return response.data
}

export const updateItem = async (id, item) => {
  const response = await client.put(`/api/items/${id}`, item)
  return response.data
}

export const deleteItem = async (id) => {
  const response = await client.delete(`/api/items/${id}`)
  return response.data
}

export const getRecentlyDeleted = async () => {
  const response = await client.get('/api/items/deleted/recent')
  return response.data
}

export const restoreItem = async (deletedId) => {
  const response = await client.post(`/api/items/deleted/${deletedId}/restore`)
  return response.data
}
