// Reads Sinhala text from scanned pages and images with Tesseract (tesseract.js and its Sinhala model, all served
// from vendor/tesseract/ and run in the browser). About 5 MB is downloaded the first time.
const VENDOR = new URL('./vendor/tesseract/', import.meta.url).href

let workerPromise, progress = () => {}
// onProgress({ status, progress }) while the model loads and while a page is read
export function ocrWorker(onProgress) {
    if (onProgress) progress = onProgress
    return workerPromise ||= (async () => {
        const T = await import(VENDOR + 'tesseract.esm.min.js')
        const createWorker = T.createWorker || T.default.createWorker
        // 1: the LSTM engine, the only one the Sinhala model has
        return createWorker('sin', 1, {
            workerPath: VENDOR + 'worker.min.js', corePath: VENDOR + 'core/', langPath: VENDOR + 'lang/', gzip: true,
            logger: (m) => progress(m),
        })
    })()
}

// a PDF page as a canvas, at about 300 dpi
export async function renderPage(doc, number, dpi = 300) {
    const page = await doc.getPage(number)
    const viewport = page.getViewport({ scale: dpi / 72 })
    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    await page.render({ canvasContext: ctx, viewport }).promise
    page.cleanup()
    return canvas
}

// text of an image, canvas or image file, as paragraphs
export async function ocr(image, onProgress) {
    const worker = await ocrWorker(onProgress)
    const { data } = await worker.recognize(image)
    // Tesseract puts a ZWNJ after every hal
    return data.text.replace(/\u200C/g, '').split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean)
}
