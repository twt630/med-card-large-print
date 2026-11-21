import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App.jsx'

const drugPanel = (index) => screen.getByLabelText(`药品 ${index + 1}`)

describe('编辑区', () => {
  it('首屏默认加载爷爷示例', () => {
    render(<App />)
    expect(screen.getByDisplayValue('爷爷的每日吃药提醒')).toBeInTheDocument()
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
