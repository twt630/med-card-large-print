import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App.jsx'

const drugPanel = (index) => screen.getByLabelText(`药品 ${index + 1}`)

describe('编辑区', () => {
  it('首屏默认选中爸爸成员（高血压+降糖示例）', () => {
    render(<App />)
    expect(screen.getByDisplayValue('爸爸的每日吃药提醒')).toBeInTheDocument()
    expect(screen.getByDisplayValue('氨氯地平')).toBeInTheDocument()
    expect(screen.getByDisplayValue('二甲双胍')).toBeInTheDocument()
    expect(screen.getByDisplayValue('阿托伐他汀')).toBeInTheDocument()
  })

  it('点击示例按钮整体切换到妈妈示例', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '一键体验：妈妈的感冒消炎用药' }))
    expect(screen.getByDisplayValue('妈妈的感冒消炎用药')).toBeInTheDocument()
    expect(screen.getByDisplayValue('阿莫西林')).toBeInTheDocument()
    expect(screen.getByDisplayValue('感冒清热颗粒')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('阿托伐他汀')).not.toBeInTheDocument()
  })

  it('编辑标题与药名即时生效', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.clear(screen.getByLabelText('卡片标题'))
    await user.type(screen.getByLabelText('卡片标题'), '新标题')
    expect(screen.getByLabelText('卡片标题')).toHaveValue('新标题')

    const panel = drugPanel(0)
    const nameInput = within(panel).getByLabelText('药名（必填）', { selector: 'input' })
    await user.clear(nameInput)
    await user.type(nameInput, '复方氨酚烷胺')
    expect(nameInput).toHaveValue('复方氨酚烷胺')
    expect(within(panel).getByRole('heading', { name: '1. 复方氨酚烷胺' })).toBeInTheDocument()
  })

  it('快捷添加常见药', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByText('药品清单（3 条）')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '+ 维生素D' }))
    expect(screen.getByText('药品清单（4 条）')).toBeInTheDocument()
    const panel = drugPanel(3)
    expect(within(panel).getByRole('heading', { name: '4. 维生素D' })).toBeInTheDocument()
    expect(within(panel).getByDisplayValue('1粒')).toBeInTheDocument()
  })

  it('手动添加、修改用量与时段、删除药品', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '+ 手动添加药品' }))
    expect(screen.getByText('药品清单（4 条）')).toBeInTheDocument()
    const panel = drugPanel(3)

    await user.clear(within(panel).getByLabelText('药名（必填）', { selector: 'input' }))
    await user.type(within(panel).getByLabelText('药名（必填）', { selector: 'input' }), '新加的药')
    await user.type(within(panel).getByLabelText('每次用量（必填）', { selector: 'input' }), '半片')
    expect(within(panel).getByDisplayValue('半片')).toBeInTheDocument()

    await user.click(within(panel).getByLabelText('时段 睡前'))
    expect(within(panel).getByLabelText('时段 睡前')).toBeChecked()

    await user.click(within(panel).getByRole('button', { name: '删除 新加的药' }))
    expect(screen.getByText('药品清单（3 条）')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '4. 新加的药' })).not.toBeInTheDocument()
  })
})

describe('成员切换栏', () => {
  it('默认显示爸爸、妈妈标签，切换后编辑区与预览区同步', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.getByLabelText('切换到 爸爸')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('切换到 妈妈')).toBeInTheDocument()

    await user.click(screen.getByLabelText('切换到 妈妈'))
    expect(screen.getByDisplayValue('妈妈的每日吃药提醒')).toBeInTheDocument()
    expect(screen.getByDisplayValue('阿莫西林')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('氨氯地平')).not.toBeInTheDocument()
    // 预览区同步显示妈妈的药
    expect(screen.getByLabelText('卡片预览区')).toHaveTextContent('妈妈的每日吃药提醒')
  })

  it('添加家人：行内输入称呼后新增空白成员并自动切换', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '＋ 添加家人' }))
    await user.type(screen.getByLabelText('新成员称呼'), '外婆')
    await user.click(screen.getByRole('button', { name: '确认添加成员' }))

    expect(screen.getByLabelText('切换到 外婆')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByDisplayValue('外婆的每日吃药提醒')).toBeInTheDocument()
    expect(screen.getByText('药品清单（0 条）')).toBeInTheDocument()
    expect(screen.queryByLabelText('新成员称呼')).not.toBeInTheDocument()
  })

  it('添加家人输入框最小宽度足够放下完整 placeholder（不截断）', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '＋ 添加家人' }))
    const input = screen.getByLabelText('新成员称呼')
    // placeholder 11 个全角字符（text-lg≈18px→约 198px）+ 内边距与边框 ≈ 226px，240px 不截断
    expect(input.style.minWidth).toBe('15rem') // 240px
    expect(input.placeholder).toBe('称呼（如外婆、宝宝）')
  })

  it('添加家人支持回车提交，取消则不新增', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '＋ 添加家人' }))
    await user.type(screen.getByLabelText('新成员称呼'), '宝宝')
    await user.click(screen.getByRole('button', { name: '取消添加成员' }))
    expect(screen.queryByLabelText('新成员称呼')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('切换到 宝宝')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '＋ 添加家人' }))
    await user.type(screen.getByLabelText('新成员称呼'), '宝宝{Enter}')
    expect(screen.getByLabelText('切换到 宝宝')).toBeInTheDocument()
  })

  it('删除成员需确认，删除后切到相邻成员；仅剩一位时禁删', async () => {
    const user = userEvent.setup()
    render(<App />)

    // 删除非选中成员（妈妈），选中不变
    await user.click(screen.getByLabelText('删除成员 妈妈'))
    await user.click(screen.getByLabelText('确认删除成员 妈妈'))
    expect(screen.queryByLabelText('切换到 妈妈')).not.toBeInTheDocument()
    expect(screen.getByLabelText('切换到 爸爸')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByDisplayValue('爸爸的每日吃药提醒')).toBeInTheDocument()

    // 仅剩爸爸一位：删除按钮禁用
    expect(screen.getByLabelText('删除成员 爸爸')).toBeDisabled()

    // 添加一位后删除当前选中成员，选中切到相邻成员
    await user.click(screen.getByRole('button', { name: '＋ 添加家人' }))
    await user.type(screen.getByLabelText('新成员称呼'), '外婆')
    await user.click(screen.getByRole('button', { name: '确认添加成员' }))
    await user.click(screen.getByLabelText('删除成员 外婆'))
    await user.click(screen.getByLabelText('确认删除成员 外婆'))
    expect(screen.queryByLabelText('切换到 外婆')).not.toBeInTheDocument()
    expect(screen.getByLabelText('切换到 爸爸')).toHaveAttribute('aria-pressed', 'true')
  })

  it('切换成员时先点删除再取消，不误删', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByLabelText('删除成员 妈妈'))
    await user.click(screen.getByLabelText('取消删除成员 妈妈'))
    expect(screen.getByLabelText('切换到 妈妈')).toBeInTheDocument()
  })
})
