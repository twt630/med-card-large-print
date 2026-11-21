import React from 'react'
import { groupDrugsBySlot } from '../lib/timeSlots.js'
import { getCardWarnings } from '../lib/drugWarnings.js'
import PillIcon from './PillIcon.jsx'

// 卡片预览区内只使用 #hex 颜色（内联样式），
// 规避 Tailwind v4 oklch() 导致 html2canvas 导出变白的问题。
const SLOT_META = {
  早: { emoji: '🌅', label: '早上', bg: '#FFF6D8', bar: '#F59E0B', text: '#92400E' },
  中: { emoji: '☀️', label: '中午', bg: '#E4F0FD', bar: '#2563EB', text: '#1D4ED8' },
  晚: { emoji: '🌆', label: '晚上', bg: '#F6E8FB', bar: '#9333EA', text: '#7E22CE' },
  睡前: { emoji: '🌙', label: '睡前', bg: '#E5E9FD', bar: '#4F46E5', text: '#4338CA' },
}

export default function CardPreview({ card, domRef }) {
  const groups = groupDrugsBySlot(card.drugs)
  const warnings = getCardWarnings(card.drugs)

  return (
    <div
      ref={domRef}
      className="rounded-3xl p-6 lg:p-8"
      style={{
        backgroundColor: '#FFFDF7',
        border: '4px solid #E7E0D1',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        color: '#1C1917',
      }}
    >
      {warnings.length > 0 && (
        <div
          role="alert"
          className="card-warning flex flex-col gap-1"
          style={{
            backgroundColor: '#DC2626',
            borderRadius: '16px',
            padding: '12px 16px',
            marginBottom: '16px',
          }}
        >
          {warnings.map((warning) => (
            <p
              key={warning}
              style={{
                color: '#FFFFFF',
                fontSize: '20px',
                fontWeight: 900,
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              ⚠️ {warning}
            </p>
          ))}
        </div>
      )}
      <h2
        className="card-title text-center"
        style={{ fontSize: '36px', fontWeight: 900, margin: '0 0 24px', color: '#1C1917' }}
      >
        {card.title}
      </h2>

      {groups.length === 0 && (
        <p style={{ fontSize: '22px', textAlign: 'center', color: '#78716C', margin: '32px 0' }}>
          还没有药品，先在编辑区添加几种药吧
        </p>
      )}

      <div className="flex flex-col gap-6">
        {groups.map(({ slot, drugs }) => {
          const meta = SLOT_META[slot]
          return (
            <section
              key={slot}
              aria-label={`${meta.label}时段`}
              className="rounded-2xl p-4 lg:p-5"
              style={{ backgroundColor: meta.bg, borderTop: `10px solid ${meta.bar}` }}
            >
              <h3
                className="slot-title"
                style={{ fontSize: '26px', fontWeight: 900, color: meta.text, margin: '0 0 12px' }}
              >
                {meta.emoji} {meta.label}
              </h3>

              <ul className="flex flex-col gap-4" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {drugs.map((drug) => (
                  <li key={drug.id} className="flex flex-wrap items-center gap-3">
                    {drug.photoData ? (
                      <div
                        className="drug-photo"
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          backgroundColor: '#F5F5F4',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={drug.photoData}
                          alt={`${drug.name}的实拍照片`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      </div>
                    ) : (
                      <PillIcon type={drug.pillIcon} size={56} />
                    )}
                    <span className="drug-name" style={{ fontSize: '34px', fontWeight: 900, color: '#1C1917', lineHeight: 1.2 }}>
                      {drug.name}
                    </span>
                    <span
                      className="dose-badge rounded-xl"
                      style={{
                        fontSize: '24px',
                        fontWeight: 900,
                        color: '#FFFFFF',
                        backgroundColor: '#EA580C',
                        padding: '4px 14px',
                      }}
                    >
                      {drug.dose}
                    </span>
                    {drug.meal && (
                      <span
                        className="meal-badge rounded-xl"
                        style={{
                          fontSize: '22px',
                          fontWeight: 700,
                          color: '#374151',
                          backgroundColor: '#FFFFFF',
                          border: '2px solid #D1D5DB',
                          padding: '4px 12px',
                        }}
                      >
                        {drug.meal}
                      </span>
                    )}
                    {drug.note && (
                      <span
                        className="note-badge w-full rounded-full"
                        style={{
                          fontSize: '24px',
                          fontWeight: 900,
                          color: '#FFFFFF',
                          backgroundColor: '#DC2626',
                          padding: '6px 16px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        ⚠️ {drug.note}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      <p
        style={{
          fontSize: '14px',
          color: '#78716C',
          textAlign: 'center',
          margin: '24px 0 0',
          lineHeight: 1.6,
        }}
      >
        本卡片仅用于辅助整理用药日程，不构成医疗建议，请严格遵照医嘱服药。
      </p>
    </div>
  )
}
