import { useCallback, useEffect, useState } from 'react'
import { createDrug, cloneSample } from '../data/samples.js'

export const STORAGE_KEY = 'yao-ming-bai-card-v1'

function loadSavedCard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (typeof data.title !== 'string' || !Array.isArray(data.drugs)) return null
    return {
      title: data.title,
      drugs: data.drugs.map((d) => createDrug(d)),
    }
  } catch {
    return null
  }
}

export function useMedications(initial, { persist = true } = {}) {
  const [card, setCard] = useState(() =>
    loadSavedCard() ??
    (initial ? cloneSample(initial) : { title: '爸妈的每日吃药提醒', drugs: [] }),
  )

  useEffect(() => {
    if (!persist) return
    try {
      // 照片 base64 不进 localStorage，避免超出 5MB 存储配额
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          title: card.title,
          drugs: card.drugs.map((drug) => {
            const { photoData, ...rest } = drug
            return rest
          }),
        }),
      )
    } catch {
      /* 隐私模式或配额超限时静默跳过 */
    }
  }, [card, persist])

  const setTitle = useCallback((title) => {
    setCard((prev) => ({ ...prev, title }))
  }, [])

  const addDrug = useCallback((partial) => {
    const drug = createDrug(partial)
    setCard((prev) => ({ ...prev, drugs: [...prev.drugs, drug] }))
    return drug.id
  }, [])

  const updateDrug = useCallback((id, patch) => {
    setCard((prev) => ({
      ...prev,
      drugs: prev.drugs.map((drug) => (drug.id === id ? { ...drug, ...patch } : drug)),
    }))
  }, [])

  const removeDrug = useCallback((id) => {
    setCard((prev) => ({ ...prev, drugs: prev.drugs.filter((drug) => drug.id !== id) }))
  }, [])

  const loadSample = useCallback((sample) => {
    setCard(cloneSample(sample))
  }, [])

  return { card, setTitle, addDrug, updateDrug, removeDrug, loadSample }
}
