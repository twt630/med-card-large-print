import React from 'react'
import { SAMPLE_GRANDPA, SAMPLE_MOM } from '../data/samples.js'

const SAMPLE_BUTTONS = [
  { key: 'grandpa', label: '爷爷的高血压+降糖日常', sample: SAMPLE_GRANDPA },
  { key: 'mom', label: '妈妈的感冒消炎用药', sample: SAMPLE_MOM },
]

export default function HeaderBar({ onLoadSample }) {
  return (
    <header className="bg-amber-50 border-b-4 border-amber-200 px-4 py-4 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-black leading-snug text-stone-900 lg:text-3xl">
          药明白 · 给爸妈的极简大字用药卡片
        </h1>
        <div className="flex flex-wrap gap-3" role="group" aria-label="一键体验示例">
          {SAMPLE_BUTTONS.map(({ key, label, sample }) => (
            <button
              key={key}
              type="button"
              onClick={() => onLoadSample(sample)}
              className="rounded-xl bg-orange-500 px-5 py-3 text-lg font-bold text-white shadow-md transition hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-300 active:scale-95"
            >
              一键体验：{label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
