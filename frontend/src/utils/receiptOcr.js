// On-device receipt OCR via Tesseract.js (WASM, runs inside the webview).
// The worker, core, and English language data are bundled in /public/tesseract,
// so no image or text ever leaves the device for OCR — and it works offline.
// Receipt text is then parsed into food items by the backend's shelf-life
// heuristics (no AI service involved).

import { createWorker } from 'tesseract.js'

const ASSET_BASE = '/tesseract'

let workerPromise = null

const getWorker = () => {
  if (!workerPromise) {
    workerPromise = createWorker('eng', 1, {
      workerPath: `${ASSET_BASE}/worker.min.js`,
      corePath: ASSET_BASE,
      langPath: ASSET_BASE,
      gzip: true,
    })
  }
  return workerPromise
}

/**
 * Extract raw text from a receipt image (data URL). Entirely on-device.
 * Throws if OCR fails — callers may fall back to the server-side AI scan.
 */
export const recognizeReceiptText = async (imageDataUrl) => {
  const worker = await getWorker()
  const { data } = await worker.recognize(imageDataUrl)
  return data.text || ''
}
