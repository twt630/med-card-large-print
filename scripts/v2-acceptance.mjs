import { chromium } from 'playwright-core'

const errors = []
const browser = await chromium.launch({ channel: 'chrome', headless: true })

const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  →  ' + detail : ''}`)
  if (!ok) process.exitCode = 1
}

const newPage = async (viewport) => {
  const context = await browser.newContext({
    viewport,
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  const page = await context.newPage()
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  return { context, page }
}

// ---------- 桌面端 ----------
{
  const { context, page } = await newPage({ width: 1440, height: 900 })
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })

  // 1. 默认爷爷示例：阿托伐他汀（睡前色块出现）
  await page.waitForSelector('.slot-title')
  const slots = await page.locator('.slot-title').allTextContents()
  check('默认示例含睡前时段（阿托伐他汀）', slots.some((t) => t.includes('睡前')), slots.join(' / '))
  const grandpaNames = await page.locator('.drug-name').allTextContents()
  check('无硝苯地平', !grandpaNames.includes('硝苯地平'), grandpaNames.join(','))

  // 2. 冲突预警演示按钮 → 红色横幅两条
  await page.getByRole('button', { name: '一键体验：⚠️ 冲突预警演示' }).click()
  const banner = page.locator('.card-warning')
  await banner.waitFor()
  const bannerText = (await banner.innerText()).replace(/\n/g, ' ')
  check('冲突演示显示红色横幅', bannerText.includes('布洛芬与阿司匹林') && bannerText.includes('头孢'), bannerText.slice(0, 60))

  // 3. 空卡：删光药品 → 操作按钮禁用
  for (let i = 0; i < 3; i++) {
    await page.locator('button[aria-label^="删除"]').first().click()
  }
  await page.waitForFunction(() => document.querySelectorAll('[aria-label="药品 1"]').length === 0)
  const disabled = await page.locator('[aria-label="操作栏"] button').evaluateAll(
    (btns) => btns.map((b) => b.disabled),
  )
  check('空卡时四个操作按钮全部禁用', disabled.every((d) => d === true), JSON.stringify(disabled))

  // 4. localStorage：重开示例改标题 → reload 恢复
  await page.getByRole('button', { name: '一键体验：爷爷的高血压+降糖日常' }).click()
  await page.getByLabel('卡片标题').fill('验收专用标题')
  await page.reload({ waitUntil: 'networkidle' })
  const restoredTitle = await page.getByLabel('卡片标题').inputValue()
  check('刷新后 localStorage 恢复标题', restoredTitle === '验收专用标题', restoredTitle)

  // 5. 分享链接 + 阅读模式
  await page.getByRole('button', { name: '🔗 发给爸妈看' }).click()
  await page.waitForSelector('[role="status"]')
  const statusText = await page.locator('[role="status"]').innerText()
  check('复制提示出现', statusText.includes('专属链接已复制'), statusText)
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  check('剪贴板链接带 #share=', /#share=[A-Za-z0-9\-_]+$/.test(sharedUrl), sharedUrl.slice(-40))

  const reader = await context.newPage()
  reader.on('pageerror', (e) => errors.push(String(e)))
  await reader.goto(sharedUrl, { waitUntil: 'networkidle' })
  check('打开链接进入阅读模式（无编辑区）', (await reader.locator('[aria-label="编辑区"]').count()) === 0)
  check('阅读模式有切回按钮', (await reader.getByRole('button', { name: '我是子女，我要修改药单' }).count()) === 1)
  const readerButtons = await reader.locator('[aria-label="操作栏"] button').allTextContents()
  check('阅读模式只有三个操作按钮', readerButtons.length === 3 && readerButtons.some((t) => t.includes('慢速念一遍')), readerButtons.join('|'))
  await reader.screenshot({ path: 'screenshots/v2-reader-mode.png', fullPage: true })
  await reader.getByRole('button', { name: '我是子女，我要修改药单' }).click()
  check('切回编辑模式', (await reader.locator('[aria-label="编辑区"]').count()) === 1)

  // 6. 横幅出现在导出图里（html2canvas 采样红色）
  const conflict2 = await context.newPage()
  await conflict2.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await conflict2.getByRole('button', { name: '一键体验：⚠️ 冲突预警演示' }).click()
  await conflict2.locator('.card-warning').waitFor()
  const bannerSample = await conflict2.evaluate(async () => {
    const mod = await import('/src/lib/exportImage.js')
    let capturedBlob = null
    const orig = URL.createObjectURL.bind(URL)
    URL.createObjectURL = (b) => {
      capturedBlob = b
      return orig(b)
    }
    const node = document.querySelector('.card-title').closest('div')
    await mod.exportCardImage(node, 'x.png')
    URL.createObjectURL = orig
    const bmp = await createImageBitmap(capturedBlob)
    const canvas = document.createElement('canvas')
    canvas.width = bmp.width
    canvas.height = bmp.height
    canvas.getContext('2d').drawImage(bmp, 0, 0)
    const bannerRect = document.querySelector('.card-warning').getBoundingClientRect()
    const cardRect = node.getBoundingClientRect()
    const scale = canvas.width / cardRect.width
    const x = Math.round((bannerRect.left - cardRect.left + 8) * scale)
    const y = Math.round((bannerRect.top - cardRect.top + bannerRect.height / 2) * scale)
    const [r, g, b] = canvas.getContext('2d').getImageData(x, y, 1, 1).data
    return { r, g, b }
  })
  check(
    '导出图片包含红色预警横幅',
    bannerSample.r > 180 && bannerSample.g < 80,
    `rgb(${bannerSample.r},${bannerSample.g},${bannerSample.b})`,
  )
  await conflict2.close()

  // 7. 按钮不换行
  const noWrap = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-label="操作栏"] button')].every(
      (b) => b.getBoundingClientRect().height < 90,
    ),
  )
  check('操作按钮无换行', noWrap)

  await page.screenshot({ path: 'screenshots/v2-warning-banner.png', fullPage: true })
  await context.close()
}

// ---------- 手机端 ----------
{
  const { context, page } = await newPage({ width: 390, height: 844 })
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })

  const noWrapMobile = await page.evaluate(() =>
    [...document.querySelectorAll('[aria-label="操作栏"] button')].every(
      (b) => b.getBoundingClientRect().height < 90,
    ),
  )
  check('手机端操作按钮无换行', noWrapMobile)

  const hint = await page.locator('p.no-print.bg-teal-50').first().innerText()
  check('手机端提示语无「左侧/左边」', !/左侧|左边/.test(hint), hint)

  await page.getByRole('button', { name: '一键体验：⚠️ 冲突预警演示' }).click()
  await page.locator('.card-warning').waitFor()
  check('手机端预警横幅可见', await page.locator('.card-warning').isVisible())
  await page.screenshot({ path: 'screenshots/v2-mobile-warning.png', fullPage: true })

  await context.close()
}

await browser.close()
console.log('\n控制台/页面错误：', errors.length === 0 ? '无' : errors.join('\n'))
if (errors.length > 0) process.exitCode = 1
