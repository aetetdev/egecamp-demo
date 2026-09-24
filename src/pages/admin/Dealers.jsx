import { useMemo, useState } from 'react'
import { Building2, Check, FileText, Handshake, Inbox, MapPin, Phone, Wallet, X } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { DEALERS, DEALER_GROUPS } from '../../data/generate'
import { rng } from '../../lib/rand'
import { ago, dateShort, num, tl, tlShort } from '../../lib/format'
import { Card, PageHeader, Pill, Stat, TableWrap, Tabs, td, th, useToast } from '../../components/admin/AdminUI'
import { ProductImg } from '../../components/ui/Bits'

export default function Dealers() {
  const { dealerApps, decideDealer, shopProducts, logActivity } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState('bayiler')
  const [groupFor, setGroupFor] = useState({})
  const pending = dealerApps.filter((a) => !a.decision)
  const approved = dealerApps.filter((a) => a.decision?.status === 'onay')
  const dealers = [
    ...approved.map((a) => ({ id: a.id, name: a.company, city: a.city, contact: a.person, group: a.decision.group, since: new Date().toISOString().slice(0, 10), balance: 0, total: 0, lastOrder: null, fresh: true })),
    ...DEALERS,
  ]

  const featured = useMemo(() => shopProducts.filter((p) => p.available && p.own).sort((a, b) => b.popularity - a.popularity).slice(0, 6), [shopProducts])
  const b2bOrders = useMemo(() => {
    const r = rng('b2b-v1')
    return Array.from({ length: 12 }, (_, i) => {
      const d = r.pick(DEALERS)
      const lines = r.int(4, 18)
      return {
        no: `BY-${1480 - i}`,
        dealer: d.name,
        city: d.city,
        lines,
        units: lines * r.int(3, 8),
        total: Math.round(r.float(18000, 96000)),
        ts: Date.now() - (i * 2.3 + r.float(0.2, 1.5)) * 86400000,
        status: i < 2 ? 'hazirlaniyor' : i < 4 ? 'sevk' : 'tamam',
        term: r.pick(['Peşin', '30 gün vade', '60 gün vade']),
      }
    })
  }, [])

  const monthTotal = b2bOrders.filter((o) => Date.now() - o.ts < 30 * 86400000).reduce((s, o) => s + o.total, 0)

  return (
    <div>
      <PageHeader title="Bayiler ve toptan satış" sub="Başvuru, bayiye özel fiyat, cari hesap ve bayi siparişleri" />
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Stat label="Aktif bayi" icon={Handshake} value={dealers.length} sub={`${new Set(dealers.map((d) => d.city)).size} ilde`} />
        <Stat label="Bekleyen başvuru" icon={Inbox} value={pending.length} sub="Onay bekliyor" />
        <Stat label="Bayi cirosu (30 gün)" icon={Building2} value={tlShort(monthTotal)} sub={`${b2bOrders.filter((o) => Date.now() - o.ts < 30 * 86400000).length} toptan sipariş`} />
        <Stat label="Cari alacak" icon={Wallet} value={tlShort(DEALERS.reduce((s, d) => s + d.balance, 0))} sub="Vadesi gelen: 12.300 TL" />
      </div>

      <Tabs
        className="mt-6 mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          ['bayiler', 'Bayiler', dealers.length],
          ['basvuru', 'Başvurular', pending.length],
          ['fiyat', 'Fiyat grupları'],
          ['siparis', 'Bayi siparişleri'],
        ]}
      />

      {tab === 'bayiler' && (
        <Card pad={false}>
          <TableWrap>
            <table className="w-full min-w-[54rem] text-[13.5px]">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Bayi</th>
                  <th className={th}>Fiyat grubu</th>
                  <th className={th}>Bayi olduğu tarih</th>
                  <th className={`${th} text-right`}>Toplam alım</th>
                  <th className={`${th} text-right`}>Cari bakiye</th>
                  <th className={th}>Son sipariş</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {dealers.map((d) => {
                  const g = DEALER_GROUPS.find((x) => x.id === d.group)
                  return (
                    <tr key={d.id} className="hover:bg-bone/60">
                      <td className={td}>
                        <p className="flex items-center gap-2 font-medium">
                          {d.name} {d.fresh && <Pill tone="moss">Yeni</Pill>}
                        </p>
                        <p className="text-xs text-char-400">
                          {d.city} · {d.contact}
                        </p>
                      </td>
                      <td className={td}>
                        <Pill tone={d.group === 'A' ? 'ember' : 'neutral'}>
                          {g.name} · %{g.pct}
                        </Pill>
                      </td>
                      <td className={`${td} text-char-600`}>{dateShort(d.since)}</td>
                      <td className={`${td} tnum text-right font-semibold`}>{d.total ? tl(d.total).replace(',00', '') : '—'}</td>
                      <td className={`${td} tnum text-right ${d.balance ? 'font-semibold text-ember-800' : 'text-char-400'}`}>{d.balance ? tl(d.balance).replace(',00', '') : 'Borcu yok'}</td>
                      <td className={`${td} text-char-500`}>{d.lastOrder != null ? `${d.lastOrder} gün önce` : 'Henüz yok'}</td>
                      <td className={`${td} text-right`}>
                        <button onClick={() => toast(`${d.name} cari ekstresi e-postayla gönderildi`)} className="btn btn-ghost btn-sm">
                          <FileText size={14} /> Ekstre
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      )}

      {tab === 'basvuru' && (
        <div className="grid gap-4 lg:grid-cols-2">
          {pending.length === 0 && (
            <Card className="lg:col-span-2">
              <p className="py-8 text-center text-sm text-char-500">Bekleyen başvuru yok. Vitrindeki “Bayilik” sayfasından yeni başvuru deneyebilirsiniz.</p>
            </Card>
          )}
          {pending.map((a) => (
            <div key={a.id} className="rounded-2xl bg-white p-5 ring-1 ring-line">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[15.5px] font-semibold">{a.company}</p>
                  <p className="mt-0.5 text-[13px] text-char-500">
                    {a.person} · {ago(a.ts)}
                  </p>
                </div>
                <Pill tone="sky">{a.id}</Pill>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
                <p className="flex items-center gap-2 text-char-600">
                  <MapPin size={14} className="text-char-400" /> {a.city}
                </p>
                <p className="flex items-center gap-2 text-char-600">
                  <Phone size={14} className="text-char-400" /> {a.phone}
                </p>
                <p className="text-char-600">
                  <span className="text-char-400">Kanal:</span> {a.type}
                </p>
                <p className="text-char-600">
                  <span className="text-char-400">Aylık alım:</span> {a.volume}
                </p>
              </div>
              {a.note && <p className="mt-3 rounded-lg bg-bone px-3 py-2 text-[13px] text-char-600">“{a.note}”</p>}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <select value={groupFor[a.id] ?? 'C'} onChange={(e) => setGroupFor((g) => ({ ...g, [a.id]: e.target.value }))} className="field field-sm w-40">
                  {DEALER_GROUPS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (%{g.pct})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    decideDealer(a.id, { status: 'onay', group: groupFor[a.id] ?? 'C' })
                    logActivity(`Bayi onaylandı: ${a.company}`, 'dealer')
                    toast(`${a.company} onaylandı — bayi paneli giriş bilgileri SMS ile gönderildi`)
                  }}
                  className="btn btn-primary btn-sm"
                >
                  <Check size={15} /> Onayla
                </button>
                <button
                  onClick={() => {
                    decideDealer(a.id, { status: 'red' })
                    toast('Başvuru reddedildi')
                  }}
                  className="btn btn-ghost btn-sm text-flame"
                >
                  <X size={15} /> Reddet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'fiyat' && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {DEALER_GROUPS.map((g) => (
              <div key={g.id} className="rounded-2xl bg-white p-5 ring-1 ring-line">
                <p className="text-sm font-semibold">{g.name}</p>
                <p className="display mt-1 text-4xl">%{g.pct}</p>
                <p className="text-[13px] text-char-500">liste fiyatından indirim</p>
                <p className="mt-3 text-xs text-char-400">
                  {g.desc} · {dealers.filter((d) => d.group === g.id).length} bayi
                </p>
              </div>
            ))}
          </div>
          <Card title="Bayi fiyat önizlemesi" sub="EgeCamp® ürünlerinde gruplara göre fiyat" pad={false}>
            <TableWrap>
              <table className="w-full min-w-[46rem] text-[13.5px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>Ürün</th>
                    <th className={`${th} text-right`}>Perakende</th>
                    {DEALER_GROUPS.map((g) => (
                      <th key={g.id} className={`${th} text-right`}>
                        {g.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {featured.map((p) => (
                    <tr key={p.handle}>
                      <td className={td}>
                        <div className="flex items-center gap-2.5">
                          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-line">
                            <ProductImg path={p.images[0]} widths={[80, 80]} sizes="36px" alt="" className="absolute inset-0 h-full w-full p-0.5" />
                          </span>
                          <span className="line-clamp-1">{p.title}</span>
                        </div>
                      </td>
                      <td className={`${td} tnum text-right`}>{tl(p.price)}</td>
                      {DEALER_GROUPS.map((g) => (
                        <td key={g.id} className={`${td} tnum text-right font-semibold`}>
                          {tl(p.price * (1 - g.pct / 100))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </div>
      )}

      {tab === 'siparis' && (
        <Card pad={false}>
          <TableWrap>
            <table className="w-full min-w-[48rem] text-[13.5px]">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Sipariş</th>
                  <th className={th}>Bayi</th>
                  <th className={`${th} text-right`}>Kalem / adet</th>
                  <th className={th}>Ödeme</th>
                  <th className={`${th} text-right`}>Tutar</th>
                  <th className={th}>Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {b2bOrders.map((o) => (
                  <tr key={o.no} className="hover:bg-bone/60">
                    <td className={td}>
                      <p className="tnum font-semibold">{o.no}</p>
                      <p className="text-xs text-char-400">{ago(o.ts)}</p>
                    </td>
                    <td className={td}>
                      <p className="font-medium">{o.dealer}</p>
                      <p className="text-xs text-char-400">{o.city}</p>
                    </td>
                    <td className={`${td} tnum text-right text-char-600`}>
                      {o.lines} / {num(o.units)}
                    </td>
                    <td className={`${td} text-char-600`}>{o.term}</td>
                    <td className={`${td} tnum text-right font-semibold`}>{tl(o.total).replace(',00', '')}</td>
                    <td className={td}>
                      <Pill tone={o.status === 'tamam' ? 'moss' : o.status === 'sevk' ? 'sky' : 'ember'}>{o.status === 'tamam' ? 'Teslim edildi' : o.status === 'sevk' ? 'Sevkte' : 'Hazırlanıyor'}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      )}
    </div>
  )
}
