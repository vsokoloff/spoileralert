import client from './client'

export const scanReceipt = async (imageBase64) => {
  const response = await client.post('/api/receipt/scan', {
    image_base64: imageBase64
  })
  return response.data
}

export const confirmReceiptItems = async (items) => {
  const response = await client.post('/api/receipt/scan/confirm', items)
  return response.data
}
