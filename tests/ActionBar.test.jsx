import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { buildSpeechText } from '../src/lib/speakText.js'
import { createSpeaker } from '../src/lib/speak.js'
import { exportCardImage } from '../src/lib/exportImage.js'
import ActionBar from '../src/components/ActionBar.jsx'
import { SAMPLE_GRANDPA } from '../src/data/samples.js'

describe('buildSpeechText 朗读文案', () => {
  it('按早中晚睡前顺序拼接，含用量、餐时与提醒', () => {
    const text = buildSpeechText({
      title: '爷爷的吃药卡',
      drugs: [
        { id: '1', name: '晚上药', times: ['晚'], dose: '1片', meal: '', note: '' },
        { id: '2', name: '早上药', times: ['早'], dose: '2片', meal: '饭后', note: '忌吃西柚' },
      ],
    })
    expect(text).toContain('爷爷的吃药卡')
    expect(text.indexOf('早上要吃')).toBeLessThan(text.indexOf('晚上要吃'))
    expect(text).toContain('早上药，每次2片，饭后吃。注意：忌吃西柚')
    expect(text).toContain('晚上药，每次1片')
  })

  it('同药多时段只在对应时段出现', () => {
    const text = buildSpeechText({
      title: '卡',
      drugs: [{ id: '1', name: '二甲双胍', times: ['早', '晚'], dose: '1片', meal: '随餐' }],
    })
    expect(text).toContain('早上要吃：二甲双胍，每次1片，随餐吃。')
    expect(text).toContain('晚上要吃：二甲双胍，每次1片，随餐吃。')
  })

  it('空清单提示没有药品', () => {
    expect(buildSpeechText({ title: '空卡', drugs: [] })).toContain('还没有录入药品')
  })
})

describe('createSpeaker', () => {
  const synth = () => {
    const api = { speak: vi.fn(), cancel: vi.fn() }
    window.speechSynthesis = api
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text
      }
    }
    return api
  }

  afterEach(() => {
    delete window.speechSynthesis
    delete window.SpeechSynthesisUtterance
  })

  it('不支持时触发 onerror', () => {
    const speaker = createSpeaker()
    expect(speaker.supported).toBe(false)
    const onerror = vi.fn()
    speaker.speak('你好', { onerror })
    expect(onerror).toHaveBeenCalledOnce()
  })

  it('朗读使用 zh-CN、rate 0.85，停止调用 cancel', () => {
    const api = synth()
    const speaker = createSpeaker()
    const onend = vi.fn()
    speaker.speak('念一遍', { onend })
    expect(api.speak).toHaveBeenCalledOnce()
    const utterance = api.speak.mock.calls[0][0]
    expect(utterance.text).toBe('念一遍')
    expect(utterance.lang).toBe('zh-CN')
    expect(utterance.rate).toBe(0.85)
    utterance.onend()
    expect(onend).toHaveBeenCalledOnce()

    speaker.stop()
    expect(api.cancel).toHaveBeenCalled()
  })

  it('canceled/interrupted 不触发 onerror，且走 onend 正常复位', () => {
    const api = synth()
    const speaker = createSpeaker()
    const onend = vi.fn()
    const onerror = vi.fn()
    speaker.speak('念一遍', { onend, onerror })
    const utterance = api.speak.mock.calls[0][0]

    utterance.onerror({ error: 'canceled' })
    utterance.onerror({ error: 'interrupted' })
    expect(onerror).not.toHaveBeenCalled()
    expect(onend).toHaveBeenCalledTimes(2)

    utterance.onerror({ error: 'audio-busy' })
    expect(onerror).toHaveBeenCalledOnce()
    expect(onend).toHaveBeenCalledTimes(2)
  })
})

vi.mock('html2canvas', () => ({ default: vi.fn() }))

