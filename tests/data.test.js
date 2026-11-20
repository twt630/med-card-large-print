import { describe, it, expect } from 'vitest'
import {
  TIME_SLOTS,
  PILL_ICONS,
  groupDrugsBySlot,
} from '../src/lib/timeSlots.js'
import {
  SAMPLE_GRANDPA,
  SAMPLE_MOM,
  COMMON_DRUGS,
  createDrug,
  cloneSample,
} from '../src/data/samples.js'
import { useMedications } from '../src/hooks/useMedications.js'
import { renderHook, act } from '@testing-library/react'

const validDrug = (drug) => {
  expect(drug.name).toBeTruthy()
  expect(drug.times.length).toBeGreaterThan(0)
  drug.times.forEach((t) => expect(TIME_SLOTS).toContain(t))
  expect(drug.dose).toBeTruthy()
  expect(PILL_ICONS).toContain(drug.pillIcon)
}

describe('示例数据', () => {
  it('两份示例结构合法', () => {
    ;[SAMPLE_GRANDPA, SAMPLE_MOM].forEach((sample) => {
      expect(sample.title).toBeTruthy()
      expect(sample.drugs.length).toBeGreaterThan(0)
      sample.drugs.forEach(validDrug)
    })
  })

  it('常见药快捷预设共 5 种且结构合法', () => {
    expect(COMMON_DRUGS).toHaveLength(5)
    COMMON_DRUGS.forEach(validDrug)
  })

  it('cloneSample 深拷贝且生成独立 id', () => {
    const a = cloneSample(SAMPLE_GRANDPA)
    const b = cloneSample(SAMPLE_GRANDPA)
    expect(a).not.toBe(b)
    expect(a.drugs.map((d) => d.id)).not.toEqual(b.drugs.map((d) => d.id))
    a.drugs[0].name = '改了'
    expect(SAMPLE_GRANDPA.drugs[0].name).not.toBe('改了')
  })
})

describe('groupDrugsBySlot 时段分组', () => {
  it('按早中晚睡前排序并隐藏空时段', () => {
    const drugs = [
      createDrug({ name: 'A', times: ['睡前'] }),
      createDrug({ name: 'B', times: ['晚'] }),
      createDrug({ name: 'C', times: ['早', '晚'] }),
    ]
    const groups = groupDrugsBySlot(drugs)
    expect(groups.map((g) => g.slot)).toEqual(['早', '晚', '睡前'])
    expect(groups[0].drugs.map((d) => d.name)).toEqual(['C'])
    expect(groups[1].drugs.map((d) => d.name)).toEqual(['B', 'C'])
  })

  it('无药时返回空数组', () => {
    expect(groupDrugsBySlot([])).toEqual([])
  })
})

describe('useMedications', () => {
  it('增删改标题与药品', () => {
    const { result } = renderHook(() => useMedications(SAMPLE_GRANDPA))
    act(() => result.current.setTitle('新标题'))
    expect(result.current.card.title).toBe('新标题')

    act(() => {
      result.current.addDrug({ name: '维生素D', dose: '1粒' })
    })
    expect(result.current.card.drugs).toHaveLength(4)
    const added = result.current.card.drugs[3]
    expect(added.name).toBe('维生素D')

    act(() => result.current.updateDrug(added.id, { dose: '2粒' }))
    expect(
      result.current.card.drugs.find((d) => d.id === added.id).dose,
    ).toBe('2粒')

    act(() => result.current.removeDrug(added.id))
    expect(result.current.card.drugs).toHaveLength(3)
  })

  it('loadSample 整体替换当前卡片', () => {
    const { result } = renderHook(() => useMedications())
    expect(result.current.card.title).toBe('爸妈的每日吃药提醒')
    expect(result.current.card.drugs).toHaveLength(0)

    act(() => result.current.loadSample(SAMPLE_MOM))
    expect(result.current.card.title).toBe('妈妈的感冒消炎用药')
    expect(result.current.card.drugs).toHaveLength(3)

    act(() => result.current.loadSample(SAMPLE_GRANDPA))
    expect(result.current.card.drugs).toHaveLength(3)
    expect(result.current.card.drugs[0].name).toBe('氨氯地平')
  })
})
