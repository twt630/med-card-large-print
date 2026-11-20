import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CardPreview from '../src/components/CardPreview.jsx'
import PillIcon from '../src/components/PillIcon.jsx'
import App from '../src/App.jsx'
import { SAMPLE_GRANDPA } from '../src/data/samples.js'

const cardOf = (drugOverrides = [], title = SAMPLE_GRANDPA.title) => ({
  title,
  drugs: drugOverrides.map((d, i) => ({ id: `d${i}`, times: ['早'], ...d })),
})

describe('PillIcon', () => {
  it.each(['white', 'yellowOval', 'redCapsule', 'blueCapsule', 'granules'])(
    '渲染 %s 的可访问图标',
    (type) => {
      render(<PillIcon type={type} />)
      const svg = screen.getByRole('img')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('aria-label')
    },
  )
})

describe('CardPreview', () => {
  it('按时段分组并隐藏空时段', () => {
    render(
      <CardPreview
        card={cardOf([
          { name: '氨氯地平', times: ['早'] },
          { name: '二甲双胍', times: ['早', '晚'] },
          { name: '布洛芬', times: ['晚'] },
        ])}
      />,
    )
    expect(screen.getByLabelText('早上时段')).toBeInTheDocument()
    expect(screen.getByLabelText('晚上时段')).toBeInTheDocument()
    expect(screen.queryByLabelText('中午时段')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('睡前时段')).not.toBeInTheDocument()

    const morning = screen.getByLabelText('早上时段')
    expect(within(morning).getByText('氨氯地平')).toBeInTheDocument()
    expect(within(morning).getByText('二甲双胍')).toBeInTheDocument()
    expect(within(morning).getAllByRole('listitem')).toHaveLength(2)

    const evening = screen.getByLabelText('晚上时段')
    expect(within(evening).getByText('布洛芬')).toBeInTheDocument()
  })

  it('展示药名、剂量、餐时与药片图标', () => {
    render(
      <CardPreview
        card={cardOf([
          { name: '二甲双胍', times: ['早'], dose: '1片', meal: '随餐', pillIcon: 'yellowOval' },
        ])}
      />,
    )
    expect(screen.getByText('二甲双胍')).toBeInTheDocument()
    expect(screen.getByText('1片')).toBeInTheDocument()
    expect(screen.getByText('随餐')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '黄色椭圆片' })).toBeInTheDocument()
  })

  it('特别提醒用红色标签高亮，无提醒则不渲染', () => {
    const { rerender } = render(
      <CardPreview
        card={cardOf([{ name: '氨氯地平', times: ['早'], dose: '1片', note: '忌吃西柚' }])}
      />,
    )
    const note = screen.getByText(/忌吃西柚/)
    expect(getComputedStyle(note).backgroundColor).toBe('rgb(220, 38, 38)')

    rerender(
      <CardPreview card={cardOf([{ name: '氨氯地平', times: ['早'], dose: '1片' }])} />,
    )
    expect(screen.queryByText(/忌吃西柚/)).not.toBeInTheDocument()
  })

  it('渲染卡片标题与免责声明', () => {
    render(<CardPreview card={cardOf([{ name: '药A', times: ['早'], dose: '1片' }], '我的标题')} />)
    expect(screen.getByRole('heading', { name: '我的标题' })).toBeInTheDocument()
    expect(
      screen.getByText('本卡片仅用于辅助整理用药日程，不构成医疗建议，请严格遵照医嘱服药。'),
    ).toBeInTheDocument()
  })

  it('无药品时显示空状态提示', () => {
    render(<CardPreview card={{ title: '空卡片', drugs: [] }} />)
    expect(screen.getByText(/还没有药品/)).toBeInTheDocument()
  })

  it('编辑药名即时反映到预览（联动测试）', async () => {
    const user = userEvent.setup()
    render(<App />)
    const nameInput = screen.getAllByLabelText('药名（必填）', { selector: 'input' })[0]
    await user.clear(nameInput)
    await user.type(nameInput, '替米沙坦')
    expect(screen.getByText('替米沙坦')).toBeInTheDocument()
  })
})
