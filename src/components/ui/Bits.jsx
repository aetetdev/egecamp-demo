import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Minus, Plus, Star, X } from 'lucide-react'
import { img, srcSet } from '../../data/catalog'
import { tl } from '../../lib/format'

/** Saniyede bir güncellenen "şimdi" — geri sayımlar için */
export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(t)
  }, [interval])
  return now
}

/** Aynı gün kargo için kalan süre (saniye) — kesim saati geçtiyse null */
export function cutoffRemaining(now, cutoffHour) {
  const d = new Date(now)
  const cut = new Date(d.getFullYear(), d.getMonth(), d.getDate(), cutoffHour).getTime()
  const day = d.getDay()
  if (day === 0) return null // Pazar kargo yok
  return cut > now ? Math.floor((cut - now) / 1000) : null
}

/** Shopify CDN görseli: tembel yükleme, yumuşak açılış, hata durumunda sade zemin */
export function ProductImg({ path, alt = '', sizes = '(min-width: 1024px) 25vw, 50vw', widths, className = '', eager = false, fit = 'contain' }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth) setLoaded(true)
  }, [path])
  if (!path || error) return <div className={`bg-mist ${className}`} aria-hidden />
  return (
    <img
      ref={ref}
      src={img(path, widths?.[1] ?? 540)}
      srcSet={srcSet(path, widths)}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      className={`${fit === 'cover' ? 'object-cover' : 'object-contain'} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}

export function Stars({ value, size = 13, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-px ${className}`} aria-label={`5 üzerinden ${value}`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i))
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-stone" fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="text-ember" fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        )
      })}
    </span>
  )
}

export function Price({ price, compare, size = 'md', className = '' }) {
  const off = compare && compare > price ? Math.round((1 - price / compare) * 100) : 0
  const big = size === 'lg'
  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${className}`}>
      <span className={`tnum font-bold text-char-900 ${big ? 'text-3xl tracking-tight' : 'text-[15px]'}`}>{tl(price)}</span>
      {off > 0 && (
        <>
          <span className={`tnum text-char-400 line-through ${big ? 'text-base' : 'text-xs'}`}>{tl(compare)}</span>
          {big && <span className="rounded-md bg-flame-50 px-1.5 py-0.5 text-xs font-bold text-flame">%{off} indirim</span>}
        </>
      )}
    </div>
  )
}

export function QtyStepper({ value, onChange, min = 1, max = 99, size = 'md' }) {
  const h = size === 'sm' ? 'h-8' : 'h-11'
  const w = size === 'sm' ? 'w-8' : 'w-10'
  return (
    <div className={`inline-flex ${h} items-center rounded-lg border border-stone bg-white`}>
      <button type="button" aria-label="Azalt" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className={`${w} flex h-full items-center justify-center text-char-600 hover:text-char-900 disabled:opacity-30`}>
        <Minus size={14} />
      </button>
      <span className="tnum min-w-7 text-center text-sm font-semibold">{value}</span>
      <button type="button" aria-label="Artır" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className={`${w} flex h-full items-center justify-center text-char-600 hover:text-char-900 disabled:opacity-30`}>
        <Plus size={14} />
      </button>
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide = false, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade bg-char-950/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative flex max-h-[92vh] w-full animate-pop flex-col overflow-hidden rounded-t-2xl bg-white card-lift-lg sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
      >
        {title && (
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h3 className="font-sans text-base font-semibold normal-case tracking-normal">{title}</h3>
            <button onClick={onClose} className="-mr-1 rounded-lg p-1.5 text-char-400 hover:bg-mist hover:text-char-900" aria-label="Kapat">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line bg-bone/60 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function Drawer({ open, onClose, side = 'right', width = 'max-w-md', children, label }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 animate-fade bg-char-950/45" onClick={onClose} />
      <aside
        aria-label={label}
        className={`absolute top-0 bottom-0 flex w-full ${width} flex-col bg-white card-lift-lg ${side === 'right' ? 'right-0 animate-drawer' : 'left-0 animate-drawer-left'}`}
      >
        {children}
      </aside>
    </div>,
    document.body,
  )
}

export function Tag({ children, tone = 'neutral', className = '' }) {
  const tones = {
    neutral: 'bg-mist text-char-700',
    ember: 'bg-ember text-char-950',
    dark: 'bg-char-900 text-white',
    moss: 'bg-moss-600 text-white',
    mossSoft: 'bg-moss-50 text-moss-700',
    flame: 'bg-flame text-white',
    flameSoft: 'bg-flame-50 text-flame',
    outline: 'border border-stone bg-white text-char-700',
    sky: 'bg-sky-50 text-sky-600',
  }
  return <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-4 ${tones[tone]} ${className}`}>{children}</span>
}

export function SectionTitle({ eyebrow, title, action, className = '' }) {
  return (
    <div className={`mb-5 flex items-end justify-between gap-4 md:mb-7 ${className}`}>
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h2 className="display text-[2rem] md:text-[2.6rem]">{title}</h2>
      </div>
      {action}
    </div>
  )
}