describe('exportCardImage PNG 导出', () => {
  it('以 2x scale 截图并触发下载', async () => {
    const html2canvas = (await import('html2canvas')).default
    html2canvas.mockResolvedValue({
      toBlob: (cb) => cb(new Blob(['png'], { type: 'image/png' })),
    })
    const createObjectURL = vi.fn().mockReturnValue('blob:fake-url')
    const revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const node = document.createElement('div')
    await exportCardImage(node, '测试.png')

    expect(html2canvas).toHaveBeenCalledWith(
      node,
      expect.objectContaining({ scale: 2, backgroundColor: '#FFFDF7' }),
    )
    expect(createObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')

    clickSpy.mockRestore()
    delete URL.createObjectURL
    delete URL.revokeObjectURL
  })

  it('节点缺失时抛错', async () => {
    await expect(exportCardImage(null)).rejects.toThrow('未找到要导出的卡片节点')
  })
})

describe('ActionBar 组件', () => {
  const fakeSynth = () => {
    const api = { speak: vi.fn(), cancel: vi.fn() }
    window.speechSynthesis = api
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text
      }
    }
    return api
  }

  afterEach(() => {
    delete window.speechSynthesis
    delete window.SpeechSynthesisUtterance
  })

  it('渲染四个操作按钮', () => {
    render(<ActionBar card={SAMPLE_GRANDPA} cardNode={{ current: null }} />)
    expect(screen.getByRole('button', { name: '📷 保存高清图' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '🔊 慢速念一遍' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '🖨 打印卡片' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '🔗 发给家人看' })).toBeInTheDocument()
  })

  it('canAct 为 false 时禁用全部操作按钮', () => {
    render(<ActionBar card={SAMPLE_GRANDPA} cardNode={{ current: null }} canAct={false} />)
    ;[
      '📷 保存高清图',
      '🔊 慢速念一遍',
      '🖨 打印卡片',
      '🔗 发给家人看',
    ].forEach((name) => {
      expect(screen.getByRole('button', { name })).toBeDisabled()
    })
  })

  it('showShare 为 false 时不渲染分享按钮', () => {
    render(
      <ActionBar card={SAMPLE_GRANDPA} cardNode={{ current: null }} showShare={false} />,
    )
    expect(screen.queryByRole('button', { name: '🔗 发给家人看' })).not.toBeInTheDocument()
  })

  it('浏览器不支持语音时给出提示', async () => {
    const user = userEvent.setup()
    render(<ActionBar card={SAMPLE_GRANDPA} cardNode={{ current: null }} />)
    await user.click(screen.getByRole('button', { name: '🔊 慢速念一遍' }))
    expect(screen.getByRole('status')).toHaveTextContent('当前浏览器不支持语音朗读')
  })

  it('点击朗读进入朗读态，再点击停止并 cancel', async () => {
    const api = fakeSynth()
    const user = userEvent.setup()
    render(<ActionBar card={SAMPLE_GRANDPA} cardNode={{ current: null }} />)
    const speakButton = screen.getByRole('button', { name: '🔊 慢速念一遍' })
    await user.click(speakButton)

    expect(api.speak).toHaveBeenCalledOnce()
    const utterance = api.speak.mock.calls[0][0]
    expect(utterance.lang).toBe('zh-CN')
    expect(utterance.rate).toBe(0.85)
    expect(utterance.text).toContain('爷爷的每日吃药提醒')
    expect(utterance.text).toContain('氨氯地平')

    const stopButton = screen.getByRole('button', { name: '⏹ 停止朗读' })
    expect(stopButton).toHaveAttribute('aria-pressed', 'true')
    await user.click(stopButton)
    // speak() 开始前会 cancel() 清空队列，停止时再 cancel() 一次
    expect(api.cancel).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('button', { name: '🔊 慢速念一遍' })).toBeInTheDocument()
  })

  it('主动停止触发的 canceled 错误不弹提示且复位朗读态', async () => {
    const api = fakeSynth()
    const user = userEvent.setup()
    render(<ActionBar card={SAMPLE_GRANDPA} cardNode={{ current: null }} />)
    await user.click(screen.getByRole('button', { name: '🔊 慢速念一遍' }))

    // 模拟浏览器在 cancel 后抛出的 canceled 错误事件
    const utterance = api.speak.mock.calls[0][0]
    await act(async () => {
      utterance.onerror({ error: 'canceled' })
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '🔊 慢速念一遍' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '⏹ 停止朗读' })).not.toBeInTheDocument()
  })
})
