import React, { useState } from 'react'

export default function MemberTabs({ members, selectedId, onSelect, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [confirmId, setConfirmId] = useState(null)
  const canRemove = members.length > 1

  const submitAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
    setAdding(false)
  }

  return (
    <div
      aria-label="成员切换栏"
      className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm"
    >
      {members.map((member) => {
        const active = member.id === selectedId
        return (
          <div
            key={member.id}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-lg font-bold ${
              active ? 'bg-orange-600 text-white shadow-md' : 'bg-stone-100 text-stone-700'
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(member.id)}
              aria-pressed={active}
              aria-label={`切换到 ${member.name}`}
              className="whitespace-nowrap"
            >
              {member.name}
            </button>
            {confirmId === member.id ? (
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onRemove(member.id)
                    setConfirmId(null)
                  }}
                  aria-label={`确认删除成员 ${member.name}`}
                  className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white"
                >
                  删除
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(null)}
                  aria-label={`取消删除成员 ${member.name}`}
                  className="rounded-full bg-stone-200 px-3 py-1 text-sm font-bold text-stone-700"
                >
                  取消
                </button>
              </span>
            ) : (
              <button
                type="button"
                disabled={!canRemove}
                onClick={() => setConfirmId(member.id)}
                aria-label={`删除成员 ${member.name}`}
                className="rounded-full px-2 py-1 text-sm text-stone-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ✕
              </button>
            )}
          </div>
        )
      })}
      {adding ? (
        <span className="flex flex-wrap items-center gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitAdd()
            }}
            placeholder="称呼（如外婆、宝宝）"
            aria-label="新成员称呼"
            className="w-44 rounded-lg border-2 border-stone-300 px-3 py-2 text-lg focus:border-orange-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={submitAdd}
            aria-label="确认添加成员"
            className="rounded-lg bg-teal-600 px-3 py-2 text-base font-bold text-white transition hover:bg-teal-700"
          >
            确认
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false)
              setName('')
            }}
            aria-label="取消添加成员"
            className="rounded-lg bg-stone-200 px-3 py-2 text-base font-bold text-stone-700"
          >
            取消
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="whitespace-nowrap rounded-full bg-stone-800 px-4 py-2 text-base font-bold text-white transition hover:bg-stone-900"
        >
          ＋ 添加家人
        </button>
      )}
    </div>
  )
}
