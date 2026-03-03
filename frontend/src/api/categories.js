import client from './client'

export const getCategories = async () => {
  const response = await client.get('/api/categories')
  return response.data
}

export const getItemsByCategory = async (category) => {
  const response = await client.get(`/api/categories/${category}/items`)
  return response.data
}
