import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Search, TrendingUp, X } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { BRANDS, SUBCATS, searchProducts } from '../../data/catalog'
import { fold, tl } from '../../lib/format'
import { ProductImg } from '../ui/Bits'

const POPULAR = ['Stanley termos', 'Çadır sobası', 'Husky çadır', 'Kamp sandalyesi', 'Uyku tulumu', 'Dizel ısıtıcı']

/** Anlık sonuçlu arama — ürün, kategori ve marka önerir */
export default function SearchBox({ autoFocus = false, onDone, className = '' }) {
  const { shopProducts } = useStore()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const wrap = useRef(null)

  useEffect(() => {
    const close = (e) => {
      if (wrap.current && !wrap.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const results = useMemo(() => (q.trim().length > 1 ? searchProducts(shopProducts, q, 6) : []), [q, shopProducts])
  const total = useMemo(() => (q.trim().length > 1 ? searchProducts(shopProducts, q).length : 0), [q, shopProducts])
  const cats = useMemo(() => {
    const f = fold(q.trim())
    if (f.length < 2) return []
    return Object.values(SUBCATS).filter((c) => fold(c.name).includes(f)).slice(0, 3)
  }, [q])
  const brands = useMemo(() => {
    const f = fold(q.trim())
    if (f.length < 2) return []
    return BRANDS.filter((b) => fold(b.name).startsWith(f)).slice(0, 3)
  }, [q])

  const go = (term) => {
    const t = (term ?? q).trim()
    if (!t) return
    setOpen(false)
    onDone?.()
    navigate(`/ara?q=${encodeURIComponent(t)}`)
  }
  const pick = () => {
    setOpen(false)
    setQ('')
    onDone?.()
  }

  return (
    <div ref={wrap} className={`relative ${className}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          go()
        }}
        className="relative"
      >
        <Search size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-char-400" />
        <input
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          type="search"
          placeholder="Ürün, marka veya kategori ara…"
          aria-label="Ürün ara"
          className="h-11 w-full rounded-xl border border-transparent bg-mist pr-10 pl-10 text-[14px] text-char-900 placeholder:text-char-400 focus:border-ember-600 focus:bg-white focus:outline-none focus:ring-3 focus:ring-ember/20"
        />
        {q && (
          <button type="button" onClick={() => setQ('')} aria-label="Temizle" className="absolute top-1/2 right-3 -translate-y-1/2 text-char-400 hover:text-char-900">
            <X size={16} />
          </button>
        )}
      </form>

      {open && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 animate-pop overflow-hidden rounded-xl bg-white ring-1 ring-line card-lift-lg">
          {q.trim().length < 2 ? (
            <div className="p-4">
              <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold text-char-500">
                <TrendingUp size={14} /> Popüler aramalar
              </p>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR.map((t) => (
                  <button key={t} type="button" onClick={() => go(t)} className="rounded-full bg-mist px-3 py-1.5 text-[13px] text-char-700 hover:bg-stone">
                    {t}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 && !cats.length && !brands.length ? (
            <div className="p-5 text-sm text-char-500">
              “{q}” için sonuç bulunamadı. Farklı bir kelime deneyin ya da{' '}
              <a href="https://wa.me/905403630111" className="font-semibold text-ember-700 underline" target="_blank" rel="noreferrer">
                WhatsApp’tan sorun
              </a>
              .
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              {(cats.length > 0 || brands.length > 0) && (
                <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
                  {cats.map((c) => (
                    <Link key={c.slug} to={`/kategori/${c.slug}`} onClick={pick} className="rounded-full bg-ember-50 px-3 py-1 text-[13px] font-medium text-ember-800 hover:bg-ember-100">
                      {c.name}
                    </Link>
                  ))}
                  {brands.map((b) => (
                    <Link key={b.slug} to={`/marka/${b.slug}`} onClick={pick} className="rounded-full bg-mist px-3 py-1 text-[13px] font-medium text-char-700 hover:bg-stone">
                      {b.name} <span className="text-char-400">· {b.count}</span>
                    </Link>
                  ))}
                </div>
              )}
              <ul>
                {results.map((p) => (
                  <li key={p.handle}>
                    <Link to={`/urun/${p.handle}`} onClick={pick} className="flex items-center gap-3 px-3 py-2 hover:bg-bone">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-line">
                        <ProductImg path={p.images[0]} widths={[120, 120]} sizes="48px" alt="" className="absolute inset-0 h-full w-full p-1" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium text-char-800">{p.title}</p>
                        <p className="text-xs text-char-400">{p.brand}{!p.available && ' · Tükendi'}</p>
                      </div>
                      <span className="tnum shrink-0 text-[13.5px] font-semibold">{tl(p.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {total > results.length && (
                <button type="button" onClick={() => go()} className="flex w-full items-center justify-center gap-1.5 border-t border-line py-3 text-[13px] font-semibold text-char-800 hover:bg-bone">
                  {total} sonucun tümünü gör <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
