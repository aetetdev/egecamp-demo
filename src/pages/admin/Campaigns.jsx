import { useMemo, useState } from 'react'
import { BadgePercent, CalendarRange, ExternalLink, Layers, Pencil, Plus, Ticket, Truck } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { BRANDS, brandBySlug, categoryBySlug } from '../../data/catalog'
import { CATEGORIES } from '../../data/categories'
import { inScope } from '../../lib/pricing'
import { dateShort, num, tl, tlShort } from '../../lib/format'
import { Card, PageHeader, Pill, TableWrap, Toggle, td, th, useToast } from '../../components/admin/AdminUI'
import { Modal } from '../../components/ui/Bits'

function scopeText(scope) {
  const parts = []
  if (scope.brands?.length) parts.push(scope.brands.map((b) => brandBySlug(b)?.name ?? b).join(', '))
  if (scope.cats?.length) parts.push(scope.cats.map((c) => categoryBySlug(c)?.name ?? c).join(', '))
  return parts.length ? parts.join(' · ') : 'Tüm ürünler'
}

const EMPTY = { name: '', type: 'basket', brand: '', cat: '', pct: 10, t1: 2, p1: 5, t2: 4, p2: 10, ends: '2026-12-31' }

function CampaignModal({ open, onClose, initial }) {
  const { setCampaigns, shopProducts } = useStore()
  const toast = useToast()
  const [f, setF] = useState(EMPTY)
  const [loaded, setLoaded] = useState(null)
  if (open && loaded !== (initial?.id ?? 'new')) {
    setLoaded(initial?.id ?? 'new')
    setF(
      initial
        ? {
            name: initial.name,
            type: initial.type,
            brand: initial.scope.brands?.[0] ?? '',
            cat: initial.scope.cats?.[0] ?? '',
            pct: initial.pct ?? 10,
            t1: initial.tiers?.[0]?.min ?? 2,
            p1: initial.tiers?.[0]?.pct ?? 5,
            t2: initial.tiers?.[1]?.min ?? 4,
            p2: initial.tiers?.[1]?.pct ?? 10,
            ends: initial.ends,
          }
        : EMPTY,
    )
  }
  if (!open && loaded) setLoaded(null)

  const scope = { ...(f.brand ? { brands: [f.brand] } : {}), ...(f.cat ? { cats: [f.cat] } : {}) }
  const count = useMemo(() => shopProducts.filter((p) => inScope(p, scope)).length, [shopProducts, f.brand, f.cat]) // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  const save = () => {
    const c = {
      id: initial?.id ?? `k-${Date.now()}`,
      name: f.name.trim() || (f.type === 'tiered' ? `${scopeText(scope)} adet indirimi` : `${scopeText(scope)} sepette %${f.pct}`),
      type: f.type,
      active: initial?.active ?? true,
      scope,
      ...(f.type === 'basket'
        ? { pct: Number(f.pct), badge: `Sepette %${f.pct}` }
        : {
            tiers: [
              { min: Number(f.t1), pct: Number(f.p1) },
              { min: Number(f.t2), pct: Number(f.p2) },
            ],
            badge: `${f.t1} al %${f.p1} · ${f.t2} al %${f.p2}`,
          }),
      starts: initial?.starts ?? new Date().toISOString().slice(0, 10),
      ends: f.ends,
      stats: initial?.stats ?? { orders: 0, revenue: 0 },
    }
    setCampaigns((list) => (initial ? list.map((x) => (x.id === c.id ? c : x)) : [c, ...list]))
    toast(initial ? 'Kampanya güncellendi' : 'Kampanya yayında — rozetler vitrinde')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Kampanyayı düzenle' : 'Yeni kampanya'}
      footer={
        <>
          <button onClick={onClose} className="btn btn-outline btn-sm">
            Vazgeç
          </button>
          <button onClick={save} disabled={!count} className="btn btn-primary btn-sm">
            Kaydet ve yayınla
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {[
            ['basket', 'Sepette indirim', 'Markaya / kategoriye %'],
            ['tiered', 'Kademeli adet', '2 al %5, 4 al %10'],
          ].map(([v, t, s]) => (
            <button key={v} type="button" onClick={() => setF((x) => ({ ...x, type: v }))} className={`rounded-xl p-3 text-left ring-1 ${f.type === v ? 'bg-ember-50 ring-2 ring-ember' : 'ring-stone'}`}>
              <p className="text-[13.5px] font-semibold">{t}</p>
              <p className="text-xs text-char-500">{s}</p>
            </button>
          ))}
        </div>
        <div>
          <label className="label">Kampanya adı</label>
          <input value={f.name} onChange={set('name')} placeholder="Boş bırakırsanız otomatik verilir" className="field field-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Marka</label>
            <select value={f.brand} onChange={set('brand')} className="field field-sm">
              <option value="">Tüm markalar</option>
              {BRANDS.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Kategori</label>
            <select value={f.cat} onChange={set('cat')} className="field field-sm">
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
          </div>
        </div>
        {f.type === 'basket' ? (
          <div>
            <label className="label">İndirim oranı</label>
            <div className="relative w-32">
              <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-char-400">%</span>
              <input type="number" min="1" max="70" value={f.pct} onChange={set('pct')} className="field field-sm pl-7" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[
              ['t1', 'p1'],
              ['t2', 'p2'],
            ].map(([t, p], i) => (
              <div key={t} className="rounded-xl bg-bone p-3">
                <p className="mb-2 text-xs font-semibold text-char-500">{i + 1}. kademe</p>
                <div className="flex items-center gap-2 text-sm">
                  <input type="number" min="2" value={f[t]} onChange={set(t)} className="field field-sm w-16" /> adet →
                  <span className="relative">
                    <span className="absolute top-1/2 left-2 -translate-y-1/2 text-xs text-char-400">%</span>
                    <input type="number" min="1" value={f[p]} onChange={set(p)} className="field field-sm w-16 pl-6" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div>
          <label className="label">Bitiş tarihi</label>
          <input type="date" value={f.ends} onChange={set('ends')} className="field field-sm w-48" />
        </div>
        <p className={`rounded-lg px-3 py-2 text-[13px] ${count ? 'bg-moss-50 text-moss-700' : 'bg-flame-50 text-flame'}`}>{count ? `${num(count)} ürün kapsamda — kartlarda “${f.type === 'basket' ? `Sepette %${f.pct}` : `${f.t1} al %${f.p1}`}” rozeti görünecek.` : 'Bu kapsamda ürün yok.'}</p>
      </div>
    </Modal>
  )
}

function CouponModal({ open, onClose }) {
  const { setCoupons } = useStore()
  const toast = useToast()
  const [f, setF] = useState({ code: 'KIS15', kind: 'pct', value: 15, minTotal: 2000, limit: 300, expires: '2026-12-31', note: '' })
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yeni kupon"
      footer={
        <>
          <button onClick={onClose} className="btn btn-outline btn-sm">
            Vazgeç
          </button>
          <button
            onClick={() => {
              setCoupons((list) => [{ ...f, code: f.code.toUpperCase().replace(/\s/g, ''), value: Number(f.value), minTotal: Number(f.minTotal), limit: Number(f.limit), used: 0, active: true }, ...list])
              toast(`${f.code.toUpperCase()} kuponu oluşturuldu — sepette denenebilir`)
              onClose()
            }}
            className="btn btn-primary btn-sm"
          >
            Oluştur
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Kupon kodu</label>
          <input value={f.code} onChange={set('code')} className="field field-sm font-mono uppercase" />
        </div>
        <div>
          <label className="label">Tür</label>
          <select value={f.kind} onChange={set('kind')} className="field field-sm">
            <option value="pct">Yüzde indirim</option>
            <option value="amount">Sabit tutar (TL)</option>
          </select>
        </div>
        <div>
          <label className="label">Değer</label>
          <input type="number" value={f.value} onChange={set('value')} className="field field-sm" />
        </div>
        <div>
          <label className="label">En az sepet (TL)</label>
          <input type="number" value={f.minTotal} onChange={set('minTotal')} className="field field-sm" />
        </div>
        <div>
          <label className="label">Kullanım limiti</label>
          <input type="number" value={f.limit} onChange={set('limit')} className="field field-sm" />
        </div>
        <div>
          <label className="label">Son geçerlilik</label>
          <input type="date" value={f.expires} onChange={set('expires')} className="field field-sm" />
        </div>
        <div>
          <label className="label">Not</label>
          <input value={f.note} onChange={set('note')} placeholder="Nerede paylaşıldı?" className="field field-sm" />
        </div>
      </div>
    </Modal>
  )
}

export default function Campaigns() {
  const { campaigns, setCampaigns, coupons, setCoupons, settings, setSettings, shopProducts } = useStore()
  const toast = useToast()
  const [modal, setModal] = useState(null)
  const [coupon, setCoupon] = useState(false)

  const previewLink = (c) => {
    if (c.scope.brands?.length === 1 && !c.scope.cats?.length) return `/marka/${c.scope.brands[0]}`
    if (c.scope.cats?.length === 1 && !c.scope.brands?.length) return `/kategori/${c.scope.cats[0]}`
    const p = shopProducts.find((x) => x.available && inScope(x, c.scope))
    return p ? `/urun/${p.handle}` : '/'
  }

  return (
    <div>
      <PageHeader
        title="Kampanyalar ve kuponlar"
        sub="Açtığınız an ürün kartlarındaki rozetten ödeme özetine kadar her yerde geçerli"
        actions={
          <>
            <button onClick={() => setCoupon(true)} className="btn btn-outline btn-sm">
              <Ticket size={15} /> Yeni kupon
            </button>
            <button onClick={() => setModal({})} className="btn btn-primary btn-sm">
              <Plus size={15} /> Yeni kampanya
            </button>
          </>
        }
      />

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-line">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ember-50 text-ember-700">
            <Truck size={20} />
          </span>
          <div className="flex-1">
            <p className="text-[13px] text-char-500">Ücretsiz kargo eşiği</p>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings((s) => ({ ...s, freeShippingThreshold: Number(e.target.value) || 0 }))}
                className="field field-sm w-28 font-semibold"
              />
              <span className="text-sm text-char-500">TL ve üzeri</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-line">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ember-50 text-ember-700">
            <BadgePercent size={20} />
          </span>
          <div className="flex-1">
            <p className="text-[13px] text-char-500">Havale / EFT indirimi</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-char-500">%</span>
              <input
                type="number"
                value={settings.transferDiscountPct}
                onChange={(e) => setSettings((s) => ({ ...s, transferDiscountPct: Number(e.target.value) || 0 }))}
                className="field field-sm w-20 font-semibold"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl bg-char-900 p-4 text-white">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-ember">
            <Layers size={20} />
          </span>
          <div>
            <p className="text-[13px] text-white/60">Kampanya kuralı</p>
            <p className="text-[13.5px]">Bir ürüne birden çok kampanya uyarsa en yüksek oran uygulanır, üst üste binmez.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns.map((c) => {
          const n = shopProducts.filter((p) => inScope(p, c.scope)).length
          return (
            <div key={c.id} className={`flex flex-col rounded-2xl bg-white p-5 ring-1 transition ${c.active ? 'ring-line' : 'opacity-70 ring-line'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Pill tone={c.active ? 'moss' : 'neutral'}>{c.active ? 'Yayında' : 'Kapalı'}</Pill>
                    <Pill tone="ember">{c.type === 'tiered' ? 'Kademeli adet' : 'Sepette indirim'}</Pill>
                  </div>
                  <p className="text-[15.5px] font-semibold">{c.name}</p>
                  <p className="mt-0.5 text-[13px] text-char-500">
                    {scopeText(c.scope)} · {num(n)} ürün
                  </p>
                </div>
                <Toggle
                  checked={c.active}
                  label="Yayında"
                  onChange={(v) => {
                    setCampaigns((list) => list.map((x) => (x.id === c.id ? { ...x, active: v } : x)))
                    toast(v ? `“${c.badge}” rozeti ${num(n)} üründe görünüyor` : 'Kampanya kapatıldı, vitrinden kalktı')
                  }}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {c.type === 'tiered' ? (
                  c.tiers.map((t) => (
                    <span key={t.min} className="rounded-xl bg-bone px-3 py-2 text-center">
                      <span className="display block text-2xl">%{t.pct}</span>
                      <span className="text-[11.5px] text-char-500">{t.min}+ adet</span>
                    </span>
                  ))
                ) : (
                  <span className="rounded-xl bg-bone px-3 py-2 text-center">
                    <span className="display block text-2xl">%{c.pct}</span>
                    <span className="text-[11.5px] text-char-500">sepette</span>
                  </span>
                )}
                <div className="ml-auto self-end text-right text-[12.5px] text-char-500">
                  <p className="flex items-center justify-end gap-1">
                    <CalendarRange size={13} /> {dateShort(c.starts)} – {dateShort(c.ends)}
                  </p>
                  {c.stats.orders > 0 && (
                    <p className="mt-0.5">
                      <b className="text-char-800">{num(c.stats.orders)}</b> sipariş · <b className="text-char-800">{tlShort(c.stats.revenue)}</b> ciro
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2 border-t border-line pt-3">
                <button onClick={() => setModal(c)} className="btn btn-ghost btn-sm">
                  <Pencil size={14} /> Düzenle
                </button>
                <a href={previewLink(c)} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                  <ExternalLink size={14} /> Vitrinde gör
                </a>
              </div>
            </div>
          )
        })}
      </div>

      <Card title="Kuponlar" sub="Instagram, bülten ya da mağaza kartvizitinde paylaşılan kodlar" className="mt-6" pad={false}>
        <TableWrap>
          <table className="w-full min-w-[48rem] text-[13.5px]">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>Kod</th>
                <th className={th}>İndirim</th>
                <th className={th}>En az sepet</th>
                <th className={th}>Kullanım</th>
                <th className={th}>Son gün</th>
                <th className={th}>Not</th>
                <th className={th}>Aktif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {coupons.map((c) => (
                <tr key={c.code} className="hover:bg-bone/60">
                  <td className={td}>
                    <span className="rounded-md bg-char-900 px-2 py-1 font-mono text-[12.5px] font-bold text-white">{c.code}</span>
                  </td>
                  <td className={`${td} font-semibold`}>{c.kind === 'pct' ? `%${c.value}` : tl(c.value)}</td>
                  <td className={`${td} tnum text-char-600`}>{c.minTotal ? tl(c.minTotal) : '—'}</td>
                  <td className={td}>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-mist">
                        <div className="h-full rounded-full bg-ember" style={{ width: `${Math.min(100, (c.used / c.limit) * 100)}%` }} />
                      </div>
                      <span className="tnum text-xs text-char-500">
                        {c.used}/{c.limit}
                      </span>
                    </div>
                  </td>
                  <td className={`${td} whitespace-nowrap text-char-600`}>{dateShort(c.expires)}</td>
                  <td className={`${td} text-char-500`}>{c.note}</td>
                  <td className={td}>
                    <Toggle size="sm" checked={c.active} label="Aktif" onChange={(v) => setCoupons((list) => list.map((x) => (x.code === c.code ? { ...x, active: v } : x)))} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <CampaignModal open={!!modal} initial={modal?.id ? modal : null} onClose={() => setModal(null)} />
      <CouponModal open={coupon} onClose={() => setCoupon(false)} />
    </div>
  )
}
