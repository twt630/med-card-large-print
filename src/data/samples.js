let nextId = 0

export function createDrug(partial = {}) {
  nextId += 1
  return {
    id: `drug-${nextId}`,
    name: '',
    times: ['早'],
    dose: '',
    meal: '',
    pillIcon: 'white',
    photoData: '',
    note: '',
    ...partial,
  }
}

export function cloneSample(sample) {
  return {
    title: sample.title,
    drugs: sample.drugs.map((drug) => createDrug({ ...drug })),
  }
}

export const COMMON_DRUGS = [
  {
    name: '氨氯地平',
    times: ['早'],
    dose: '1片',
    meal: '饭后',
    pillIcon: 'white',
    note: '忌吃西柚',
  },
  {
    name: '二甲双胍',
    times: ['早', '晚'],
    dose: '1片',
    meal: '随餐',
    pillIcon: 'yellowOval',
    note: '',
  },
  {
    name: '布洛芬',
    times: ['中', '晚'],
    dose: '1片',
    meal: '饭后',
    pillIcon: 'white',
    note: '服药期间避免饮酒',
  },
  {
    name: '阿莫西林',
    times: ['早', '中', '晚'],
    dose: '2粒',
    meal: '饭后',
    pillIcon: 'blueCapsule',
    note: '青霉素过敏者禁用',
  },
  {
    name: '维生素D',
    times: ['早'],
    dose: '1粒',
    meal: '随餐',
    pillIcon: 'yellowOval',
    note: '',
  },
]

export const SAMPLE_GRANDPA = {
  title: '爷爷的每日吃药提醒',
  drugs: [
    {
      name: '氨氯地平',
      times: ['早'],
      dose: '1片',
      meal: '饭后',
      pillIcon: 'white',
      note: '忌吃西柚',
    },
    {
      name: '二甲双胍',
      times: ['早', '晚'],
      dose: '1片',
      meal: '随餐',
      pillIcon: 'yellowOval',
      note: '',
    },
    {
      name: '硝苯地平',
      times: ['早'],
      dose: '半片',
      meal: '饭前',
      pillIcon: 'redCapsule',
      note: '血压过低时先暂停',
    },
  ],
}

export const SAMPLE_MOM = {
  title: '妈妈的感冒消炎用药',
  drugs: [
    {
      name: '阿莫西林',
      times: ['早', '中', '晚'],
      dose: '2粒',
      meal: '饭后',
      pillIcon: 'blueCapsule',
      note: '青霉素过敏者禁用',
    },
    {
      name: '布洛芬',
      times: ['中', '晚'],
      dose: '1片',
      meal: '饭后',
      pillIcon: 'white',
      note: '绝对禁酒',
    },
    {
      name: '感冒清热颗粒',
      times: ['早', '睡前'],
      dose: '1袋',
      meal: '饭后',
      pillIcon: 'granules',
      note: '开水冲服，多喝温水',
    },
  ],
}
