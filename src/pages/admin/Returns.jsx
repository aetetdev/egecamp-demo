import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, PackageOpen, RotateCcw, Timer, Undo2, X } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { ORDERS, RETURNS } from '../../data/generate'
import { ago, dateShort, pct, tl } from '../../lib/format'
import { Card, PageHeader, Pill, Stat, TableWrap, Tabs, td, th, useToast } from '../../components/admin/AdminUI'
import { BarList } from '../../components/admin/charts'
import { ProductImg } from '../../components/ui/Bits'

const STEPS = {
  talep: ['Talep alındı', 'sky', 'Kargo kodu gönder', 'kargoda'],
  kargoda: ['Ürün yolda', 'ember', 'Ürün geldi, incele', 'incelemede'],
  incelemede: ['İncelemede', 'ember', 'Onayla ve ödemeyi iade et', 'iade-edildi'],
  'iade-edildi': ['İade edildi', 'moss'],
  reddedildi: ['Reddedildi', 'flame'],
}

export default function Returns() {
  const { returnPatch, patchReturn, logActivity } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState('acik')
  const list = useMemo(() => RETURNS.map((r) => ({ ...r, ...returnPatch[r.id] })), [returnPatch])
  const open = list.filter((r) => ['talep', 'kargoda', 'incelemede'].includes(r.status))
  const shown = tab === 'acik' ? open : list.filter((r) => !open.includes(r))
  const delivered = ORDERS.filter((o) => o.status === 'teslim' || o.status === 'iade').length
  const rate = (ORDERS.filter((o) => o.status === 'iade').length / delivered) * 100
  const reasons = useMemo(() => {
    const m = {}
    list.forEach((r) => (m[r.reason] = (m[r.reason] ?? 0) + 1))
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }))
  }, [list])

  const advance = (r) => {
    const next = STEPS[r.status][3]
    patchReturn(r.id, { status: next })
    logActivity(`İade ${r.id}: ${STEPS[next][0]}`, 'return')
    toast(next === 'kargoda' ? 'Anlaşmalı kargo kodu müşteriye SMS ile gönderildi' : next === 'iade-edildi' ? `${tl(r.amount)} müşterinin kartına iade edildi` : 'Durum güncellendi')
  }

  return (
    <div>
      <PageHeader title="İadeler" sub="Müşteri talebi siteden açar; kargo kodu, inceleme ve ödeme iadesi tek akışta" />
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Stat label="Açık talep" icon={Timer} value={open.length} sub="İşlem bekleyen" />
        <Stat label="İade oranı" icon={RotateCcw} value={pct(rate)} sub="Teslim edilen siparişlerde" />
        <Stat label="İade edilen tutar (90 gün)" icon={Undo2} value={tl(list.filter((r) => r.status === 'iade-edildi' && Date.now() - r.ts < 90 * 86400000).reduce((s, r) => s + r.amount, 0)).replace(',00', '')} />
        <Stat label="Ortalama çözüm süresi" icon={Check} value="3,4 gün" sub="Talepten ödemeye" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_20rem]">
        <div>
          <Tabs
            className="mb-4"
            value={tab}
            onChange={setTab}
            tabs={[
              ['acik', 'Açık talepler', open.length],
              ['kapali', 'Sonuçlanan'],
            ]}
          />
          <Card pad={false}>
            <TableWrap>
              <table className="w-full min-w-[50rem] text-[13.5px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>Talep</th>
                    <th className={th}>Ürün</th>
                    <th className={th}>Sebep</th>
                    <th className={`${th} text-right`}>Tutar</th>
                    <th className={th}>Durum</th>
                    <th className={th} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((r) => {
                    const s = STEPS[r.status]
                    return (
                      <tr key={r.id} className="hover:bg-bone/60">
                        <td className={td}>
                          <p className="tnum font-semibold">{r.id}</p>
                          <p className="text-xs text-char-400">
                            <Link to={`/yonetim/siparisler/${r.orderNo}`} className="hover:underline">
                              {r.orderNo}
                            </Link>{' '}
                            · {r.customer}
                          </p>
                        </td>
                        <td className={td}>
                          <div className="flex items-center gap-2.5">
                            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-line">
                              <ProductImg path={r.item.image} widths={[80, 80]} sizes="36px" alt="" className="absolute inset-0 h-full w-full p-0.5" />
                            </span>
                            <span className="line-clamp-1 max-w-56">{r.item.title}</span>
                          </div>
                        </td>
                        <td className={`${td} text-char-600`}>{r.reason}</td>
                        <td className={`${td} tnum text-right font-semibold`}>{tl(r.amount)}</td>
                        <td className={td}>
                          <Pill tone={s[1]}>{s[0]}</Pill>
                          <p className="mt-0.5 text-[11.5px] text-char-400">{tab === 'acik' ? ago(r.ts) : dateShort(r.ts)}</p>
                        </td>
                        <td className={`${td} text-right whitespace-nowrap`}>
                          {s[2] && (
                            <div className="flex justify-end gap-1">
                              <button onClick={() => advance(r)} className="btn btn-outline btn-sm">
                                {s[2]}
                              </button>
                              {r.status === 'incelemede' && (
                                <button
                                  onClick={() => {
                                    patchReturn(r.id, { status: 'reddedildi' })
                                    toast('İade reddedildi, müşteriye gerekçe gönderildi')
                                  }}
                                  className="rounded-lg p-2 text-char-400 hover:bg-flame-50 hover:text-flame"
                                  aria-label="Reddet"
                                >
                                  <X size={15} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </TableWrap>
            {!shown.length && (
              <div className="flex flex-col items-center py-12 text-center text-sm text-char-500">
                <PackageOpen size={26} className="mb-2 text-char-300" /> Açık iade talebi yok
              </div>
            )}
          </Card>
        </div>
        <Card title="İade sebepleri" sub="Tüm talepler">
          <BarList rows={reasons} format={(v) => `${v} talep`} />
          <p className="mt-4 rounded-lg bg-bone p-3 text-[12.5px] text-char-600">“Beden uymadı” ilk sırada: ürün sayfalarına beden tablosu eklemek iadeleri azaltır.</p>
        </Card>
      </div>
    </div>
  )
}
