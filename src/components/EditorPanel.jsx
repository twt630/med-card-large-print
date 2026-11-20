import React from 'react'
import { COMMON_DRUGS } from '../data/samples.js'
import DrugForm from './DrugForm.jsx'

export default function EditorPanel({
  card,
  onTitleChange,
  onAddDrug,
  onUpdateDrug,
  onRemoveDrug,
}) {
  return (
    <section
      aria-label="编辑区"
      className="flex flex-col gap-4 rounded-2xl bg-amber-50 p-4 lg:p-6"
    >
      <label className="flex flex-col gap-1">
        <span className="text-base font-bold text-stone-700">卡片标题</span>
        <input
          type="text"
          value={card.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="rounded-lg border-2 border-stone-300 bg-white px-3 py-2 text-xl focus:border-orange-500 focus:outline-none"
        />
      </label>

      <div>
        <h2 className="mb-2 text-lg font-bold text-stone-700">常见药快捷添加</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="常见药快捷添加">
          {COMMON_DRUGS.map((drug) => (
            <button
              key={drug.name}
              type="button"
              onClick={() => onAddDrug(drug)}
              className="rounded-full bg-teal-600 px-4 py-2 text-base font-bold text-white shadow-sm transition hover:bg-teal-700 active:scale-95"
            >
              + {drug.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-stone-700">
          药品清单（{card.drugs.length} 条）
        </h2>
        <button
          type="button"
          onClick={() => onAddDrug({})}
          className="rounded-xl bg-stone-800 px-4 py-2 text-base font-bold text-white transition hover:bg-stone-900 active:scale-95"
        >
          + 手动添加药品
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {card.drugs.map((drug, index) => (
          <DrugForm
            key={drug.id}
            index={index}
            drug={drug}
            onChange={(patch) => onUpdateDrug(drug.id, patch)}
            onRemove={onRemoveDrug}
          />
        ))}
        {card.drugs.length === 0 && (
          <p className="rounded-2xl border-2 border-dashed border-stone-300 p-6 text-center text-lg text-stone-500">
            还没有药品，点上面的快捷按钮或「手动添加药品」开始吧
          </p>
        )}
      </div>
    </section>
  )
}
