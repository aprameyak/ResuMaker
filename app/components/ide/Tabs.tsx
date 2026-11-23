'use client'

import { useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

export interface TabDef { id: string; label: string; badge?: string; panel: ReactNode }

interface Props {
  tabs: TabDef[]
  active: string
  onChange(id: string): void
  idPrefix: string
  label: string
}

/** WAI-ARIA tabs with automatic activation. All panels stay mounted so their state survives tab changes. */
export default function Tabs({ tabs, active, onChange, idPrefix, label }: Props) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next < 0) return
    e.preventDefault()
    onChange(tabs[next].id)
    refs.current[tabs[next].id]?.focus()
  }

  return (
    <div className="ide-tabs">
      <div role="tablist" aria-label={label} className="ide-tablist">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={el => { refs.current[t.id] = el }}
            role="tab"
            type="button"
            id={`${idPrefix}-tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`${idPrefix}-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            className="ide-tab"
            onClick={() => onChange(t.id)}
            onKeyDown={e => onKey(e, i)}
          >
            {t.label}{t.badge ? <span className="ide-tab-badge">{t.badge}</span> : null}
          </button>
        ))}
      </div>
      {tabs.map(t => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${idPrefix}-panel-${t.id}`}
          aria-labelledby={`${idPrefix}-tab-${t.id}`}
          hidden={active !== t.id}
          className="ide-tabpanel"
          tabIndex={0}
        >
          {t.panel}
        </div>
      ))}
    </div>
  )
}
