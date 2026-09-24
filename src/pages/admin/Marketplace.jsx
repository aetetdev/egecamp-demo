import { useMemo, useState } from 'react'
import { AlertCircle, ArrowRightLeft, CheckCircle2, Link2, RefreshCw, Store } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { CHANNELS } from '../../data/generate'
import { periodCompare } from '../../lib/metrics'
import { hashString } from '../../lib/rand'
import { num, tl, tlShort } from '../../lib/format'
import { Card, PageHeader, Pill, TableWrap, Toggle, td, th, useToast } from '../../components/admin/AdminUI'
import { BarList } from '../../components/admin/charts'
import { ProductImg } from '../../components/ui/Bits'

const RULES = {
  trendyol: ['+%12 fiyat farkı (komisyon)', 'Yuvarlama: …9,90', 'Stok 2’nin altına inince ilanı durdur'],
  hepsiburada: ['+%10 fiyat farkı (komisyon)', 'Yuvarlama: …9,90', 'Kargo: satıcı öder'],
}

export default function Marketplace() {
  const { orders, shopProducts } = useStore()
  const toast = useToast()
  const [sync, setSync] = useState({ trendyol: true, hepsiburada: true })
  const web = useMemo(() => periodCompare(orders, 30).cur, [orders])
  const listing = useMemo(
    () =>
      shopProducts
        .filter((p) => p.available)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 9)
        .map((p) => {
          const h = hashString(p.handle)
          return { p, ty: h % 11 === 0 ? 'Barkod eksik' : 'ok', hb: h % 7 === 0 ? 'Kategori eşleşmedi' : h % 5 === 0 ? 'none' : 'ok' }
        }),
    [shopProducts],
  )
  const total = web.revenue + CHANNELS.reduce((s, c) => s + c.monthRevenue, 0)

  return (
    <div>
      <PageHeader title="Pazaryerleri" sub="Tek stok, tüm kanallar: Trendyol’da satılan ürün sitede de anında düşer" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CHANNELS.map((c) => (
          <div key={c.id} className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-line">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-black text-white" style={{ background: c.color }}>
                  {c.name[0]}
                </span>
                <span className="font-semibold">{c.name}</span>
              </span>
              {c.connected ? <Pill tone="moss">Bağlı</Pill> : <Pill>Bağlı değil</Pill>}
            </div>
            {c.connected ? (
              <>
                <dl className="mt-4 grid grid-cols-2 gap-y-2 text-[13px]">
                  <dt className="text-char-400">Listelenen</dt>
                  <dd className="tnum text-right font-semibold">{c.listed} ürün</dd>
                  <dt className="text-char-400">Bu ay</dt>
                  <dd className="tnum text-right font-semibold">{c.monthOrders} sipariş</dd>
                  <dt className="text-char-400">Ciro</dt>
                  <dd className="tnum text-right font-semibold">{tlShort(c.monthRevenue)}</dd>
                  <dt className="text-char-400">Komisyon</dt>
                  <dd className="tnum text-right">%{c.commission}</dd>
                </dl>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[12.5px]">
                  <span className="flex items-center gap-1.5 text-char-500">
                    <RefreshCw size={13} /> {c.lastSync} dk önce
                  </span>
                  <Toggle size="sm" checked={sync[c.id]} label="Senkronizasyon" onChange={(v) => { setSync((s) => ({ ...s, [c.id]: v })); toast(v ? `${c.name} senkronizasyonu açıldı` : `${c.name} senkronizasyonu durduruldu`) }} />
                </div>
                {c.errors > 0 && (
                  <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-flame">
                    <AlertCircle size={13} /> {c.errors} ilanda hata var
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mt-4 flex-1 text-[13px] text-char-500">Mağaza API bilgileriyle 10 dakikada bağlanır; ürünler kategori eşleştirmesiyle toplu listelenir.</p>
                <button onClick={() => toast(`${c.name} bağlantısı kurulum desteğiyle yapılır`, 'info')} className="btn btn-outline btn-sm mt-4">
                  <Link2 size={14} /> Bağla
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.4fr]">
        <Card title="Kanal dağılımı" sub="Son 30 gün cirosu">
          <BarList
            rows={[
              { label: 'Web sitesi (egecamp.com)', value: web.revenue, color: '#e58a00' },
              ...CHANNELS.filter((c) => c.connected).map((c, i) => ({ label: c.name, value: c.monthRevenue, color: ['#2a78d6', '#1baf7a'][i] })),
            ]}
          />
          <p className="mt-4 rounded-lg bg-bone p-3 text-[12.5px] text-char-600">
            Toplam <b>{tlShort(total)}</b>. Pazaryeri siparişleri de bu panelin sipariş listesine düşer; aynı etiket yazıcısından çıkar.
          </p>
        </Card>
        <Card title="Fiyat ve stok kuralları">
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(RULES).map(([id, rules]) => (
              <div key={id} className="rounded-xl bg-bone p-4">
                <p className="mb-2 font-semibold">{CHANNELS.find((c) => c.id === id).name}</p>
                <ul className="space-y-1.5">
                  {rules.map((r) => (
                    <li key={r} className="flex gap-2 text-[13px] text-char-700">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-moss-600" /> {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 text-[13px] text-char-500">
            <ArrowRightLeft size={15} /> Son senkronizasyon: 34 ürünün stoğu ve 12 ürünün fiyatı güncellendi.
          </p>
        </Card>
      </div>

      <Card title="İlan durumu" sub="Çok satan ürünler" pad={false} className="mt-5">
        <TableWrap>
          <table className="w-full min-w-[46rem] text-[13.5px]">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>Ürün</th>
                <th className={`${th} text-right`}>Site</th>
                <th className={`${th} text-right`}>Trendyol</th>
                <th className={th}>Trendyol ilanı</th>
                <th className={th}>Hepsiburada ilanı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {listing.map(({ p, ty, hb }) => (
                <tr key={p.handle} className="hover:bg-bone/60">
                  <td className={td}>
                    <div className="flex items-center gap-2.5">
                      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-line">
                        <ProductImg path={p.images[0]} widths={[80, 80]} sizes="36px" alt="" className="absolute inset-0 h-full w-full p-0.5" />
                      </span>
                      <span className="line-clamp-1 max-w-72">{p.title}</span>
                    </div>
                  </td>
                  <td className={`${td} tnum text-right`}>{tl(p.price)}</td>
                  <td className={`${td} tnum text-right text-char-600`}>{tl(Math.round((p.price * 1.12) / 10) * 10 - 0.1)}</td>
                  <td className={td}>{ty === 'ok' ? <Pill tone="moss">Yayında</Pill> : <Pill tone="flame">{ty}</Pill>}</td>
                  <td className={td}>{hb === 'ok' ? <Pill tone="moss">Yayında</Pill> : hb === 'none' ? <Pill>Listelenmedi</Pill> : <Pill tone="flame">{hb}</Pill>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-char-400">
        <Store size={13} /> Pazaryeri rakamları örnektir. Canlıda her kanalın resmi API’sine bağlanılır.
      </p>
    </div>
  )
}
