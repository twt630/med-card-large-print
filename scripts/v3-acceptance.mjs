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

// ---------- 桌面端：多成员主流程 ----------
{
  const { context, page } = await newPage({ width: 1440, height: 900 })
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })

  // 1. 默认爸爸/妈妈两位成员，爸爸选中
  await page.waitForSelector('[aria-label="成员切换栏"]')
  const pressed = await page.locator('[aria-label="成员切换栏"] button[aria-pressed]').all()
  const babaPressed = await page.getByLabel('切换到 爸爸').getAttribute('aria-pressed')
  check('默认成员为爸爸、妈妈两位', (await page.getByLabel('切换到 妈妈').count()) === 1, `共 ${pressed.length} 个切换按钮`)
  check('爸爸默认选中', babaPressed === 'true')
  const title = await page.getByLabel('卡片标题').inputValue()
  check('爸爸成员默认标题', title === '爸爸的每日吃药提醒', title)
  await page.screenshot({ path: 'screenshots/v3-member-tabs.png', fullPage: true })

  // 2. 切换到妈妈：编辑区与预览区同步
  await page.getByLabel('切换到 妈妈').click()
  const momTitle = await page.getByLabel('卡片标题').inputValue()
  const previewText = await page.locator('[aria-label="卡片预览区"]').innerText()
  check('切换妈妈后标题同步', momTitle === '妈妈的每日吃药提醒', momTitle)
  check('预览区同步显示妈妈的药', previewText.includes('阿莫西林') && previewText.includes('妈妈的每日吃药提醒'))

  // 3. 添加家人（行内输入 → 确认）
  await page.getByRole('button', { name: '＋ 添加家人' }).click()
  await page.getByLabel('新成员称呼').fill('外婆')
  await page.getByRole('button', { name: '确认添加成员' }).click()
  const waipoPressed = await page.getByLabel('切换到 外婆').getAttribute('aria-pressed')
  check('新增外婆成员并自动切换', waipoPressed === 'true')
  const waipoTitle = await page.getByLabel('卡片标题').inputValue()
  check('新成员默认标题', waipoTitle === '外婆的每日吃药提醒', waipoTitle)
  const listCount = await page.getByText(/药品清单（0 条）/).count()
  check('新成员药单为空', listCount === 1)

  // 4. 给外婆加一种药 → 刷新后数据持久化
  await page.getByRole('button', { name: '+ 维生素D' }).click()
  await page.waitForFunction(() => document.body.innerText.includes('药品清单（1 条）'))
  await page.reload({ waitUntil: 'networkidle' })
  const waipoPressedAfter = await page.getByLabel('切换到 外婆').getAttribute('aria-pressed')
  check('刷新后外婆仍在且保持选中', waipoPressedAfter === 'true')
  const drugAfterReload = await page.getByText(/药品清单（1 条）/).count()
  check('刷新后药单恢复（1 条）', drugAfterReload === 1)
  const momAfterReload = await page.getByLabel('切换到 妈妈').count()
  check('刷新后妈妈成员也在', momAfterReload === 1)

  // 5. 删除成员：确认后移除并切到相邻成员
  await page.getByLabel('删除成员 外婆').click()
  await page.getByLabel('确认删除成员 外婆').click()
  await page.waitForFunction(() => !document.querySelector('[aria-label="切换到 外婆"]'))
  const neighborPressed = await page.getByLabel('切换到 妈妈').getAttribute('aria-pressed')
  check('删除外婆后选中切到相邻成员（妈妈）', neighborPressed === 'true')

  // 6. 仅剩一位时删除按钮禁用
  await page.getByLabel('删除成员 爸爸').click()
  await page.getByLabel('确认删除成员 爸爸').click()
  await page.waitForFunction(() => document.querySelectorAll('[aria-label^="切换到"]').length === 1)
  const lastDeleteDisabled = await page.getByLabel('删除成员 妈妈').isDisabled()
  check('仅剩一位成员时删除按钮禁用', lastDeleteDisabled)

  // 7. 分享链接 → 只读模式（新开无痕式页面）
  await page.getByRole('button', { name: '一键体验：妈妈的感冒消炎用药' }).click()
  await page.getByRole('button', { name: '🔗 发给家人看' }).click()
  await page.waitForSelector('[role="status"]')
  const statusText = await page.locator('[role="status"]').innerText()
  check('复制提示出现（发给家人看）', statusText.includes('专属链接已复制') && statusText.includes('家人'), statusText)
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText())
  check('剪贴板链接带 #share=', /#share=[A-Za-z0-9\-_]+$/.test(sharedUrl), sharedUrl.slice(-40))

  const reader = await context.newPage()
  reader.on('pageerror', (e) => errors.push(String(e)))
  await reader.goto(sharedUrl, { waitUntil: 'networkidle' })
  check('打开链接进入只读模式（无编辑区）', (await reader.locator('[aria-label="编辑区"]').count()) === 0)
  check('只读模式无成员切换栏', (await reader.locator('[aria-label="成员切换栏"]').count()) === 0)
  const readerTitle = await reader.locator('.card-title').first().innerText()
  check('只读模式显示当前成员卡片标题', readerTitle.includes('妈妈的感冒消炎用药'), readerTitle)
  const readerButtons = await reader.locator('[aria-label="操作栏"] button').allTextContents()
  check('只读模式只有三个操作按钮（存图/朗读/打印）', readerButtons.length === 3, readerButtons.join('|'))
  await reader.screenshot({ path: 'screenshots/v3-reader-mode.png', fullPage: true })
  await reader.getByRole('button', { name: '我是子女，我要修改药单' }).click()
  check('切回编辑模式（编辑区出现）', (await reader.locator('[aria-label="编辑区"]').count()) === 1)
  const hashCleared = await reader.evaluate(() => window.location.hash)
  check('切回编辑后地址栏 hash 已清除', hashCleared === '', JSON.stringify(hashCleared))
  await reader.close()

  await context.close()
}

