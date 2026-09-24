import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, ImagePlus, Save, Sparkles, TrendingUp } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { BRANDS, SUBCATS, TOPCATS, img, loadDetails } from '../../data/catalog'
import { CATEGORIES } from '../../data/categories'
import { PRODUCT_STATS } from '../../data/generate'
import { hashString } from '../../lib/rand'
import { num, pct, tl } from '../../lib/format'
import { Card, Pill, Toggle, useToast } from '../../components/admin/AdminUI'
import { ProductImg } from '../../components/ui/Bits'

const parseMoney = (s) => {
  const n = Number(String(s).replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'))
  return isFinite(n) ? n : 0
}

export default function ProductEditor() {
  const { handle } = useParams()
  const creating = handle === 'yeni'
  const { byHandle, updateProduct, updateVariant, setStock } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const p = creating ? null : byHandle[handle]
  const [form, setForm] = useState(null)
  const [desc, setDesc] = useState('')

  useEffect(() => {
    if (creating) {
      setForm({ title: '', active: false, cat: 'cadir', brand: 'egecamp', variants: [{ id: 'new', title: '', price: '', compare: '', stock: '' }] })
      return
    }
    if (!p) return
    setForm({
      title: p.title,
      active: p.active,
      cat: p.cats[0],
      brand: p.brandSlug,
      variants: p.variants.map((v) => ({ id: v.id, title: v.title, price: String(v.price).replace('.', ','), compare: v.compare ? String(v.compare).replace('.', ',') : '', stock: String(v.stock) })),
    })
    loadDetails().then((d) => setDesc((d[p.handle]?.desc ?? []).join('\n\n')))
  }, [handle]) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = PRODUCT_STATS[handle]
  const views = useMemo(() => (p ? Math.round((stats?.units30 ?? 0) * 38 + (hashString(handle) % 400) + 120) : 0), [p, stats, handle])

  if (!creating && !p) {
    return (
      <div className="py-20 text-center">
        <p className="font-semibold">Ürün bulunamadı</p>
        <Link to="/yonetim/urunler" className="btn btn-outline btn-sm mt-4">
          Ürünlere dön
        </Link>
      </div>
    )
  }
  if (!form) return null

  const setV = (i, k, v) => setForm((f) => ({ ...f, variants: f.variants.map((x, j) => (j === i ? { ...x, [k]: v } : x)) }))
  const first = form.variants[0]
  const price = parseMoney(first.price)
  const cost = p ? price * p.costRatio : price * 0.6
  const margin = price ? (price - cost) / price : 0

  const save = () => {
    if (creating) {
      toast('Ürün taslak olarak kaydedildi (demo)')
      navigate('/yonetim/urunler')
      return
    }
    updateProduct(p.handle, { title: form.title.trim() || p.title, active: form.active })
    form.variants.forEach((v) => {
      const orig = p.variants.find((x) => x.id === v.id)
      const np = parseMoney(v.price)
      const nc = v.compare === '' ? null : parseMoney(v.compare)
      if (np && (np !== orig.price || nc !== orig.compare)) updateVariant(p.handle, v.id, { price: np, compare: nc && nc > np ? nc : null })
      const ns = Math.max(0, Math.round(Number(v.stock) || 0))
      if (ns !== orig.stock) setStock(v.id, ns)
    })
    toast('Kaydedildi — değişiklik vitrinde')
  }

  const seoTitle = `${form.title || 'Ürün adı'} | Ege Camp Outdoor`
  const seoDesc = (desc || 'Ürün açıklaması').replace(/\s+/g, ' ').slice(0, 155)

  return (
    <div>
      <Link to="/yonetim/urunler" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-char-500 hover:text-char-900">
        <ArrowLeft size={15} /> Ürünler
      </Link>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="line-clamp-1 font-sans text-[1.5rem] font-bold tracking-tight normal-case">{creating ? 'Yeni ürün' : p.title}</h1>
          {!creating && (
            <p className="mt-1 text-[13px] text-char-500">
              <span className="tnum">{p.sku}</span> · {p.brand} · {SUBCATS[p.cats[0]].name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {!creating && (
            <a href={`/urun/${p.handle}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
              <ExternalLink size={15} /> Mağazada gör
            </a>
          )}
          <button onClick={save} className="btn btn-primary btn-sm">
            <Save size={15} /> Kaydet
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_21rem]">
        <div className="space-y-5">
          <Card title="Temel bilgiler">
            <label className="label">Ürün adı</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="field" />
            <div className="mt-4 flex items-center justify-between">
              <label className="label !mb-0">Açıklama</label>
              <button type="button" onClick={() => toast('Yapay zekâ ile açıklama önerisi hazırlanıyor… (demo)', 'info')} className="flex items-center gap-1 text-[12.5px] font-semibold text-ember-700 hover:underline">
                <Sparkles size={14} /> Yapay zekâ ile yaz
              </button>
            </div>
            <textarea rows={8} value={desc} onChange={(e) => setDesc(e.target.value)} className="field mt-1.5 leading-6" />
          </Card>

          <Card title="Görseller" sub="Sürükleyerek sıralayın; ilk görsel vitrinde kapak olur">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {(p?.images ?? []).map((path, i) => (
                <div key={path} className={`relative aspect-square overflow-hidden rounded-xl bg-white ring-1 ${i === 0 ? 'ring-2 ring-ember' : 'ring-line'}`}>
                  <ProductImg path={path} widths={[200, 200]} sizes="120px" alt="" className="absolute inset-0 h-full w-full p-1.5" />
                  {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-ember px-1.5 text-[10px] font-bold text-char-950">Kapak</span>}
                </div>
              ))}
              <button type="button" onClick={() => toast('Görsel yükleme canlı sürümde açık (demo)', 'info')} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone text-char-400 hover:border-char-300 hover:text-char-600">
                <ImagePlus size={20} />
                <span className="text-[11px] font-medium">Ekle</span>
              </button>
            </div>
          </Card>

          <Card title={form.variants.length > 1 ? `Varyantlar (${form.variants.length})` : 'Fiyat ve stok'} pad={false}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-[13.5px]">
                <thead>
                  <tr className="border-b border-line text-left text-[11.5px] font-semibold tracking-wide text-char-400 uppercase">
                    {form.variants.length > 1 && <th className="px-5 py-2.5">Varyant</th>}
                    <th className="px-3 py-2.5">Satış fiyatı</th>
                    <th className="px-3 py-2.5">Liste fiyatı (üstü çizili)</th>
                    <th className="px-3 py-2.5">Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {form.variants.map((v, i) => (
                    <tr key={v.id}>
                      {form.variants.length > 1 && <td className="px-5 py-2.5 font-medium whitespace-nowrap">{v.title}</td>}
                      <td className="px-3 py-2.5">
                        <div className="relative">
                          <input value={v.price} onChange={(e) => setV(i, 'price', e.target.value)} inputMode="decimal" className="field field-sm pr-8 text-right" />
                          <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-char-400">TL</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="relative">
                          <input value={v.compare} onChange={(e) => setV(i, 'compare', e.target.value)} inputMode="decimal" placeholder="—" className="field field-sm pr-8 text-right" />
                          <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-xs text-char-400">TL</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <input value={v.stock} onChange={(e) => setV(i, 'stock', e.target.value.replace(/\D/g, ''))} inputMode="numeric" className={`field field-sm w-24 text-right ${Number(v.stock) === 0 ? 'text-flame' : ''}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-3 divide-x divide-line border-t border-line bg-bone/50 text-center text-[13px]">
              <div className="px-3 py-3">
                <p className="text-char-400">Maliyet (tahmini)</p>
                <p className="tnum font-semibold">{tl(cost)}</p>
              </div>
              <div className="px-3 py-3">
                <p className="text-char-400">Birim kâr</p>
                <p className="tnum font-semibold">{tl(price - cost)}</p>
              </div>
              <div className="px-3 py-3">
                <p className="text-char-400">Kâr marjı</p>
                <p className={`tnum font-semibold ${margin < 0.25 ? 'text-flame' : 'text-moss-700'}`}>{pct(margin * 100)}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Durum">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{form.active ? 'Yayında' : 'Taslak'}</p>
                <p className="text-xs text-char-400">{form.active ? 'Vitrinde görünüyor' : 'Vitrinde gizli'}</p>
              </div>
              <Toggle checked={form.active} onChange={(v) => setForm((f) => ({ ...f, active: v }))} label="Yayında" />
            </div>
          </Card>

          {!creating && (
            <Card title="Performans" sub="Son 30 gün">
              <div className="grid grid-cols-2 gap-3 text-center">
                {[
                  ['Görüntülenme', num(views)],
                  ['Satış', `${stats?.units30 ?? 0} adet`],
                  ['Ciro', tl(stats?.revenue30 ?? 0).replace(',00', '')],
                  ['Dönüşüm', pct(views ? ((stats?.units30 ?? 0) / views) * 100 : 0, 1)],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-xl bg-bone px-2 py-3">
                    <p className="text-[11.5px] text-char-400">{l}</p>
                    <p className="tnum mt-0.5 text-[15px] font-bold">{v}</p>
                  </div>
                ))}
              </div>
              {(stats?.units30 ?? 0) > 3 && (
                <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-moss-700">
                  <TrendingUp size={14} /> Kategorisinde en çok satan ilk %10’da
                </p>
              )}
            </Card>
          )}

          <Card title="Düzenleme">
            <label className="label">Kategori</label>
            <select value={form.cat} onChange={(e) => setForm((f) => ({ ...f, cat: e.target.value }))} className="field field-sm">
              {CATEGORIES.map((c) => (
                <optgroup key={c.slug} label={c.name}>
                  {c.children.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <label className="label mt-3">Marka</label>
            <select value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} className="field field-sm">
              {BRANDS.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
            {!creating && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {p.own && <Pill tone="ember">EgeCamp® kendi markası</Pill>}
                {p.series && <Pill tone="dark">{p.series.toUpperCase()} serisi</Pill>}
                <Pill>{TOPCATS[p.top].name}</Pill>
              </div>
            )}
          </Card>

          <Card title="Google önizlemesi" sub="Arama sonucunda böyle görünür">
            <div className="rounded-xl bg-bone p-3">
              <p className="text-[12px] text-char-500">egecamp.com › urun › {creating ? 'yeni-urun' : p.handle.slice(0, 28)}…</p>
              <p className="mt-0.5 line-clamp-1 text-[15px] text-[#1a0dab]">{seoTitle}</p>
              <p className="mt-0.5 line-clamp-2 text-[12.5px] text-char-600">{seoDesc}</p>
            </div>
            {!creating && p.images[0] && (
              <div className="mt-3 flex items-center gap-2 text-xs text-char-400">
                <img src={img(p.images[0], 80)} alt="" className="h-8 w-8 rounded object-contain ring-1 ring-line" /> Paylaşım görseli (Instagram, WhatsApp)
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
