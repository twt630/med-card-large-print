import { createDrug } from '../data/samples.js'
import { PILL_ICONS, TIME_SLOTS } from './timeSlots.js'

function toBase64Url(bytes) {
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function fromBase64Url(encoded) {
  const b64 = encoded.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(b64)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

// 分享链接不携带照片 base64，避免链接过长
export function encodeCardForShare(card) {
  const payload = {
    t: card.title,
    d: card.drugs
      .filter((drug) => drug.name.trim() !== '')
      .map((drug) => ({
        n: drug.name,
        s: drug.times,
        o: drug.dose,
        m: drug.meal,
        p: drug.pillIcon,
        w: drug.note,
      })),
  }
  return toBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
}

export function buildShareUrl(card) {
  return `${window.location.origin}${window.location.pathname}#share=${encodeCardForShare(card)}`
}

export function decodeCardFromHash(hash) {
  const match = /^#?share=([A-Za-z0-9\-_]+)$/.exec(hash || '')
  if (!match) return null
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(match[1])))
    if (typeof payload.t !== 'string' || !Array.isArray(payload.d)) return null
    const drugs = payload.d.map((d) =>
      createDrug({
        name: typeof d.n === 'string' ? d.n : '',
        times: Array.isArray(d.s)
          ? d.s.filter((t) => TIME_SLOTS.includes(t))
          : [],
        dose: typeof d.o === 'string' ? d.o : '',
        meal: typeof d.m === 'string' ? d.m : '',
        pillIcon: PILL_ICONS.includes(d.p) ? d.p : 'white',
        note: typeof d.w === 'string' ? d.w : '',
      }),
    )
    return { title: payload.t, drugs }
  } catch {
    return null
  }
}

export async function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  textarea.remove()
  return ok
}
