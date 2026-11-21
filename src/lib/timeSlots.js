export const TIME_SLOTS = ['早', '中', '晚', '睡前']

export const PILL_ICONS = ['white', 'yellowOval', 'redCapsule', 'blueCapsule', 'granules']

export function groupDrugsBySlot(drugs) {
  return TIME_SLOTS.map((slot) => ({
    slot,
    drugs: drugs.filter(
      (drug) => drug.name.trim() !== '' && drug.times.includes(slot),
    ),
  })).filter((group) => group.drugs.length > 0)
}
