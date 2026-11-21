import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getCardWarnings } from '../src/lib/drugWarnings.js'
import CardPreview from '../src/components/CardPreview.jsx'
import App from '../src/App.jsx'
import { createDrug } from '../src/data/samples.js'

const drugs = (list) => list.map((d, i) => createDrug({ id: `d${i}`, ...d }))

describe('getCardWarnings 预警规则', () => {
  it('同名药品提示重复', () => {
    const warnings = getCardWarnings(
      drugs([
        { name: '布洛芬', times: ['早'] },
        { name: '布洛芬', times: ['晚'] },
      ]),
    )
    expect(warnings).toEqual([
      '检测到重复添加「布洛芬」，请核对避免重复服药过量',
    ])
  })

  it('布洛芬与阿司匹林同服提示出血风险', () => {
    const warnings = getCardWarnings(
      drugs([
        { name: '布洛芬缓释胶囊', times: ['早'] },
        { name: '阿司匹林肠溶片', times: ['晚'] },
      ]),
    )
    expect(warnings).toContain('布洛芬与阿司匹林同服可能增加胃肠道出血风险，请咨询医生')
  })

  it('氨氯地平与硝苯地平同服提示地平类联用', () => {
    const warnings = getCardWarnings(
      drugs([
        { name: '氨氯地平', times: ['早'] },
        { name: '硝苯地平', times: ['早'] },
      ]),
    )
    expect(warnings).toContain('两者同属地平类降压药，一般不建议同时服用，请遵医嘱')
  })

  it('头孢或甲硝唑提示绝对禁酒', () => {
    expect(getCardWarnings(drugs([{ name: '头孢克肟', times: ['早'] }]))).toContain(
      '含头孢/甲硝唑类药物，服药期间及停药7天内绝对禁酒',
    )
    expect(getCardWarnings(drugs([{ name: '甲硝唑片', times: ['早'] }]))).toContain(
      '含头孢/甲硝唑类药物，服药期间及停药7天内绝对禁酒',
    )
  })

  it('无风险时不产生预警，空药名不参与检测', () => {
    expect(
      getCardWarnings(
        drugs([
          { name: '氨氯地平', times: ['早'] },
          { name: '阿托伐他汀', times: ['睡前'] },
        ]),
      ),
    ).toEqual([])
    expect(getCardWarnings(drugs([{ name: '', times: ['早'] }]))).toEqual([])
  })
})

describe('CardPreview 红色预警横幅', () => {
  it('有预警时卡片顶部渲染红色横幅', () => {
    render(
      <CardPreview
        card={{
          title: '卡片',
          drugs: drugs([{ name: '布洛芬', times: ['早'] }, { name: '布洛芬', times: ['晚'] }]),
        }}
      />,
    )
    const banner = screen.getByRole('alert')
    expect(banner).toHaveTextContent('检测到重复添加「布洛芬」')
    expect(getComputedStyle(banner).backgroundColor).toBe('rgb(220, 38, 38)')
    // 横幅位于卡片顶部：在标题之前
    const card = banner.parentElement
    expect(card.firstElementChild).toBe(banner)
  })

  it('无预警时不渲染横幅', () => {
    render(
      <CardPreview
        card={{ title: '卡片', drugs: drugs([{ name: '氨氯地平', times: ['早'] }]) }}
      />,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('冲突预警演示按钮', () => {
  it('一键加载演示示例并显示两条预警', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '一键体验：⚠️ 冲突预警演示' }))

    const banner = screen.getByRole('alert')
    expect(banner).toHaveTextContent('布洛芬与阿司匹林同服可能增加胃肠道出血风险')
    expect(banner).toHaveTextContent('含头孢/甲硝唑类药物')
    expect(within(banner).getAllByRole('paragraph')).toHaveLength(2)
  })
})
