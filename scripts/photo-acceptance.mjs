import { chromium } from 'playwright-core'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })

// 1. 上传照片到第一种药（氨氯地平）
await page.getByLabel(/选择 氨氯地平 的照片/).setInputFiles('scripts/test-photo.png')
await page.waitForSelector('img[alt="氨氯地平的实拍照片"]')
const previewShown = await page.locator('.drug-photo img').isVisible()

// 2. 存图导出：拦截下载并采样照片区域像素，确认红色照片真的进入导出结果
const exportSample = await page.evaluate(async () => {
  const mod = await import('/src/lib/exportImage.js')
  let capturedBlob = null
  const origCreateObjectURL = URL.createObjectURL.bind(URL)
  URL.createObjectURL = (b) => {
    capturedBlob = b
    return origCreateObjectURL(b)
  }
  const node = document.querySelector('.card-title').closest('div')
  await mod.exportCardImage(node, 'x.png')
  URL.createObjectURL = origCreateObjectURL

  const bmp = await createImageBitmap(capturedBlob)
  const canvas = document.createElement('canvas')
  canvas.width = bmp.width
  canvas.height = bmp.height
  canvas.getContext('2d').drawImage(bmp, 0, 0)

  const photo = document.querySelector('.drug-photo img').getBoundingClientRect()
  const card = node.getBoundingClientRect()
  const scale = canvas.width / card.width
  const x = Math.round((photo.left - card.left + photo.width / 2) * scale)
  const y = Math.round((photo.top - card.top + photo.height / 2) * scale)
  const [r, g, b] = canvas.getContext('2d').getImageData(x, y, 1, 1).data
  return { canvasWidth: canvas.width, sample: { x, y, r, g, b } }
})

// 3. 移除照片回落 SVG
await page.getByRole('button', { name: '✕ 移除照片' }).click()
const svgBack = await page.getByRole('img', { name: '纯白圆片' }).first().isVisible()
const photoGone = (await page.locator('.drug-photo').count()) === 0

// 4. 重新上传并检查打印媒体样式
await page.getByLabel(/选择 氨氯地平 的照片/).setInputFiles('scripts/test-photo.png')
await page.waitForSelector('img[alt="氨氯地平的实拍照片"]')
await page.emulateMedia({ media: 'print' })
const printCheck = await page.evaluate(() => {
  const img = document.querySelector('.drug-photo img')
  const box = document.querySelector('.drug-photo')
  const rect = img?.getBoundingClientRect()
  const style = box ? getComputedStyle(box) : null
  return {
    photoInPrint: !!img && rect.height > 0,
    width: style?.width,
    borderRadius: style?.borderRadius,
    overflow: style?.overflow,
  }
})
await page.screenshot({ path: 'screenshots/photo-print.png', fullPage: true })
await page.emulateMedia({ media: 'screen' })
await page.screenshot({ path: 'screenshots/photo-desktop.png', fullPage: true })

await browser.close()

console.log(
  JSON.stringify(
    {
      previewShown,
      exportSample,
      removeFallsBackToSvg: svgBack && photoGone,
      printCheck,
    },
    null,
    2,
  ),
)
