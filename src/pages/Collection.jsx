import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ChevronRight, SlidersHorizontal, X, Search } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { BRANDS, SUBCATS, TOPCATS, brandBySlug, categoryBySlug, inCategory, searchProducts, seriesBySlug, img } from '../data/catalog'
import { CATEGORIES } from '../data/categories'
import { BRAND } from '../config/brand'
import { ProductGrid } from '../components/site/ProductCard'
import { Drawer } from '../components/ui/Bits'
import { fold, num } from '../lib/format'
import NotFound from './NotFound'

const PAGE = 24
const SORTS = [
  ['onerilen', 'Önerilen'],
  ['cok-satan', 'Çok satanlar'],
  ['fiyat-artan', 'Fiyat: düşükten yükseğe'],
  ['fiyat-azalan', 'Fiyat: yüksekten düşüğe'],
  ['yeni', 'En yeniler'],
  ['indirim', 'İndirim oranı'],
]
const PRICE_PRESETS = [
  [0, 500, '500 TL altı'],
  [500, 1500, '500 – 1.500 TL'],
  [1500, 5000, '1.500 – 5.000 TL'],
  [5000, null, '5.000 TL üstü'],
]

const listParam = (sp, k) => (sp.get(k) ? sp.get(k).split(',').filter(Boolean) : [])

function useContextInfo(mode, slug, q) {
  if (mode === 'category') {
    const cat = categoryBySlug(slug)
    if (!cat) return null
    const top = TOPCATS[slug] ? cat : TOPCATS[cat.parent]
    return {
      title: cat.name,
      blurb: TOPCATS[slug] ? cat.blurb : null,
      crumbs: TOPCATS[slug] ? [] : [[`/kategori/${top.slug}`, top.name]],
      chips: top.children.length > 1 ? top.children : [],
      activeChip: slug,
      topSlug: top.slug,
      image: BRAND.categoryImages[slug] ?? BRAND.categoryImages[top.slug],
      filter: (p) => inCategory(p, slug),
    }
  }
  if (mode === 'brand') {
    const b = brandBySlug(slug)
    if (!b) return null
    return { title: b.name, blurb: `${b.name} ürünleri — Ege Camp Outdoor güvencesiyle, yetkili satıcıdan.`, crumbs: [['/urunler', 'Markalar']], filter: (p) => p.brandSlug === slug, hideBrand: true }
  }
  if (mode === 'series') {
    const s = seriesBySlug(slug)
    if (!s) return null
    return { title: s.name, blurb: s.blurb, image: BRAND.seriesImages[slug], crumbs: [], filter: (p) => p.series === slug, series: true }
  }
  if (mode === 'sale') return { title: 'Fırsatlar', blurb: 'İndirimdeki tüm ürünler. Stoklarla sınırlıdır.', crumbs: [], filter: (p) => p.compare && p.compare > p.price }
  if (mode === 'search') return { title: q ? `“${q}”` : 'Arama', blurb: null, crumbs: [], search: true }
  return { title: 'Tüm ürünler', blurb: 'Kamp, outdoor ve av ekipmanlarının tamamı.', crumbs: [], chips: CATEGORIES, filter: () => true }
}

