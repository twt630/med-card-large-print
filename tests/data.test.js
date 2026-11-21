import { describe, it, expect } from 'vitest'
import {
  TIME_SLOTS,
  PILL_ICONS,
  groupDrugsBySlot,
} from '../src/lib/timeSlots.js'
import {
  SAMPLE_GRANDPA,
  SAMPLE_MOM,
  SAMPLE_CONFLICT,
  COMMON_DRUGS,
  createDrug,
  cloneSample,
} from '../src/data/samples.js'
import { useMedications, STORAGE_KEY } from '../src/hooks/useMedications.js'
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

  it('爷爷示例用阿托伐他汀展示睡前时段，不再含硝苯地平', () => {
    const names = SAMPLE_GRANDPA.drugs.map((d) => d.name)
    expect(names).toContain('阿托伐他汀')
    expect(names).not.toContain('硝苯地平')
    const atorvastatin = SAMPLE_GRANDPA.drugs.find((d) => d.name === '阿托伐他汀')
    expect(atorvastatin.times).toEqual(['睡前'])
    expect(atorvastatin.note).toContain('忌吃西柚')
  })

  it('布洛芬提醒统一为「绝对禁酒，建议饭后服用」', () => {
    const mom = SAMPLE_MOM.drugs.find((d) => d.name === '布洛芬')
    const quick = COMMON_DRUGS.find((d) => d.name === '布洛芬')
    expect(mom.note).toBe('绝对禁酒，建议饭后服用')
    expect(quick.note).toBe('绝对禁酒，建议饭后服用')
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

  it('跳过药名为空的药品（手动添加未填名时不渲染空行）', () => {
    const groups = groupDrugsBySlot([
      createDrug({ name: '', times: ['早'] }),
      createDrug({ name: '有名字的药', times: ['早'] }),
      createDrug({ name: '   ', times: ['晚'] }),
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].drugs.map((d) => d.name)).toEqual(['有名字的药'])
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

describe('冲突预警演示示例', () => {
  it('内置阿司匹林 + 布洛芬 + 头孢克肟，结构合法', () => {
    const names = SAMPLE_CONFLICT.drugs.map((d) => d.name)
    expect(names.some((n) => n.includes('阿司匹林'))).toBe(true)
    expect(names).toContain('布洛芬')
    expect(names.some((n) => n.includes('头孢'))).toBe(true)
    SAMPLE_CONFLICT.drugs.forEach(validDrug)
  })
})

describe('localStorage 自动保存', () => {
  it('初始化时从 localStorage 恢复上次内容', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        title: '上次存的标题',
        drugs: [{ name: '存档药', times: ['晚'], dose: '2片', meal: '饭后', pillIcon: 'granules', note: '备注' }],
      }),
    )
    const { result } = renderHook(() => useMedications())
    expect(result.current.card.title).toBe('上次存的标题')
    expect(result.current.card.drugs).toHaveLength(1)
    expect(result.current.card.drugs[0].name).toBe('存档药')
    expect(result.current.card.drugs[0].pillIcon).toBe('granules')
    expect(result.current.card.drugs[0].photoData).toBe('')
  })

  it('修改自动写入且剥离照片 base64', () => {
    const { result } = renderHook(() => useMedications())
    act(() => {
      result.current.addDrug({ name: '药A', dose: '1片', photoData: 'data:image/png;base64,xx' })
    })
    act(() => result.current.setTitle('新标题'))
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(saved.title).toBe('新标题')
    expect(saved.drugs[0].name).toBe('药A')
    expect(saved.drugs[0].photoData).toBeUndefined()
  })

  it('persist 关闭时不写入 localStorage', () => {
    const { result } = renderHook(() => useMedications(undefined, { persist: false }))
    act(() => result.current.setTitle('不该被保存'))
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('损坏数据时回落到默认示例', () => {
    localStorage.setItem(STORAGE_KEY, '{bad json')
    const { result } = renderHook(() => useMedications(SAMPLE_GRANDPA))
    expect(result.current.card.title).toBe('爷爷的每日吃药提醒')
    expect(result.current.card.drugs).toHaveLength(3)
  })
})
