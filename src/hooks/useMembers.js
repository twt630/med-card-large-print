import { useCallback, useEffect, useState } from 'react'
import { createDrug, cloneSample, SAMPLE_GRANDPA, SAMPLE_MOM } from '../data/samples.js'
import { compressPhotoData } from '../lib/compressPhoto.js'

export const MEMBERS_STORAGE_KEY = 'yao-ming-bai-members-v1'

let memberIdCounter = 0
function nextMemberId() {
  memberIdCounter += 1
  return `m-${Date.now()}-${memberIdCounter}`
}

function defaultMembers() {
  return {
    selectedId: 'm-baba',
    members: [
      {
        id: 'm-baba',
        name: '爸爸',
        title: '爸爸的每日吃药提醒',
        drugs: cloneSample(SAMPLE_GRANDPA).drugs,
      },
      {
        id: 'm-mama',
        name: '妈妈',
        title: '妈妈的每日吃药提醒',
        drugs: cloneSample(SAMPLE_MOM).drugs,
      },
    ],
  }
}

function normalizeMember(raw, index) {
  if (!raw || typeof raw !== 'object') return null
  const drugs = Array.isArray(raw.drugs) ? raw.drugs.map((d) => createDrug(d)) : []
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `m-saved-${index}`,
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : '家人',
    title: typeof raw.title === 'string' ? raw.title : '',
    drugs,
  }
}

function loadSavedMembers() {
  try {
    const raw = localStorage.getItem(MEMBERS_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!Array.isArray(data.members)) return null
    const members = data.members.map(normalizeMember).filter(Boolean)
    if (members.length === 0) return null
    const selectedId = members.some((m) => m.id === data.selectedId)
      ? data.selectedId
      : members[0].id
    return { members, selectedId }
  } catch {
    return null
  }
}

async function serializeMembers(members) {
  return Promise.all(
    members.map(async (member) => ({
      ...member,
      drugs: await Promise.all(
        member.drugs.map(async (drug) => ({
          ...drug,
          photoData: drug.photoData ? await compressPhotoData(drug.photoData) : '',
        })),
      ),
    })),
  )
}

export function useMembers({ persist = true } = {}) {
  const [state, setState] = useState(() => loadSavedMembers() ?? defaultMembers())
  const [storageWarning, setStorageWarning] = useState(false)

  useEffect(() => {
    if (!persist) return
    let cancelled = false
    ;(async () => {
      try {
        const members = await serializeMembers(state.members)
        if (cancelled) return
        localStorage.setItem(
          MEMBERS_STORAGE_KEY,
          JSON.stringify({ members, selectedId: state.selectedId }),
        )
        setStorageWarning(false)
      } catch {
        if (!cancelled) setStorageWarning(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [state, persist])

  const updateMember = useCallback((memberId, updater) => {
    setState((prev) => ({
      ...prev,
      members: prev.members.map((member) =>
        member.id === memberId ? { ...member, ...updater(member) } : member,
      ),
    }))
  }, [])

  const updateSelectedDrugs = useCallback((updater) => {
    setState((prev) => {
      const selectedId = prev.members.some((m) => m.id === prev.selectedId)
        ? prev.selectedId
        : prev.members[0].id
      return {
        ...prev,
        selectedId,
        members: prev.members.map((member) =>
          member.id === selectedId ? { ...member, drugs: updater(member.drugs) } : member,
        ),
      }
    })
  }, [])

  const selectMember = useCallback((memberId) => {
    setState((prev) =>
      prev.members.some((m) => m.id === memberId) ? { ...prev, selectedId: memberId } : prev,
    )
  }, [])

  const addMember = useCallback((name) => {
    const trimmed = String(name || '').trim() || '家人'
    const member = {
      id: nextMemberId(),
      name: trimmed,
      title: `${trimmed}的每日吃药提醒`,
      drugs: [],
    }
    setState((prev) => ({ members: [...prev.members, member], selectedId: member.id }))
    return member.id
  }, [])

  const removeMember = useCallback((memberId) => {
    setState((prev) => {
      if (prev.members.length <= 1) return prev
      const index = prev.members.findIndex((m) => m.id === memberId)
      if (index === -1) return prev
      const members = prev.members.filter((m) => m.id !== memberId)
      const selectedId =
        prev.selectedId === memberId
          ? (members[Math.min(index, members.length - 1)] ?? members[0]).id
          : prev.selectedId
      return { members, selectedId }
    })
  }, [])

  const setCardTitle = useCallback(
    (title) => {
      setState((prev) => {
        const selectedId = prev.members.some((m) => m.id === prev.selectedId)
          ? prev.selectedId
          : prev.members[0].id
        return {
          ...prev,
          selectedId,
          members: prev.members.map((member) =>
            member.id === selectedId ? { ...member, title } : member,
          ),
        }
      })
    },
    [],
  )

  const addDrug = useCallback(
    (partial) => {
      const drug = createDrug(partial)
      updateSelectedDrugs((drugs) => [...drugs, drug])
      return drug.id
    },
    [updateSelectedDrugs],
  )

  const updateDrug = useCallback(
    (drugId, patch) => {
      updateSelectedDrugs((drugs) =>
        drugs.map((drug) => (drug.id === drugId ? { ...drug, ...patch } : drug)),
      )
    },
    [updateSelectedDrugs],
  )

  const removeDrug = useCallback(
    (drugId) => {
      updateSelectedDrugs((drugs) => drugs.filter((drug) => drug.id !== drugId))
    },
    [updateSelectedDrugs],
  )

  const loadSample = useCallback(
    (sample) => {
      const cloned = cloneSample(sample)
      updateSelectedDrugs(() => cloned.drugs)
      setState((prev) => {
        const selectedId = prev.members.some((m) => m.id === prev.selectedId)
          ? prev.selectedId
          : prev.members[0].id
        return {
          ...prev,
          selectedId,
          members: prev.members.map((member) =>
            member.id === selectedId ? { ...member, title: cloned.title } : member,
          ),
        }
      })
    },
    [updateSelectedDrugs],
  )

  const selectedMember =
    state.members.find((m) => m.id === state.selectedId) ?? state.members[0]

  return {
    members: state.members,
    selectedId: selectedMember.id,
    selectedCard: { title: selectedMember.title, drugs: selectedMember.drugs },
    storageWarning,
    selectMember,
    addMember,
    removeMember,
    setCardTitle,
    addDrug,
    updateDrug,
    removeDrug,
    loadSample,
    updateMember,
  }
}
