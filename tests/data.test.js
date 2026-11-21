import { describe, it, expect, vi } from 'vitest'
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
import { useMembers, MEMBERS_STORAGE_KEY } from '../src/hooks/useMembers.js'
import { renderHook, act, waitFor } from '@testing-library/react'

vi.mock('../src/lib/compressPhoto.js', () => ({
  compressPhotoData: vi.fn(async () => 'data:image/jpeg;base64,COMPRESSED'),
}))

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

describe('useMembers 多成员管理', () => {
  it('默认内置爸爸、妈妈两位成员，爸爸默认选中', () => {
    const { result } = renderHook(() => useMembers())
    expect(result.current.members).toHaveLength(2)
    expect(result.current.members[0].name).toBe('爸爸')
    expect(result.current.members[1].name).toBe('妈妈')
    expect(result.current.members[0].title).toBe('爸爸的每日吃药提醒')
    expect(result.current.members[1].title).toBe('妈妈的每日吃药提醒')
    expect(result.current.selectedCard.title).toBe('爸爸的每日吃药提醒')
    expect(result.current.selectedCard.drugs).toHaveLength(3)
    expect(result.current.members[1].drugs).toHaveLength(3)
  })

  it('切换成员后编辑只作用于当前成员', () => {
    const { result } = renderHook(() => useMembers())
    const mamaId = result.current.members[1].id

    act(() => result.current.selectMember(mamaId))
    expect(result.current.selectedCard.title).toBe('妈妈的每日吃药提醒')

    act(() => result.current.addDrug({ name: '维生素D', dose: '1粒' }))
    expect(result.current.selectedCard.drugs).toHaveLength(4)
    expect(result.current.members[0].drugs).toHaveLength(3)

    act(() => result.current.setCardTitle('妈妈的新标题'))
    expect(result.current.members[1].title).toBe('妈妈的新标题')
    expect(result.current.members[0].title).toBe('爸爸的每日吃药提醒')
  })

  it('addMember 新增空白成员并自动切换', () => {
    const { result } = renderHook(() => useMembers())
    let newId
    act(() => {
      newId = result.current.addMember('外婆')
    })
    expect(result.current.members).toHaveLength(3)
    expect(result.current.selectedId).toBe(newId)
    expect(result.current.selectedCard.title).toBe('外婆的每日吃药提醒')
    expect(result.current.selectedCard.drugs).toHaveLength(0)
  })

  it('removeMember 至少保留一位，删除后选中相邻成员', () => {
    const { result } = renderHook(() => useMembers())
    const babaId = result.current.members[0].id

    act(() => result.current.removeMember(babaId))
    expect(result.current.members).toHaveLength(1)
    expect(result.current.selectedCard.title).toBe('妈妈的每日吃药提醒')

    act(() => result.current.removeMember(result.current.members[0].id))
    expect(result.current.members).toHaveLength(1)
    expect(result.current.members[0].name).toBe('妈妈')
  })

  it('loadSample 整体替换当前选中成员的药单', () => {
    const { result } = renderHook(() => useMembers())
    const mamaId = result.current.members[1].id
    act(() => result.current.selectMember(mamaId))

    act(() => result.current.loadSample(SAMPLE_MOM))
    expect(result.current.selectedCard.title).toBe('妈妈的感冒消炎用药')
    expect(result.current.selectedCard.drugs).toHaveLength(3)
    expect(result.current.selectedCard.drugs[0].name).toBe('阿莫西林')

    act(() => result.current.loadSample(SAMPLE_GRANDPA))
    expect(result.current.selectedCard.drugs).toHaveLength(3)
    expect(result.current.selectedCard.drugs[0].name).toBe('氨氯地平')
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

describe('localStorage 多成员持久化', () => {
  it('初始化时从 localStorage 恢复成员与选中项', () => {
    localStorage.setItem(
      MEMBERS_STORAGE_KEY,
      JSON.stringify({
        selectedId: 'm-2',
        members: [
          { id: 'm-1', name: '爸爸', title: '爸爸的每日吃药提醒', drugs: [] },
          {
            id: 'm-2',
            name: '外婆',
            title: '外婆的降压单',
            drugs: [
              { name: '存档药', times: ['晚'], dose: '2片', meal: '饭后', pillIcon: 'granules', note: '备注' },
            ],
          },
        ],
      }),
    )
    const { result } = renderHook(() => useMembers())
    expect(result.current.members).toHaveLength(2)
    expect(result.current.selectedCard.title).toBe('外婆的降压单')
    expect(result.current.selectedCard.drugs[0].name).toBe('存档药')
    expect(result.current.selectedCard.drugs[0].pillIcon).toBe('granules')
    expect(result.current.selectedCard.drugs[0].photoData).toBe('')
  })

  it('修改自动写入，照片压缩后持久化且内存态保留原图', async () => {
    const { result } = renderHook(() => useMembers())
    act(() => {
      result.current.addDrug({ name: '药A', dose: '1片', photoData: 'data:image/png;base64,BIG_RAW' })
    })
    act(() => result.current.setCardTitle('新标题'))

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem(MEMBERS_STORAGE_KEY)).members).toHaveLength(2)
    })
    const saved = JSON.parse(localStorage.getItem(MEMBERS_STORAGE_KEY))
    expect(saved.selectedId).toBeTruthy()
    const savedMember = saved.members.find((m) => m.title === '新标题')
    const savedDrug = savedMember.drugs.find((d) => d.name === '药A')
    expect(savedDrug.photoData).toBe('data:image/jpeg;base64,COMPRESSED')
    // 内存态仍保留原始照片，不因压缩而降质
    expect(
      result.current.selectedCard.drugs.find((d) => d.name === '药A').photoData,
    ).toBe('data:image/png;base64,BIG_RAW')
  })

  it('persist 关闭时不写入 localStorage', () => {
    const { result } = renderHook(() => useMembers({ persist: false }))
    act(() => result.current.setCardTitle('不该被保存'))
    expect(localStorage.getItem(MEMBERS_STORAGE_KEY)).toBeNull()
  })

  it('损坏数据时回落到默认两位成员', () => {
    localStorage.setItem(MEMBERS_STORAGE_KEY, '{bad json')
    const { result } = renderHook(() => useMembers())
    expect(result.current.members).toHaveLength(2)
    expect(result.current.members.map((m) => m.name)).toEqual(['爸爸', '妈妈'])
    expect(result.current.selectedCard.drugs).toHaveLength(3)
  })

  it('存储配额超限时给出提示且内存数据不丢', async () => {
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError')
      })
    const { result } = renderHook(() => useMembers())
    act(() => result.current.addDrug({ name: '药A', dose: '1片' }))

    await waitFor(() => {
      expect(result.current.storageWarning).toBe(true)
    })
    expect(result.current.selectedCard.drugs).toHaveLength(4)
    spy.mockRestore()
  })
})
