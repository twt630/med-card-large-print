import { chromium } from 'playwright-core'

const errors = []
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  permissions: ['clipboard-read', 'clipboard-write'],
})
const page = await context.newPage()
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})

const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  →  ' + detail : ''}`)
  if (!ok) process.exitCode = 1
}

const URL = 'https://yao-ming-bai-5js7wnhifhp.qoder.zone'
await page.goto(URL, { waitUntil: 'networkidle' })

// 1. 无痕访问：未登录也能打开（无跳转登录页）
check('免登录可访问（无跳转）', page.url().startsWith(URL), page.url())

// 2. 首页默认加载爸爸成员示例
await page.waitForSelector('[aria-label="成员切换栏"]')
const title = await page.getByLabel('卡片标题').inputValue()
check('默认加载爸爸成员示例', title === '爸爸的每日吃药提醒', title)
const drugNames = await page.locator('.drug-name').allTextContents()
check('预览含示例药品', drugNames.some((n) => n.includes('氨氯地平')), drugNames.join(','))

// 3. 成员切换/编辑
await page.getByLabel('切换到 妈妈').click()
const momTitle = await page.getByLabel('卡片标题').inputValue()
check('成员切换生效', momTitle === '妈妈的每日吃药提醒', momTitle)
await page.getByRole('button', { name: '+ 维生素D' }).click()
await page.waitForFunction(() => document.body.innerText.includes('药品清单（4 条）'))
check('编辑添加药品生效', true)

// 4. 分享链接生成（只读模式）
await page.getByRole('button', { name: '🔗 发给家人看' }).click()
await page.waitForSelector('[role="status"]')
const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
check('分享链接带 #share=', /#share=[A-Za-z0-9\-_]+$/.test(sharedUrl), sharedUrl.slice(-30))

// 5. 只读模式在新标签打开
const reader = await context.newPage()
reader.on('pageerror', (e) => errors.push(String(e)))
await reader.goto(sharedUrl, { waitUntil: 'networkidle' })
check('只读模式无编辑区', (await reader.locator('[aria-label="编辑区"]').count()) === 0)
const readerButtons = await reader.locator('[aria-label="操作栏"] button').allTextContents()
check('只读模式三按钮（存图/朗读/打印）', readerButtons.length === 3, readerButtons.join('|'))
await reader.screenshot({ path: 'screenshots/deploy-reader-mode.png', fullPage: true })
await reader.close()

// 6. 朗读按钮可切换不报错（headless 环境语音可能直接 onerror→提示，属降级逻辑）
const speakBtn = page.getByRole('button', { name: '🔊 慢速念一遍' })
await speakBtn.click()
await page.waitForTimeout(800)
const afterSpeak = await page.getByRole('button', { name: '⏹ 停止朗读' }).count()
const statusText = await page.locator('[role="status"]').count()
check('朗读按钮进入朗读态（或降级提示）', afterSpeak === 1 || statusText === 1, `停止按钮=${afterSpeak}, 状态=${statusText}`)
if (afterSpeak === 1) {
  await page.getByRole('button', { name: '⏹ 停止朗读' }).click()
  check('停止朗读复位', (await page.getByRole('button', { name: '🔊 慢速念一遍' }).count()) === 1)
}

await page.screenshot({ path: 'screenshots/deploy-public-home.png', fullPage: true })
await context.close()
await browser.close()

console.log('\n控制台/页面错误：', errors.length === 0 ? '无' : errors.join('\n'))
if (errors.length > 0) process.exitCode = 1
