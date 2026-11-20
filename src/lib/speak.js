export function createSpeaker() {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined

  if (!synth || !('SpeechSynthesisUtterance' in window)) {
    return {
      supported: false,
      speak(_text, { onerror } = {}) {
        onerror?.()
      },
      stop() {},
    }
  }

  return {
    supported: true,
    speak(text, { onend, onerror } = {}) {
      synth.cancel()
      const utterance = new window.SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = 0.85
      utterance.onend = () => onend?.()
      utterance.onerror = () => onerror?.()
      synth.speak(utterance)
    },
    stop() {
      synth.cancel()
    },
  }
}
