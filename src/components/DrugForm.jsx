import React, { useRef, useState } from 'react'
import { TIME_SLOTS } from '../lib/timeSlots.js'
import PillIcon from './PillIcon.jsx'

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

const MEAL_OPTIONS = ['', '饭前', '饭后', '随餐']
const PILL_OPTIONS = [
  { value: 'white', label: '纯白圆片' },
  { value: 'yellowOval', label: '黄色椭圆片' },
  { value: 'redCapsule', label: '红白胶囊' },
  { value: 'blueCapsule', label: '蓝白胶囊' },
  { value: 'granules', label: '颗粒冲剂' },
]

export default function DrugForm({ index, drug, onChange, onRemove }) {
  const fileRef = useRef(null)
  const [photoError, setPhotoError] = useState('')

  const toggleTime = (slot, checked) => {
    const times = checked
      ? [...drug.times, slot]
      : drug.times.filter((t) => t !== slot)
    onChange({ times: TIME_SLOTS.filter((t) => times.includes(t)) })
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('照片超过 5MB，请换一张小一点的')
      return
    }
    setPhotoError('')
    const reader = new FileReader()
    reader.onload = () => onChange({ photoData: reader.result })
    reader.readAsDataURL(file)
  }

  return (
    <section
      aria-label={`药品 ${index + 1}`}
      className="rounded-2xl border-2 border-stone-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xl font-bold text-stone-800">
          {index + 1}. {drug.name || '新药'}
        </h3>
        <button
          type="button"
          onClick={() => onRemove(drug.id)}
          aria-label={`删除 ${drug.name || '新药'}`}
          className="rounded-lg bg-red-50 px-4 py-2 text-base font-bold text-red-600 transition hover:bg-red-100"
        >
          删除
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-base font-bold text-stone-700">药名（必填）</span>
          <input
            type="text"
            value={drug.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="如：氨氯地平"
            className="rounded-lg border-2 border-stone-300 px-3 py-2 text-xl focus:border-orange-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-base font-bold text-stone-700">每次用量（必填）</span>
          <input
            type="text"
            value={drug.dose}
            onChange={(e) => onChange({ dose: e.target.value })}
            placeholder="如：1片"
            className="rounded-lg border-2 border-stone-300 px-3 py-2 text-xl focus:border-orange-500 focus:outline-none"
          />
        </label>

        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="text-base font-bold text-stone-700">服用时段（必填，可多选）</legend>
          <div className="flex flex-wrap gap-3">
            {TIME_SLOTS.map((slot) => (
              <label key={slot} className="flex items-center gap-2 rounded-lg bg-stone-50 px-4 py-2 text-xl font-bold text-stone-800">
                <input
                  type="checkbox"
                  checked={drug.times.includes(slot)}
                  onChange={(e) => toggleTime(slot, e.target.checked)}
                  aria-label={`时段 ${slot}`}
                  className="size-6 accent-orange-600"
                />
                {slot}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1">
          <span className="text-base font-bold text-stone-700">餐时（选填）</span>
          <select
            value={drug.meal}
            onChange={(e) => onChange({ meal: e.target.value })}
            className="rounded-lg border-2 border-stone-300 px-3 py-2 text-xl focus:border-orange-500 focus:outline-none"
          >
            {MEAL_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m || '不填'}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-base font-bold text-stone-700">药片外观（选填）</span>
          <span className="flex items-center gap-2">
            <PillIcon type={drug.pillIcon} size={44} />
            <select
              value={drug.pillIcon}
              onChange={(e) => onChange({ pillIcon: e.target.value })}
              className="w-full rounded-lg border-2 border-stone-300 px-3 py-2 text-xl focus:border-orange-500 focus:outline-none"
            >
              {PILL_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </span>
        </label>

        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="text-base font-bold text-stone-700">药品照片（选填）</legend>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current && fileRef.current.click()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              📷 上传照片
            </button>
            {drug.photoData && (
              <>
                <img
                  src={drug.photoData}
                  alt="已选药品照片预览"
                  className="size-11 rounded-lg border-2 border-stone-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => onChange({ photoData: '' })}
                  className="rounded-lg bg-red-50 px-4 py-2 text-base font-bold text-red-600 transition hover:bg-red-100"
                >
                  ✕ 移除照片
                </button>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              aria-label={`选择 ${drug.name || '新药'} 的照片`}
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
          {photoError && (
            <p role="alert" className="text-base font-bold text-red-600">
              {photoError}
            </p>
          )}
        </fieldset>

        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-base font-bold text-stone-700">特别提醒（选填）</span>
          <input
            type="text"
            value={drug.note}
            onChange={(e) => onChange({ note: e.target.value })}
            placeholder="如：绝对禁酒 / 忌吃西柚"
            className="rounded-lg border-2 border-stone-300 px-3 py-2 text-xl focus:border-orange-500 focus:outline-none"
          />
        </label>
      </div>
    </section>
  )
}
