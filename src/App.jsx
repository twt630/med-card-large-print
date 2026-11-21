import React from 'react'
import { useRef, useState } from 'react'
import HeaderBar from './components/HeaderBar.jsx'
import EditorPanel from './components/EditorPanel.jsx'
import CardPreview from './components/CardPreview.jsx'
import ActionBar from './components/ActionBar.jsx'
import { useMedications } from './hooks/useMedications.js'
import { groupDrugsBySlot } from './lib/timeSlots.js'
import { decodeCardFromHash } from './lib/shareLink.js'
import { SAMPLE_GRANDPA } from './data/samples.js'

export default function App() {
  const [sharedCard] = useState(() => decodeCardFromHash(window.location.hash))
  const [mode, setMode] = useState(() => (sharedCard ? 'reader' : 'edit'))
  const { card, setTitle, addDrug, updateDrug, removeDrug, loadSample } =
    useMedications(sharedCard ?? SAMPLE_GRANDPA, { persist: mode === 'edit' })
  const cardRef = useRef(null)
  const canAct = groupDrugsBySlot(card.drugs).length > 0

  if (mode === 'reader') {
    return (
      <div className="min-h-screen bg-stone-100">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className="no-print fixed right-4 top-4 z-10 whitespace-nowrap rounded-xl border-2 border-stone-300 bg-white px-4 py-2 text-base font-bold text-stone-700 shadow-md transition hover:bg-stone-50"
        >
          我是子女，我要修改药单
        </button>
        <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4 pt-16 lg:p-8 lg:pt-20">
          <CardPreview card={card} domRef={cardRef} />
          <ActionBar card={card} cardNode={cardRef} canAct={canAct} showShare={false} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-100">
      <HeaderBar onLoadSample={loadSample} />
      <p className="no-print bg-teal-50 px-4 py-3 text-center text-base font-bold text-teal-900 lg:text-lg">
        用法：① 点右上「一键体验示例」→ ② 在编辑区增删改药品 → ③ 点下方按钮存图发微信 / 打印 / 慢速朗读 / 发给爸妈看
      </p>
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-4 lg:grid-cols-2 lg:p-8">
        <div className="no-print">
          <EditorPanel
            card={card}
            onTitleChange={setTitle}
            onAddDrug={addDrug}
            onUpdateDrug={updateDrug}
            onRemoveDrug={removeDrug}
          />
        </div>
        <div className="flex flex-col gap-4">
          <section aria-label="卡片预览区" className="print-full">
            <CardPreview card={card} domRef={cardRef} />
          </section>
          <ActionBar card={card} cardNode={cardRef} canAct={canAct} />
        </div>
      </main>
    </div>
  )
}
