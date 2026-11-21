export function getCardWarnings(drugs) {
  const named = drugs.map((d) => ({ ...d, name: d.name.trim() })).filter((d) => d.name)
  const warnings = []

  const seen = new Set()
  for (const drug of named) {
    if (seen.has(drug.name)) {
      warnings.push(`检测到重复添加「${drug.name}」，请核对避免重复服药过量`)
    }
    seen.add(drug.name)
  }

  const has = (keyword) => named.some((d) => d.name.includes(keyword))
  if (has('布洛芬') && has('阿司匹林')) {
    warnings.push('布洛芬与阿司匹林同服可能增加胃肠道出血风险，请咨询医生')
  }
  if (has('氨氯地平') && has('硝苯地平')) {
    warnings.push('两者同属地平类降压药，一般不建议同时服用，请遵医嘱')
  }
  if (named.some((d) => d.name.includes('头孢') || d.name.includes('甲硝唑'))) {
    warnings.push('含头孢/甲硝唑类药物，服药期间及停药7天内绝对禁酒')
  }

  return [...new Set(warnings)]
}
