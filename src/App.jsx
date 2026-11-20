import React from 'react'
import { useRef } from 'react'
import HeaderBar from './components/HeaderBar.jsx'
import EditorPanel from './components/EditorPanel.jsx'
import CardPreview from './components/CardPreview.jsx'
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
        <EditorPanel
          card={card}
          onTitleChange={setTitle}
          onAddDrug={addDrug}
          onUpdateDrug={updateDrug}
          onRemoveDrug={removeDrug}
        />
        <section aria-label="卡片预览区" className="p-4 lg:p-6">
          <CardPreview card={card} domRef={cardRef} />
        </section>
      </main>
    </div>
  )
}
