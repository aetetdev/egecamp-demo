import { createContext, useCallback, useContext, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Info, Minus } from 'lucide-react'
import { STATUS } from '../../lib/status'
import { pct } from '../../lib/format'

/* ------------------------------------------------------------ bildirim (toast) */

const ToastContext = createContext(() => {})
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((text, kind = 'ok') => {
    const id = Date.now() + Math.random()
    setItems((x) => [...x, { id, text, kind }])
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3200)
  }, [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed right-4 bottom-4 z-[90] flex flex-col items-end gap-2">
          {items.map((t) => (
            <div key={t.id} className="pointer-events-auto flex max-w-sm animate-pop items-start gap-2.5 rounded-xl bg-char-900 px-4 py-3 text-[13.5px] text-white card-lift-lg">
              {t.kind === 'ok' ? <CheckCircle2 size={17} className="mt-px shrink-0 text-moss-100" /> : <Info size={17} className="mt-px shrink-0 text-ember-300" />}
              {t.text}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
export const useToast = () => useContext(ToastContext)

/* ------------------------------------------------------------ düzen */

export function PageHeader({ title, sub, actions, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <h1 className="font-sans text-[1.6rem] font-bold tracking-tight normal-case md:text-[1.85rem]">{title}</h1>
        {sub && <p className="mt-1 text-[13.5px] text-char-500">{sub}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({ title, sub, action, children, className = '', pad = true, id }) {
  return (
    <section id={id} className={`min-w-0 rounded-2xl bg-white ring-1 ring-line ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-1">
          <div className="min-w-0">
            {title && <h2 className="font-sans text-[15px] font-semibold tracking-normal normal-case">{title}</h2>}
            {sub && <p className="mt-0.5 text-xs text-char-400">{sub}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={pad ? 'p-5 pt-3' : ''}>{children}</div>
    </section>
  )
}

export function Delta({ value, goodUp = true, suffix = 'önceki döneme göre' }) {
  if (value == null || !isFinite(value)) return <span className="text-xs text-char-400">—</span>
  const flat = Math.abs(value) < 0.5
  const up = value > 0
  const good = flat ? null : up === goodUp
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className={`inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 font-semibold ${good == null ? 'bg-mist text-char-500' : good ? 'bg-moss-50 text-moss-700' : 'bg-flame-50 text-flame'}`}>
        <Icon size={13} />
        {pct(Math.abs(value))}
      </span>
      {suffix && <span className="text-char-400">{suffix}</span>}
    </span>
  )
}

export function Sparkline({ data, color = '#e58a00', height = 36, className = '' }) {
  if (!data?.length) return null
  const w = 120
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, height - 3 - ((v - min) / (max - min || 1)) * (height - 6)])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className={`w-full ${className}`} style={{ height }} preserveAspectRatio="none" aria-hidden>
      <path d={`${d} L${w} ${height} L0 ${height} Z`} fill={color} opacity="0.1" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function Stat({ label, value, delta, goodUp, sub, spark, icon: Icon, deltaSuffix }) {
  return (
    <div className="flex min-w-0 flex-col rounded-2xl bg-white p-4 ring-1 ring-line md:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-char-500">{label}</p>
        {Icon && <Icon size={17} className="text-char-300" />}
      </div>
      <p className="tnum mt-1.5 text-[1.6rem] leading-tight font-bold tracking-tight md:text-[1.75rem]">{value}</p>
      <div className="mt-1.5 min-h-5">{delta !== undefined ? <Delta value={delta} goodUp={goodUp} suffix={deltaSuffix} /> : sub && <p className="text-xs text-char-400">{sub}</p>}</div>
      {spark && <Sparkline data={spark} className="mt-2" />}
    </div>
  )
}

export function StatusPill({ status, className = '' }) {
  const s = STATUS[status]
  if (!s) return null
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap ${s.pill} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

export function Pill({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'bg-mist text-char-600',
    ember: 'bg-ember-50 text-ember-800',
    moss: 'bg-moss-50 text-moss-700',
    flame: 'bg-flame-50 text-flame',
    sky: 'bg-sky-50 text-sky-600',
    dark: 'bg-char-900 text-white',
  }
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap ${tones[tone]} ${className}`}>{children}</span>
}

export function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div className={`no-scrollbar flex gap-1 overflow-x-auto border-b border-line ${className}`}>
      {tabs.map(([id, label, count]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[13.5px] font-semibold transition ${value === id ? 'border-ember text-char-900' : 'border-transparent text-char-400 hover:text-char-700'}`}
        >
          {label}
          {count != null && <span className={`tnum rounded-full px-1.5 text-[11px] ${value === id ? 'bg-char-900 text-white' : 'bg-mist text-char-500'}`}>{count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Segmented({ options, value, onChange, size = 'md' }) {
  return (
    <div className="inline-flex rounded-lg bg-mist p-0.5">
      {options.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-md font-semibold transition ${size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3 py-1.5 text-[12.5px]'} ${value === v ? 'bg-white text-char-900 shadow-sm' : 'text-char-500 hover:text-char-800'}`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label, size = 'md' }) {
  const w = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11'
  const k = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const tx = size === 'sm' ? 'translate-x-4' : 'translate-x-5'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onChange(!checked)
      }}
      className={`relative inline-flex ${w} shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-moss-500' : 'bg-char-200'}`}
    >
      <span className={`inline-block ${k} transform rounded-full bg-white shadow transition-transform ${checked ? tx : 'translate-x-0.5'}`} />
    </button>
  )
}

export function Empty({ icon: Icon, title, sub, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mist text-char-400">
          <Icon size={22} />
        </span>
      )}
      <p className="mt-3 font-semibold">{title}</p>
      {sub && <p className="mt-1 max-w-sm text-sm text-char-500">{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Tablo sarmalayıcı — mobilde yatay kaydırma */
export function TableWrap({ children, className = '' }) {
  return <div className={`-mx-px overflow-x-auto ${className}`}>{children}</div>
}
export const th = 'px-4 py-2.5 text-left text-[11.5px] font-semibold tracking-wide text-char-400 uppercase whitespace-nowrap'
export const td = 'px-4 py-3 align-middle'

/** Basit sayfalama */
export function Pager({ page, pages, onChange, total, per }) {
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-[13px] text-char-500">
      <span className="tnum">
        {(page - 1) * per + 1}–{Math.min(total, page * per)} / {total}
      </span>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="btn btn-outline btn-sm">
          Önceki
        </button>
        <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="btn btn-outline btn-sm">
          Sonraki
        </button>
      </div>
    </div>
  )
}
