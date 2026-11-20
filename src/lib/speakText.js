import { groupDrugsBySlot } from './timeSlots.js'

const SLOT_WORDS = { 早: '早上', 中: '中午', 晚: '晚上', 睡前: '睡前' }

export function buildSpeechText(card) {
  const intro = `${card.title}。念一遍吃药安排，请注意听。`
  const groups = groupDrugsBySlot(card.drugs)
  if (groups.length === 0) {
    return `${intro}目前还没有录入药品。`
  }
  const body = groups
    .map(({ slot, drugs }) => {
      const lines = drugs
        .map((drug) => {
          let line = `${drug.name}，每次${drug.dose}`
          if (drug.meal) line += `，${drug.meal}吃`
          if (drug.note) line += `。注意：${drug.note}`
          return line
        })
        .join('。')
      return `${SLOT_WORDS[slot]}要吃：${lines}。`
    })
    .join(' ')
  return `${intro}${body}`
}
