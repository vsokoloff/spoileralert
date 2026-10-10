import client from './client'

export const getNotifications = async (unreadOnly = false, days = 1, includeExpired = false) => {
  const response = await client.get(
    `/api/notifications?unread_only=${unreadOnly}&days=${days}&include_expired=${includeExpired}`
  )
  return response.data
}

export const markAsRead = async (id) => {
  const response = await client.put(`/api/notifications/${id}/read`)
  return response.data
}

export const deleteNotification = async (id) => {
  const response = await client.delete(`/api/notifications/${id}`)
  return response.data
}