// ---------- 照片压缩持久化 ----------
{
  const { context, page } = await newPage({ width: 1440, height: 900 })
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await page.getByLabel('选择 氨氯地平 的照片').setInputFiles('scripts/test-photo.png')
  await page.waitForSelector('img[alt="氨氯地平的实拍照片"]')
  await page.waitForFunction(() => {
    const raw = localStorage.getItem('yao-ming-bai-members-v1')
    if (!raw) return false
    const data = JSON.parse(raw)
    return data.members.some((m) =>
      m.drugs.some((d) => (d.photoData || '').startsWith('data:image/jpeg')),
    )
  })
  const stored = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('yao-ming-bai-members-v1'))
    for (const m of data.members) {
      for (const d of m.drugs) {
        if (d.photoData) return { mime: d.photoData.slice(5, 23), chars: d.photoData.length, name: d.name }
      }
    }
    return null
  })
  check('照片以 JPEG dataURL 持久化', stored.mime.startsWith('image/jpeg'), JSON.stringify(stored))
  check('压缩后体积可控（≤ 60KB 字符）', stored.chars < 60000, `${stored.chars} chars`)
  await page.screenshot({ path: 'screenshots/v3-photo-member.png', fullPage: true })
  await context.close()
}

// ---------- 手机端 ----------
{
  const { context, page } = await newPage({ width: 390, height: 844 })
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  check('手机端成员切换栏可见', await page.locator('[aria-label="成员切换栏"]').isVisible())
  await page.getByLabel('切换到 妈妈').click()
  const momTitleMobile = await page.getByLabel('卡片标题').inputValue()
  check('手机端切换成员生效', momTitleMobile === '妈妈的每日吃药提醒', momTitleMobile)
  await page.screenshot({ path: 'screenshots/v3-mobile-member.png', fullPage: true })
  await context.close()
}

await browser.close()
console.log('\n控制台/页面错误：', errors.length === 0 ? '无' : errors.join('\n'))
if (errors.length > 0) process.exitCode = 1
