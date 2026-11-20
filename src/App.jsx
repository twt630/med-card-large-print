import React from 'react'
import { useRef } from 'react'
import HeaderBar from './components/HeaderBar.jsx'
import EditorPanel from './components/EditorPanel.jsx'
import CardPreview from './components/CardPreview.jsx'
import ActionBar from './components/ActionBar.jsx'
import { useMedications } from './hooks/useMedications.js'
import { SAMPLE_GRANDPA } from './data/samples.js'

export default function App() {
  const { card, setTitle, addDrug, updateDrug, removeDrug, loadSample } =
    useMedications(SAMPLE_GRANDPA)
  const cardRef = useRef(null)

  return (
    <div className="min-h-screen bg-stone-100">
      <HeaderBar onLoadSample={loadSample} />
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
          <ActionBar card={card} cardNode={cardRef} />
        </div>
      </main>
    </div>
  )
}
