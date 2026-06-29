import client from './client'
import { setLocalCategoryColors } from '../utils/colors'

export const register = async (name, email, password) => {
  const response = await client.post('/api/users/register', { name, email, password })
  return response.data
}

export const updateCategoryColors = async (colors) => {
  const response = await client.put('/api/users/me/category-colors', { colors })
  if (response.data?.category_colors) setLocalCategoryColors(response.data.category_colors)
  return response.data
}

export const deleteAccount = async () => {
  const response = await client.delete('/api/users/me')
  return response.data
}

export const login = async (email, password) => {
  const response = await client.post('/api/users/login', { email, password })
  return response.data
}

export const getMe = async () => {
  const response = await client.get('/api/users/me')
  return response.data
}

export const saveAuth = (tokenResponse) => {
  localStorage.setItem('token', tokenResponse.access_token)
  localStorage.setItem('user', JSON.stringify(tokenResponse.user))
  if (tokenResponse.user?.category_colors) {
    setLocalCategoryColors(tokenResponse.user.category_colors)
  }
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

export const getUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const isLoggedIn = () => {
  return !!localStorage.getItem('token')
}
