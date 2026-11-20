import React from 'react'
import HeaderBar from './components/HeaderBar.jsx'
import EditorPanel from './components/EditorPanel.jsx'
import { useMedications } from './hooks/useMedications.js'
import { SAMPLE_GRANDPA } from './data/samples.js'

export default function App() {
  const { card, setTitle, addDrug, updateDrug, removeDrug, loadSample } =
    useMedications(SAMPLE_GRANDPA)

  return (
    <div className="min-h-screen bg-stone-100">
      <HeaderBar onLoadSample={loadSample} />
      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-4 lg:grid-cols-2 lg:p-8">
        <EditorPanel
          card={card}
          onTitleChange={setTitle}
          onAddDrug={addDrug}
          onUpdateDrug={updateDrug}
          onRemoveDrug={removeDrug}
        />
        <section aria-label="卡片预览区" className="p-4">
          <p className="text-lg text-stone-500">卡片预览区（开发中）</p>
        </section>
      </main>
    </div>
  )
}
