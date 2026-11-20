import React, { useMemo, useRef, useState } from 'react'
import { buildSpeechText } from '../lib/speakText.js'
import { createSpeaker } from '../lib/speak.js'
import { exportCardImage } from '../lib/exportImage.js'

export default function ActionBar({ card, cardNode }) {
  const speaker = useMemo(() => createSpeaker(), [])
  const [speaking, setSpeaking] = useState(false)
  const [status, setStatus] = useState('')
  const timerRef = useRef(null)

  const showStatus = (message) => {
    clearTimeout(timerRef.current)
    setStatus(message)
    timerRef.current = setTimeout(() => setStatus(''), 4000)
  }

  const handleSpeak = () => {
    if (speaking) {
      speaker.stop()
      setSpeaking(false)
      return
    }
    setSpeaking(true)
    speaker.speak(buildSpeechText(card), {
      onend: () => setSpeaking(false),
      onerror: () => {
        setSpeaking(false)
        showStatus('当前浏览器不支持语音朗读，建议用 Chrome 或 Edge 打开')
      },
    })
  }

  const handleSave = async () => {
    showStatus('正在生成高清图片…')
    try {
      await exportCardImage(cardNode.current)
      showStatus('图片已保存，可直接发微信给爸妈')
    } catch (err) {
      showStatus(err.message || '图片生成失败，请重试')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <section
      aria-label="操作栏"
      className="no-print flex flex-col gap-3 rounded-2xl bg-amber-50 p-4"
    >
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 rounded-xl bg-orange-500 px-5 py-4 text-lg font-black text-white shadow-md transition hover:bg-orange-600 active:scale-95"
        >
          📷 保存高清卡片图片
        </button>
        <button
          type="button"
          onClick={handleSpeak}
          aria-pressed={speaking}
          className="flex-1 rounded-xl bg-teal-600 px-5 py-4 text-lg font-black text-white shadow-md transition hover:bg-teal-700 active:scale-95"
        >
          {speaking ? '⏹ 停止朗读' : '🔊 慢速语音念一遍'}
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 rounded-xl bg-stone-800 px-5 py-4 text-lg font-black text-white shadow-md transition hover:bg-stone-900 active:scale-95"
        >
          🖨 打印卡片
        </button>
      </div>
      {status && (
        <p role="status" className="text-center text-base font-bold text-stone-700">
          {status}
        </p>
      )}
    </section>
  )
}
