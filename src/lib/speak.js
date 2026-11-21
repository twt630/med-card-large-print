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
      utterance.onerror = (event) => {
        // 用户主动停止（canceled）或被打断（interrupted）不是错误，按正常结束复位，不弹提示
        if (event && (event.error === 'canceled' || event.error === 'interrupted')) {
          onend?.()
          return
        }
        onerror?.()
      }
      synth.speak(utterance)
    },
    stop() {
      synth.cancel()
    },
  }
}
