import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  encodeCardForShare,
  buildShareUrl,
  decodeCardFromHash,
} from '../src/lib/shareLink.js'
import ActionBar from '../src/components/ActionBar.jsx'
import App from '../src/App.jsx'
import { SAMPLE_GRANDPA } from '../src/data/samples.js'

const card = (drugs, title = '分享卡') => ({
  title,
  drugs: drugs.map((d, i) => ({
    id: `d${i}`,
    name: d.name,
    times: d.times,
    dose: d.dose ?? '1片',
    meal: d.meal ?? '',
    pillIcon: d.pillIcon ?? 'white',
    photoData: d.photoData ?? '',
    note: d.note ?? '',
  })),
})

afterEach(() => {
  window.location.hash = ''
})

describe('encodeCardForShare / decodeCardFromHash', () => {
  it('中文与字段完整往返，照片 base64 不进链接', () => {
    const source = card(
      [
        {
          name: '氨氯地平',
          times: ['早', '晚'],
          dose: '1片',
          meal: '饭后',
          pillIcon: 'yellowOval',
          note: '忌吃西柚',
          photoData: 'data:image/png;base64,TOO_BIG',
        },
      ],
      '爷爷的吃药卡',
    )
    const encoded = encodeCardForShare(source)
    expect(encoded).not.toContain('TOO_BIG')
    expect(encoded).toMatch(/^[A-Za-z0-9\-_]+$/)

    const decoded = decodeCardFromHash(`#share=${encoded}`)
    expect(decoded.title).toBe('爷爷的吃药卡')
    expect(decoded.drugs).toHaveLength(1)
    expect(decoded.drugs[0].name).toBe('氨氯地平')
    expect(decoded.drugs[0].times).toEqual(['早', '晚'])
    expect(decoded.drugs[0].dose).toBe('1片')
    expect(decoded.drugs[0].meal).toBe('饭后')
    expect(decoded.drugs[0].pillIcon).toBe('yellowOval')
    expect(decoded.drugs[0].note).toBe('忌吃西柚')
    expect(decoded.drugs[0].photoData).toBe('')
  })

  it('空药名的药品不进分享链接', () => {
    const encoded = encodeCardForShare(
      card([{ name: '药A', times: ['早'] }, { name: '', times: ['早'] }]),
    )
    expect(decodeCardFromHash(`share=${encoded}`).drugs).toHaveLength(1)
  })

  it('非法哈希返回 null', () => {
    expect(decodeCardFromHash('')).toBeNull()
    expect(decodeCardFromHash('#other=x')).toBeNull()
    expect(decodeCardFromHash('#share=!!!!not-base64!!!!')).toBeNull()
    expect(decodeCardFromHash('#share=bm90LWEtanNvbg')).toBeNull() // "not-a-json"
  })

  it('buildShareUrl 生成带 #share= 的当前页面链接', () => {
    const url = buildShareUrl(SAMPLE_GRANDPA)
    expect(url).toContain(window.location.origin)
    expect(url).toMatch(/#share=[A-Za-z0-9\-_]+$/)
  })
})

describe('ActionBar 分享按钮', () => {
  it('点击后复制链接并提示', async () => {
    // 注意：userEvent.setup() 会接管 navigator.clipboard，mock 必须在其之后注入
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    render(<ActionBar card={SAMPLE_GRANDPA} cardNode={{ current: null }} />)

    await user.click(screen.getByRole('button', { name: '🔗 发给爸妈看' }))
    expect(writeText).toHaveBeenCalledOnce()
    expect(writeText.mock.calls[0][0]).toMatch(/#share=/)
    expect(await screen.findByRole('status')).toHaveTextContent('专属链接已复制')
    delete navigator.clipboard
  })

  it('空卡时分享按钮禁用', () => {
    render(
      <ActionBar
        card={{ title: '空', drugs: [] }}
        cardNode={{ current: null }}
        canAct={false}
      />,
    )
    expect(screen.getByRole('button', { name: '🔗 发给爸妈看' })).toBeDisabled()
  })
})

describe('爸妈纯净阅读模式', () => {
  const openWithHash = () => {
    const encoded = encodeCardForShare(
      card([{ name: '氨氯地平', times: ['早'], note: '忌吃西柚' }], '爸妈阅读卡'),
    )
    window.location.hash = `share=${encoded}`
    return encoded
  }

  it('带 #share= 打开时进入阅读模式，可切回编辑', async () => {
    const user = userEvent.setup()
    openWithHash()
    render(<App />)

    // 阅读模式：无编辑区、无示例栏，显示分享卡片内容
    expect(screen.queryByLabelText('编辑区')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /一键体验/ })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '爸妈阅读卡' })).toBeInTheDocument()
    expect(screen.getByText('氨氯地平')).toBeInTheDocument()
    expect(screen.getByText(/忌吃西柚/)).toBeInTheDocument()

    // 底部只有三个操作按钮，无分享按钮
    expect(screen.getByRole('button', { name: '📷 保存高清图' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '🔊 慢速念一遍' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '🖨 打印卡片' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '🔗 发给爸妈看' })).not.toBeInTheDocument()

    // 切回编辑模式
    await user.click(screen.getByRole('button', { name: '我是子女，我要修改药单' }))
    expect(screen.getByLabelText('编辑区')).toBeInTheDocument()
    expect(screen.getByDisplayValue('爸妈阅读卡')).toBeInTheDocument()
  })

  it('阅读模式不写入 localStorage', () => {
    openWithHash()
    render(<App />)
    expect(localStorage.getItem('yao-ming-bai-card-v1')).toBeNull()
  })

  it('普通打开仍是编辑模式', () => {
    render(<App />)
    expect(screen.getByLabelText('编辑区')).toBeInTheDocument()
  })
})