function FilterPanel({ base, sp, set, ctx }) {
  const [brandQ, setBrandQ] = useState('')
  const subcats = useMemo(() => {
    const counts = {}
    base.forEach((p) => p.cats.forEach((c) => (counts[c] = (counts[c] ?? 0) + 1)))
    return Object.entries(counts)
      .map(([slug, n]) => ({ slug, n, name: SUBCATS[slug].name }))
      .sort((a, b) => b.n - a.n)
  }, [base])
  const brands = useMemo(() => {
    const counts = {}
    base.forEach((p) => (counts[p.brandSlug] = (counts[p.brandSlug] ?? 0) + 1))
    return BRANDS.filter((b) => counts[b.slug]).map((b) => ({ ...b, n: counts[b.slug] })).sort((a, b) => b.n - a.n)
  }, [base])
  const selBrands = listParam(sp, 'marka')
  const selCats = listParam(sp, 'alt')
  const toggle = (key, val) => {
    const cur = listParam(sp, key)
    set(key, cur.includes(val) ? cur.filter((x) => x !== val).join(',') : [...cur, val].join(','))
  }
  const min = sp.get('min')
  const max = sp.get('max')
  const shownBrands = brandQ ? brands.filter((b) => fold(b.name).includes(fold(brandQ))) : brands.slice(0, 12)

  return (
    <div className="space-y-7">
      <div className="space-y-2.5">
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
          <span className="font-medium text-char-800">Sadece stoktakiler</span>
          <input type="checkbox" checked={sp.get('stok') === '1'} onChange={(e) => set('stok', e.target.checked ? '1' : '')} className="h-4.5 w-4.5 accent-[var(--color-char-900)]" />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
          <span className="font-medium text-char-800">İndirimli ürünler</span>
          <input type="checkbox" checked={sp.get('indirim') === '1'} onChange={(e) => set('indirim', e.target.checked ? '1' : '')} className="h-4.5 w-4.5 accent-[var(--color-char-900)]" />
        </label>
      </div>

      {!ctx.hideCats && subcats.length > 1 && (
        <div>
          <p className="mb-2.5 text-xs font-bold tracking-[0.14em] text-char-500 uppercase">Kategori</p>
          <ul className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {subcats.map((c) => (
              <li key={c.slug}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-md py-1 text-sm text-char-700 hover:text-char-950">
                  <input type="checkbox" checked={selCats.includes(c.slug)} onChange={() => toggle('alt', c.slug)} className="h-4 w-4 accent-[var(--color-char-900)]" />
                  <span className="flex-1">{c.name}</span>
                  <span className="tnum text-xs text-char-400">{c.n}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!ctx.hideBrand && brands.length > 1 && (
        <div>
          <p className="mb-2.5 text-xs font-bold tracking-[0.14em] text-char-500 uppercase">Marka</p>
          {brands.length > 12 && (
            <div className="relative mb-2">
              <Search size={14} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-char-400" />
              <input value={brandQ} onChange={(e) => setBrandQ(e.target.value)} placeholder="Marka ara" className="field field-sm pl-8" />
            </div>
          )}
          <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
            {shownBrands.map((b) => (
              <li key={b.slug}>
                <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-char-700 hover:text-char-950">
                  <input type="checkbox" checked={selBrands.includes(b.slug)} onChange={() => toggle('marka', b.slug)} className="h-4 w-4 accent-[var(--color-char-900)]" />
                  <span className="flex-1">{b.name}</span>
                  <span className="tnum text-xs text-char-400">{b.n}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-2.5 text-xs font-bold tracking-[0.14em] text-char-500 uppercase">Fiyat</p>
        <div className="space-y-1">
          {PRICE_PRESETS.map(([lo, hi, label]) => {
            const on = String(lo) === (min ?? '0') && String(hi ?? '') === (max ?? '') && (min || max)
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (on) set({ min: '', max: '' })
                  else set({ min: lo ? String(lo) : '', max: hi ? String(hi) : '' })
                }}
                className={`block w-full rounded-md px-2 py-1.5 text-left text-sm ${on ? 'bg-char-900 font-medium text-white' : 'text-char-700 hover:bg-mist'}`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input inputMode="numeric" placeholder="En az" value={min ?? ''} onChange={(e) => set('min', e.target.value.replace(/\D/g, ''))} className="field field-sm" />
          <span className="text-char-300">—</span>
          <input inputMode="numeric" placeholder="En çok" value={max ?? ''} onChange={(e) => set('max', e.target.value.replace(/\D/g, ''))} className="field field-sm" />
        </div>
      </div>
    </div>
  )
}

export default function Collection({ mode }) {
  const { slug } = useParams()
  const [sp, setSp] = useSearchParams()
  const { shopProducts } = useStore()
  const q = sp.get('q') ?? ''
  const ctx = useContextInfo(mode, slug, q)
  const [page, setPage] = useState(1)
  const [drawer, setDrawer] = useState(false)

  useEffect(() => setPage(1), [slug, sp])

  const set = (key, val) => {
    const next = new URLSearchParams(sp)
    const entries = typeof key === 'object' ? Object.entries(key) : [[key, val]]
    entries.forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)))
    setSp(next, { replace: true })
  }

  const base = useMemo(() => {
    if (!ctx) return []
    if (ctx.search) return searchProducts(shopProducts, q)
    return shopProducts.filter(ctx.filter)
  }, [ctx?.title, shopProducts, q, mode, slug]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const brands = listParam(sp, 'marka')
    const cats = listParam(sp, 'alt')
    const min = Number(sp.get('min') || 0)
    const max = Number(sp.get('max') || 0)
    let list = base.filter(
      (p) =>
        (!brands.length || brands.includes(p.brandSlug)) &&
        (!cats.length || p.cats.some((c) => cats.includes(c))) &&
        (!min || p.price >= min) &&
        (!max || p.price <= max) &&
        (sp.get('stok') !== '1' || p.available) &&
        (sp.get('indirim') !== '1' || (p.compare && p.compare > p.price)),
    )
    const sort = sp.get('sirala') ?? 'onerilen'
    const avail = (a, b) => Number(b.available) - Number(a.available)
    const by = {
      onerilen: (a, b) => avail(a, b) || (ctx?.search ? 0 : b.popularity - a.popularity),
      'cok-satan': (a, b) => b.popularity - a.popularity,
      'fiyat-artan': (a, b) => a.price - b.price,
      'fiyat-azalan': (a, b) => b.price - a.price,
      yeni: (a, b) => (a.created < b.created ? 1 : -1),
      indirim: (a, b) => (b.compare ? 1 - b.price / b.compare : 0) - (a.compare ? 1 - a.price / a.compare : 0),
    }[sort]
    list = [...list].sort(by)
    return list
  }, [base, sp, ctx?.search])

  if (!ctx) return <NotFound />

  const active = [
    ...listParam(sp, 'alt').map((s) => ['alt', s, SUBCATS[s]?.name]),
    ...listParam(sp, 'marka').map((s) => ['marka', s, brandBySlug(s)?.name]),
    ...(sp.get('min') || sp.get('max') ? [['fiyat', '', `${sp.get('min') ? num(sp.get('min')) : 0} – ${sp.get('max') ? num(sp.get('max')) : '∞'} TL`]] : []),
    ...(sp.get('stok') === '1' ? [['stok', '1', 'Stoktakiler']] : []),
    ...(sp.get('indirim') === '1' ? [['indirim', '1', 'İndirimli']] : []),
  ]
  const removeChip = (k, v) => {
    if (k === 'fiyat') return set({ min: '', max: '' })
    if (k === 'alt' || k === 'marka') return set(k, listParam(sp, k).filter((x) => x !== v).join(','))
    set(k, '')
  }
  const shown = filtered.slice(0, page * PAGE)

  return (
    <div>
      <div className={`relative isolate overflow-hidden ${ctx.image ? 'bg-char-900 text-white' : 'border-b border-line bg-white'}`}>
        {ctx.image && (
          <>
            <img src={img(ctx.image, 1600)} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-char-950/90 via-char-950/60 to-char-950/20" />
          </>
        )}
        <div className={`shell ${ctx.image ? 'py-10 md:py-14' : 'py-7 md:py-9'}`}>
          <nav className={`mb-3 flex flex-wrap items-center gap-1 text-[12.5px] ${ctx.image ? 'text-white/60' : 'text-char-400'}`}>
            <Link to="/" className="hover:underline">Ana sayfa</Link>
            {ctx.crumbs.map(([to, label]) => (
              <span key={to} className="flex items-center gap-1">
                <ChevronRight size={13} />
                <Link to={to} className="hover:underline">{label}</Link>
              </span>
            ))}
            <ChevronRight size={13} />
            <span className={ctx.image ? 'text-white' : 'text-char-700'}>{mode === 'search' ? 'Arama' : ctx.title}</span>
          </nav>
          <h1 className={`display text-[2.4rem] md:text-[3.4rem] ${ctx.image ? 'text-white' : ''}`}>
            {mode === 'search' && <span className="text-char-400">Arama: </span>}
            {ctx.title}
          </h1>
          {ctx.blurb && <p className={`mt-2 max-w-xl text-[15px] ${ctx.image ? 'text-white/75' : 'text-char-500'}`}>{ctx.blurb}</p>}
          {ctx.chips?.length > 0 && (
            <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
              {ctx.topSlug && (
                <Link
                  to={`/kategori/${ctx.topSlug}`}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium ring-1 ${ctx.activeChip === ctx.topSlug ? 'bg-ember text-char-950 ring-ember' : ctx.image ? 'bg-white/10 text-white ring-white/20 hover:bg-white/20' : 'bg-white text-char-700 ring-line hover:ring-char-300'}`}
                >
                  Tümü
                </Link>
              )}
              {ctx.chips.map((c) => (
                <Link
                  key={c.slug}
                  to={`/kategori/${c.slug}`}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium ring-1 ${ctx.activeChip === c.slug ? 'bg-ember text-char-950 ring-ember' : ctx.image ? 'bg-white/10 text-white ring-white/20 hover:bg-white/20' : 'bg-white text-char-700 ring-line hover:ring-char-300'}`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="shell grid gap-8 pt-6 lg:grid-cols-[15rem_1fr] lg:pt-8">
        <aside className="hidden lg:block">
          <div className="sticky top-36">
            <FilterPanel base={base} sp={sp} set={set} ctx={ctx} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-char-500">
              <b className="tnum text-char-900">{num(filtered.length)}</b> ürün
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setDrawer(true)} className="btn btn-outline btn-sm lg:hidden">
                <SlidersHorizontal size={15} /> Filtrele {active.length > 0 && <span className="tnum rounded-full bg-char-900 px-1.5 text-[11px] text-white">{active.length}</span>}
              </button>
              <select value={sp.get('sirala') ?? 'onerilen'} onChange={(e) => set('sirala', e.target.value === 'onerilen' ? '' : e.target.value)} className="field field-sm w-auto pr-8" aria-label="Sırala">
                {SORTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {active.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {active.map(([k, v, label]) => (
                <button key={`${k}-${v}`} onClick={() => removeChip(k, v)} className="flex items-center gap-1.5 rounded-full bg-char-900 py-1 pr-2 pl-3 text-[12.5px] font-medium text-white hover:bg-char-700">
                  {label} <X size={13} />
                </button>
              ))}
              <button onClick={() => setSp(q ? { q } : {}, { replace: true })} className="text-[12.5px] font-semibold text-char-500 underline hover:text-char-900">
                Temizle
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-line">
              <p className="display text-3xl">Sonuç yok</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-char-500">
                {mode === 'search' ? 'Aradığınız ürünü bulamadık. Stokta olmayan ürünler için WhatsApp’tan bize yazın, tedarik edelim.' : 'Filtreleri gevşetmeyi deneyin.'}
              </p>
              <Link to="/urunler" className="btn btn-dark mt-5">
                Tüm ürünlere göz at
              </Link>
            </div>
          ) : (
            <>
              <ProductGrid products={shown} eagerCount={4} className="xl:grid-cols-4" />
              {shown.length < filtered.length && (
                <div className="mt-10 flex flex-col items-center gap-3">
                  <p className="text-xs text-char-400">
                    {num(filtered.length)} üründen {num(shown.length)} tanesini görüyorsunuz
                  </p>
                  <div className="h-1 w-48 overflow-hidden rounded-full bg-stone">
                    <div className="h-full bg-char-900" style={{ width: `${(shown.length / filtered.length) * 100}%` }} />
                  </div>
                  <button onClick={() => setPage((p) => p + 1)} className="btn btn-outline mt-1">
                    Daha fazla göster
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} side="left" width="max-w-sm" label="Filtreler">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <p className="display text-2xl">Filtrele</p>
          <button onClick={() => setDrawer(false)} className="rounded-lg p-1.5 text-char-400 hover:bg-mist" aria-label="Kapat">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <FilterPanel base={base} sp={sp} set={set} ctx={ctx} />
        </div>
        <div className="border-t border-line p-4 pb-safe">
          <button onClick={() => setDrawer(false)} className="btn btn-dark w-full">
            {num(filtered.length)} ürünü göster
          </button>
        </div>
      </Drawer>
    </div>
  )
}
