import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

mkdirSync('screenshots', { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })

const desktopCols = await page.evaluate(() =>
  getComputedStyle(document.querySelector('main')).gridTemplateColumns,
)
await page.screenshot({ path: 'screenshots/desktop.png', fullPage: true })

await page.setViewportSize({ width: 390, height: 844 })
const mobileCols = await page.evaluate(() =>
  getComputedStyle(document.querySelector('main')).gridTemplateColumns,
)
await page.screenshot({ path: 'screenshots/mobile.png', fullPage: true })

await page.setViewportSize({ width: 1440, height: 900 })
await page.emulateMedia({ media: 'print' })
const printCheck = await page.evaluate(() => ({
  editorDisplay: getComputedStyle(document.querySelector('[aria-label="编辑区"]').closest('.no-print')).display,
  headerDisplay: getComputedStyle(document.querySelector('header')).display,
  actionBarDisplay: getComputedStyle(document.querySelector('[aria-label="操作栏"]')).display,
  cardTitleFont: getComputedStyle(document.querySelector('.card-title')).fontSize,
  cardVisible: !!document.querySelector('.card-title')?.offsetParent || document.querySelector('.card-title').getBoundingClientRect().height > 0,
}))
await page.screenshot({ path: 'screenshots/print-a4.png', fullPage: true })
await browser.close()

console.log(JSON.stringify({ desktopCols, mobileCols, printCheck }, null, 2))
