import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Download, Pencil, Percent, Plus, Search, X } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { BRANDS, SUBCATS, inCategory } from '../../data/catalog'
import { CATEGORIES } from '../../data/categories'
import { PRODUCT_STATS } from '../../data/generate'
import { fold, num, tl } from '../../lib/format'
import { Card, PageHeader, Pager, Segmented, TableWrap, Toggle, td, th, useToast } from '../../components/admin/AdminUI'
import { Modal, ProductImg } from '../../components/ui/Bits'
import { downloadCsv } from './Orders'

const PER = 30

function round(price, mode) {
  if (mode === '90') return Math.max(9.9, Math.round(price / 10) * 10 - 0.1)
  if (mode === '99') return Math.max(0.99, Math.ceil(price) - 0.01)
  if (mode === 'tam') return Math.round(price)
  return Math.round(price * 100) / 100
}

function BulkPrice({ open, onClose, products, selected, filtered }) {
  const { bulkPrice, logActivity } = useStore()
  const toast = useToast()
  const [scope, setScope] = useState(selected.length ? 'secili' : 'marka')
  const [brand, setBrand] = useState('husky')
  const [cat, setCat] = useState('cadir')
  const [op, setOp] = useState('artir')
  const [value, setValue] = useState(8)
  const [mode, setMode] = useState('90')
  useEffect(() => {
    if (open) setScope(selected.length ? 'secili' : 'marka')
  }, [open, selected.length])

  const targets = useMemo(() => {
    if (scope === 'secili') return selected
    if (scope === 'marka') return products.filter((p) => p.brandSlug === brand)
    if (scope === 'kategori') return products.filter((p) => inCategory(p, cat))
    return filtered
  }, [scope, brand, cat, products, selected, filtered])

  const changes = useMemo(() => {
    const v = Number(value) || 0
    const out = []
    targets.forEach((p) =>
      p.variants.forEach((vr) => {
        let price = vr.price
        let compare = vr.compare
        if (op === 'artir') {
          price = round(vr.price * (1 + v / 100), mode)
          if (compare) compare = round(compare * (1 + v / 100), mode)
        } else if (op === 'azalt') {
          price = round(vr.price * (1 - v / 100), mode)
        } else if (op === 'indirim') {
          compare = vr.compare ?? vr.price
          price = round(compare * (1 - v / 100), mode)
        } else if (op === 'kaldir') {
          price = vr.compare ?? vr.price
          compare = null
        }
        out.push({ handle: p.handle, variantId: vr.id, title: p.title, variant: vr.title, old: vr.price, price, compare })
      }),
    )
    return out
  }, [targets, op, value, mode])

  const apply = () => {
    bulkPrice(changes)
    logActivity(`Toplu fiyat: ${targets.length} ürün (${op === 'artir' ? '+' : op === 'kaldir' ? 'indirim kaldırıldı' : '−'}${op !== 'kaldir' ? `%${value}` : ''})`, 'product')
    toast(`${num(targets.length)} ürünün fiyatı güncellendi — vitrine yansıdı`)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Toplu fiyat güncelle"
      wide
      footer={
        <>
          <button onClick={onClose} className="btn btn-outline btn-sm">
            Vazgeç
          </button>
          <button onClick={apply} disabled={!targets.length} className="btn btn-primary btn-sm">
            {num(targets.length)} ürüne uygula
          </button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Hangi ürünler?</label>
          <select value={scope} onChange={(e) => setScope(e.target.value)} className="field field-sm">
            {selected.length > 0 && <option value="secili">Seçili ürünler ({selected.length})</option>}
            <option value="marka">Bir markanın tüm ürünleri</option>
            <option value="kategori">Bir kategorinin tüm ürünleri</option>
            <option value="filtre">Listede filtrelenen ürünler ({filtered.length})</option>
          </select>
          {scope === 'marka' && (
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className="field field-sm mt-2">
              {BRANDS.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name} ({b.count})
                </option>
              ))}
            </select>
          )}
          {scope === 'kategori' && (
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="field field-sm mt-2">
              {CATEGORIES.map((c) => (
                <optgroup key={c.slug} label={c.name}>
                  <option value={c.slug}>{c.name} (tümü)</option>
                  {c.children.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="label">İşlem</label>
          <select value={op} onChange={(e) => setOp(e.target.value)} className="field field-sm">
            <option value="artir">Fiyatı yüzde artır (zam)</option>
            <option value="azalt">Fiyatı yüzde düşür</option>
            <option value="indirim">İndirim uygula (eski fiyat üstü çizili görünür)</option>
            <option value="kaldir">İndirimi kaldır</option>
          </select>
          {op !== 'kaldir' && (
            <div className="mt-2 flex gap-2">
              <div className="relative w-28">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-char-400">%</span>
                <input type="number" min="0" max="90" value={value} onChange={(e) => setValue(e.target.value)} className="field field-sm pl-7" />
              </div>
              <select value={mode} onChange={(e) => setMode(e.target.value)} className="field field-sm flex-1">
                <option value="90">Yuvarla: …9,90</option>
                <option value="99">Yuvarla: …,99</option>
                <option value="tam">Yuvarla: tam sayı</option>
                <option value="yok">Yuvarlama yok</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl ring-1 ring-line">
        <div className="flex items-center justify-between bg-bone px-4 py-2 text-xs font-semibold text-char-500">
          <span>Önizleme</span>
          <span className="tnum">
            {num(targets.length)} ürün · {num(changes.length)} varyant
          </span>
        </div>
        <ul className="max-h-64 divide-y divide-line overflow-y-auto">
          {changes.slice(0, 12).map((c) => (
            <li key={c.variantId} className="flex items-center gap-3 px-4 py-2 text-[13px]">
              <span className="min-w-0 flex-1 truncate">
                {c.title}
                {c.variant && <span className="text-char-400"> · {c.variant}</span>}
              </span>
              <span className="tnum text-char-400 line-through">{tl(c.old)}</span>
              <span className="tnum w-28 text-right font-semibold">{tl(c.price)}</span>
            </li>
          ))}
          {!changes.length && <li className="px-4 py-6 text-center text-sm text-char-400">Kapsamda ürün yok</li>}
        </ul>
      </div>
      <p className="mt-3 text-xs text-char-400">Enflasyon döneminde en çok kullanılan özellik: tedarikçi zam listesi geldiğinde tek işlemle yüzlerce ürün güncellenir, eski fiyatlar geçmişte saklanır.</p>
    </Modal>
  )
}

export default function ProductsAdmin() {
  const { products, updateProduct, updateVariant, settings } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [brand, setBrand] = useState('')
  const [stock, setStock] = useState('hepsi')
  const [page, setPage] = useState(1)
  const [sel, setSel] = useState(new Set())
  const [bulk, setBulk] = useState(false)
  const [edit, setEdit] = useState(null)

  useEffect(() => setPage(1), [q, cat, brand, stock])

  const filtered = useMemo(() => {
    const f = fold(q.trim())
    return products.filter((p) => {
      if (f && !(p.search.includes(f) || fold(p.sku).includes(f))) return false
      if (cat && !inCategory(p, cat)) return false
      if (brand && p.brandSlug !== brand) return false
      if (stock === 'stokta' && !p.available) return false
      if (stock === 'kritik' && !(p.available && p.variants.some((v) => v.stock > 0 && v.stock <= settings.lowStockThreshold))) return false
      if (stock === 'tukendi' && p.available) return false
      if (stock === 'taslak' && p.active) return false
      return true
    })
  }, [products, q, cat, brand, stock, settings.lowStockThreshold])

  const rows = filtered.slice((page - 1) * PER, page * PER)
  const selected = products.filter((p) => sel.has(p.handle))
  const inStock = products.filter((p) => p.available).length

  const exportCsv = () => {
    downloadCsv('urunler.csv', [
      ['Stok kodu', 'Ürün', 'Marka', 'Kategori', 'Varyant', 'Fiyat', 'Liste fiyatı', 'Stok', 'Durum'],
      ...filtered.flatMap((p) => p.variants.map((v) => [p.sku, p.title, p.brand, SUBCATS[p.cats[0]].name, v.title, v.price.toFixed(2).replace('.', ','), v.compare ? v.compare.toFixed(2).replace('.', ',') : '', v.stock, p.active ? 'Yayında' : 'Taslak'])),
    ])
    toast(`${filtered.length} ürün Excel (CSV) olarak indirildi`)
  }

  const savePrice = (p, value) => {
    const n = Number(String(value).replace(/\./g, '').replace(',', '.'))
    if (!n || n <= 0) return setEdit(null)
    updateVariant(p.handle, p.variants[0].id, { price: Math.round(n * 100) / 100 })
    toast(`${p.title.slice(0, 40)}… fiyatı ${tl(n)} oldu`)
    setEdit(null)
  }

  return (
    <div>
      <PageHeader
        title="Ürünler"
        sub={`${num(products.length)} ürün · ${num(inStock)} stokta · ${num(products.length - inStock)} tükendi · ${BRANDS.length} marka`}
        actions={
          <>
            <button onClick={exportCsv} className="btn btn-outline btn-sm">
              <Download size={15} /> Excel’e aktar
            </button>
            <button onClick={() => setBulk(true)} className="btn btn-dark btn-sm">
              <Percent size={15} /> Toplu fiyat güncelle
            </button>
            <Link to="/yonetim/urunler/yeni" className="btn btn-primary btn-sm">
              <Plus size={15} /> Yeni ürün
            </Link>
          </>
        }
      />

      <Card pad={false}>
        <div className="flex flex-col gap-2 border-b border-line p-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-char-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ürün adı, marka veya stok kodu" className="field field-sm pl-9" />
          </div>
          <div className="grid grid-cols-2 gap-2 lg:flex">
            <select value={cat} onChange={(e) => setCat(e.target.value)} className="field field-sm lg:w-48">
              <option value="">Tüm kategoriler</option>
              {CATEGORIES.map((c) => (
                <optgroup key={c.slug} label={c.name}>
                  <option value={c.slug}>{c.name} (tümü)</option>
                  {c.children.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className="field field-sm lg:w-40">
              <option value="">Tüm markalar</option>
              {BRANDS.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <Segmented
            size="sm"
            value={stock}
            onChange={setStock}
            options={[
              ['hepsi', 'Hepsi'],
              ['stokta', 'Stokta'],
              ['kritik', 'Kritik'],
              ['tukendi', 'Tükendi'],
              ['taslak', 'Taslak'],
            ]}
          />
        </div>

        {sel.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-char-900 px-4 py-2.5 text-white">
            <span className="mr-2 text-[13px] font-semibold">{sel.size} ürün seçili</span>
            <button onClick={() => setBulk(true)} className="btn btn-sm bg-ember text-char-950 hover:bg-ember-400">
              <Percent size={15} /> Fiyat güncelle
            </button>
            <button
              onClick={() => {
                selected.forEach((p) => updateProduct(p.handle, { active: false }))
                toast(`${sel.size} ürün taslağa alındı, vitrinden kalktı`)
                setSel(new Set())
              }}
              className="btn btn-sm bg-white/10 text-white hover:bg-white/20"
            >
              Yayından kaldır
            </button>
            <button
              onClick={() => {
                selected.forEach((p) => updateProduct(p.handle, { active: true }))
                toast(`${sel.size} ürün yayına alındı`)
                setSel(new Set())
              }}
              className="btn btn-sm bg-white/10 text-white hover:bg-white/20"
            >
              Yayınla
            </button>
            <button onClick={() => setSel(new Set())} className="ml-auto rounded-lg p-1.5 text-white/60 hover:text-white" aria-label="Seçimi temizle">
              <X size={17} />
            </button>
          </div>
        )}

        <TableWrap>
          <table className="w-full min-w-[62rem] text-[13.5px]">
            <thead>
              <tr className="border-b border-line">
                <th className={`${th} w-10`}>
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && rows.every((p) => sel.has(p.handle))}
                    onChange={(e) =>
                      setSel((s) => {
                        const n = new Set(s)
                        rows.forEach((p) => (e.target.checked ? n.add(p.handle) : n.delete(p.handle)))
                        return n
                      })
                    }
                    className="h-4 w-4 accent-[var(--color-char-900)]"
                    aria-label="Sayfadakileri seç"
                  />
                </th>
                <th className={th}>Ürün</th>
                <th className={th}>Kategori</th>
                <th className={th}>Stok</th>
                <th className={`${th} text-right`}>Satış (30 g)</th>
                <th className={`${th} text-right`}>Fiyat</th>
                <th className={th}>Yayında</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => {
                const prices = p.variants.map((v) => v.price)
                const min = Math.min(...prices)
                const max = Math.max(...prices)
                const low = p.available && p.variants.some((v) => v.stock > 0 && v.stock <= settings.lowStockThreshold)
                const s = PRODUCT_STATS[p.handle]
                return (
                  <tr key={p.handle} className={sel.has(p.handle) ? 'bg-ember-50/60' : 'hover:bg-bone/70'}>
                    <td className={td}>
                      <input
                        type="checkbox"
                        checked={sel.has(p.handle)}
                        onChange={() =>
                          setSel((x) => {
                            const n = new Set(x)
                            n.has(p.handle) ? n.delete(p.handle) : n.add(p.handle)
                            return n
                          })
                        }
                        className="h-4 w-4 accent-[var(--color-char-900)]"
                        aria-label={`${p.title} seç`}
                      />
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-line">
                          <ProductImg path={p.images[0]} widths={[100, 100]} sizes="44px" alt="" className="absolute inset-0 h-full w-full p-0.5" />
                        </span>
                        <div className="min-w-0">
                          <Link to={`/yonetim/urunler/${p.handle}`} className="line-clamp-1 max-w-[26rem] font-medium hover:underline">
                            {p.title}
                          </Link>
                          <p className="text-xs text-char-400">
                            {p.brand} · <span className="tnum">{p.sku}</span>
                            {p.variants.length > 1 && ` · ${p.variants.length} varyant`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`${td} whitespace-nowrap text-char-600`}>{SUBCATS[p.cats[0]].name}</td>
                    <td className={td}>
                      <span
                        className={`tnum inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${!p.available ? 'bg-flame-50 text-flame' : low ? 'bg-ember-50 text-ember-800' : 'bg-moss-50 text-moss-700'}`}
                      >
                        {p.available ? `${p.stock} adet` : 'Tükendi'}
                      </span>
                    </td>
                    <td className={`${td} tnum text-right whitespace-nowrap text-char-600`}>{s?.units30 ? `${s.units30} adet` : '—'}</td>
                    <td className={`${td} text-right whitespace-nowrap`}>
                      {edit === p.handle ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            savePrice(p, e.target.elements.price.value)
                          }}
                          className="flex justify-end"
                        >
                          <input name="price" autoFocus defaultValue={String(p.price).replace('.', ',')} onBlur={(e) => savePrice(p, e.target.value)} className="field field-sm w-28 text-right" />
                        </form>
                      ) : (
                        <button
                          onClick={() => (p.hasVariants && min !== max ? navigate(`/yonetim/urunler/${p.handle}`) : setEdit(p.handle))}
                          className="tnum rounded-md px-1.5 py-0.5 text-right hover:bg-mist"
                          title="Fiyatı düzenle"
                        >
                          <span className="font-semibold">{min === max ? tl(min) : `${tl(min)} – ${tl(max)}`}</span>
                          {p.compare && <span className="block text-[11px] text-char-400 line-through">{tl(p.compare)}</span>}
                        </button>
                      )}
                    </td>
                    <td className={td}>
                      <Toggle
                        size="sm"
                        checked={p.active}
                        label="Yayında"
                        onChange={(v) => {
                          updateProduct(p.handle, { active: v })
                          toast(v ? 'Ürün yayına alındı' : 'Ürün vitrinden kaldırıldı')
                        }}
                      />
                    </td>
                    <td className={`${td} text-right`}>
                      <Link to={`/yonetim/urunler/${p.handle}`} className="inline-flex rounded-lg p-2 text-char-400 hover:bg-mist hover:text-char-900" aria-label="Düzenle">
                        <Pencil size={15} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableWrap>
        <Pager page={page} pages={Math.ceil(filtered.length / PER)} onChange={setPage} total={filtered.length} per={PER} />
      </Card>

      <BulkPrice open={bulk} onClose={() => setBulk(false)} products={products} selected={selected} filtered={filtered} />
    </div>
  )
}
