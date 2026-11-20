import { useCallback, useState } from 'react'
import { createDrug, cloneSample } from '../data/samples.js'

export function useMedications(initial) {
  const [card, setCard] = useState(() =>
    initial ? cloneSample(initial) : { title: '爸妈的每日吃药提醒', drugs: [] },
  )

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
