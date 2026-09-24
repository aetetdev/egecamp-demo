import { useMemo, useState } from 'react'
import { Download, Lightbulb, SearchX } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { TRAFFIC } from '../../data/generate'
import { SUBCATS, TOPCATS } from '../../data/catalog'
import { groupItems, groupOrders, hourlyHeat, monthlySeries, summarize } from '../../lib/metrics'
import { CHANNEL_LABEL, PAYMENT_LABEL } from '../../lib/status'
import { num, pct, tl, tlShort } from '../../lib/format'
import { Card, PageHeader, Segmented, Stat, TableWrap, Tabs, td, th, useToast } from '../../components/admin/AdminUI'
import { BarList, Columns, Donut, Funnel, Heatmap, SERIES } from '../../components/admin/charts'
import { ProductImg } from '../../components/ui/Bits'
import { downloadCsv } from './Orders'

const DAY = 86400000

function MarginBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-mist">
        <div className="h-full rounded-full bg-moss-500" style={{ width: `${Math.min(100, value * 200)}%` }} />
      </div>
      <span className="tnum text-xs text-char-600">{pct(value * 100)}</span>
    </div>
  )
}

export default function Reports() {
  const { orders, byHandle } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState('satis')
  const [days, setDays] = useState(90)
  const [now] = useState(() => Date.now())

  const period = useMemo(() => orders.filter((o) => o.ts >= now - days * DAY), [orders, days, now])
  const sum = useMemo(() => summarize(period), [period])
  const months = useMemo(() => monthlySeries(orders, 12, now), [orders, now])
  const payments = useMemo(() => groupOrders(period, (o) => o.payment).map((g, i) => ({ label: PAYMENT_LABEL[g.key], value: g.revenue, color: SERIES[i] })), [period])
  const channels = useMemo(() => groupOrders(period, (o) => o.channel).map((g, i) => ({ label: CHANNEL_LABEL[g.key], value: g.count, color: SERIES[i] })), [period])
  const installments = useMemo(
    () =>
      groupOrders(
        period.filter((o) => o.payment === 'kart'),
        (o) => o.installments,
      )
        .sort((a, b) => a.key - b.key)
        .map((g) => ({ label: g.key == 1 ? 'Tek çekim' : `${g.key} taksit`, value: g.count })),
    [period],
  )
  const heat = useMemo(() => hourlyHeat(period), [period])
  const cats = useMemo(() => groupItems(period, (i) => i.cat), [period])
  const tops = useMemo(() => groupItems(period, (i) => i.top), [period])
  const brands = useMemo(() => groupItems(period, (i) => i.brand).slice(0, 12), [period])
  const products = useMemo(() => groupItems(period, (i) => i.handle).slice(0, 10), [period])
  const cities = useMemo(() => groupOrders(period, (o) => o.customer.city).slice(0, 15), [period])

  const traffic = TRAFFIC.days.slice(-Math.min(days, 180))
  const sessions = traffic.reduce((s, d) => s + d.sessions, 0)
  const trafficWeeks = useMemo(() => {
    const out = []
    for (let i = 0; i < traffic.length; i += 7) {
      const ch = traffic.slice(i, i + 7)
      out.push({ label: new Date(ch[0].ts).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }), sessions: ch.reduce((s, d) => s + d.sessions, 0) })
    }
    return out
  }, [traffic])

  const exportCsv = () => {
    downloadCsv(`rapor-${days}gun.csv`, [['Kategori', 'Adet', 'Ciro', 'Maliyet', 'Marj'], ...cats.map((c) => [SUBCATS[c.key]?.name ?? c.key, c.units, c.revenue.toFixed(2), c.cost.toFixed(2), ((c.revenue - c.cost) / c.revenue).toFixed(3)])])
    toast('Rapor Excel (CSV) olarak indirildi')
  }

  return (
    <div>
      <PageHeader
        title="Raporlar"
        sub="Satış, kârlılık, ziyaretçi ve arama verileri — tek yerde"
        actions={
          <>
            <Segmented
              value={days}
              onChange={setDays}
              options={[
                [30, '30 gün'],
                [90, '90 gün'],
                [365, '12 ay'],
              ]}
            />
            <button onClick={exportCsv} className="btn btn-outline btn-sm">
              <Download size={15} /> Excel
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Stat label="Ciro" value={tlShort(sum.revenue)} sub={`${num(sum.count)} sipariş`} />
        <Stat label="Ortalama sepet" value={tl(sum.aov).replace(/,\d+ TL$/, ' TL')} sub={`${num(sum.units)} ürün satıldı`} />
        <Stat label="Brüt kâr (tahmini)" value={tlShort(sum.revenue - sum.cost)} sub={`Marj ${pct(sum.margin * 100)}`} />
        <Stat label="Dönüşüm oranı" value={pct((sum.count / Math.max(1, sessions)) * 100 * (days > 180 ? 180 / days : 1), 2)} sub={`${num(sessions)} ziyaret`} />
      </div>

      <Tabs
        className="mt-6 mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          ['satis', 'Satış'],
          ['urun', 'Kategori ve marka'],
          ['sehir', 'Şehirler'],
          ['ziyaret', 'Ziyaretçi'],
          ['arama', 'Site içi arama'],
        ]}
      />

      {tab === 'satis' && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2" title="Aylık ciro" sub="Son 12 ay — kamp sezonu ve kış ısıtma zirvesi görünüyor">
            <Columns data={months} />
          </Card>
          <Card title="Ödeme yöntemleri" sub="Ciro payı">
            <Donut rows={payments} vertical height={160} />
          </Card>
          <Card title="Taksit kullanımı" sub="Kartla ödenen siparişler">
            <BarList rows={installments} format={(v) => `${num(v)} sipariş`} />
          </Card>
          <Card title="Sipariş kanalı" sub="Sipariş adedi">
            <Donut rows={channels} format={(v) => `${num(v)}`} vertical height={160} />
          </Card>
          <Card title="Hangi saatte sipariş geliyor?" sub="Gün × saat yoğunluğu">
            <Heatmap grid={heat} />
            <p className="mt-3 flex gap-2 rounded-lg bg-bone p-3 text-[12.5px] text-char-600">
              <Lightbulb size={15} className="shrink-0 text-ember-700" /> Pazar ve pazartesi akşamı 20:00–23:00 zirve. Instagram paylaşımlarını bu saatlere planlayın.
            </p>
          </Card>
        </div>
      )}

      {tab === 'urun' && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="Ana kategoriler" sub="Ciro ve kâr marjı">
            <BarList rows={tops.map((t, i) => ({ label: TOPCATS[t.key]?.name ?? t.key, value: t.revenue, color: SERIES[i % SERIES.length] }))} />
          </Card>
          <Card title="En çok satan ürünler" pad={false}>
            <ul className="divide-y divide-line">
              {products.map((g, i) => {
                const p = byHandle[g.key]
                return (
                  <li key={g.key} className="flex items-center gap-3 px-5 py-2.5 text-[13px]">
                    <span className="tnum w-4 font-bold text-char-300">{i + 1}</span>
                    <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg ring-1 ring-line">
                      <ProductImg path={p?.images[0]} widths={[80, 80]} sizes="36px" alt="" className="absolute inset-0 h-full w-full p-0.5" />
                    </span>
                    <span className="line-clamp-1 flex-1">{p?.title}</span>
                    <span className="tnum text-char-500">{g.units} ad.</span>
                    <span className="tnum w-20 text-right font-semibold">{tlShort(g.revenue)}</span>
                  </li>
                )
              })}
            </ul>
          </Card>
          <Card title="Alt kategoriler" pad={false} className="xl:col-span-2">
            <TableWrap>
              <table className="w-full min-w-[40rem] text-[13.5px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>Kategori</th>
                    <th className={`${th} text-right`}>Adet</th>
                    <th className={`${th} text-right`}>Ciro</th>
                    <th className={`${th} text-right`}>Brüt kâr</th>
                    <th className={th}>Marj</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {cats.slice(0, 16).map((c) => (
                    <tr key={c.key} className="hover:bg-bone/60">
                      <td className={`${td} font-medium`}>{SUBCATS[c.key]?.name ?? c.key}</td>
                      <td className={`${td} tnum text-right`}>{num(c.units)}</td>
                      <td className={`${td} tnum text-right font-semibold`}>{tl(c.revenue).replace(/,\d+ TL$/, ' TL')}</td>
                      <td className={`${td} tnum text-right`}>{tl(c.revenue - c.cost).replace(/,\d+ TL$/, ' TL')}</td>
                      <td className={td}>
                        <MarginBar value={(c.revenue - c.cost) / c.revenue} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Card>
          <Card title="Markalar" sub="İlk 12 marka" pad={false} className="xl:col-span-2">
            <TableWrap>
              <table className="w-full min-w-[40rem] text-[13.5px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>Marka</th>
                    <th className={`${th} text-right`}>Adet</th>
                    <th className={`${th} text-right`}>Ciro</th>
                    <th className={th}>Marj</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {brands.map((b) => (
                    <tr key={b.key} className="hover:bg-bone/60">
                      <td className={`${td} font-medium`}>{b.key}</td>
                      <td className={`${td} tnum text-right`}>{num(b.units)}</td>
                      <td className={`${td} tnum text-right font-semibold`}>{tl(b.revenue).replace(/,\d+ TL$/, ' TL')}</td>
                      <td className={td}>
                        <MarginBar value={(b.revenue - b.cost) / b.revenue} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </div>
      )}

      {tab === 'sehir' && (
        <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
          <Card title="Şehirlere göre ciro" sub={`Son ${days} gün · ilk 15 il`}>
            <BarList rows={cities.map((c) => ({ label: c.key, value: c.revenue }))} />
          </Card>
          <Card title="Şehir özeti" pad={false}>
            <TableWrap>
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>İl</th>
                    <th className={`${th} text-right`}>Sipariş</th>
                    <th className={`${th} text-right`}>Ort. sepet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {cities.map((c) => (
                    <tr key={c.key}>
                      <td className={`${td} font-medium`}>{c.key}</td>
                      <td className={`${td} tnum text-right`}>{c.count}</td>
                      <td className={`${td} tnum text-right`}>{tl(c.revenue / c.count).replace(/,\d+ TL$/, ' TL')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </div>
      )}

      {tab === 'ziyaret' && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2" title="Haftalık ziyaret" sub="Oturum sayısı">
            <Columns data={trafficWeeks} dataKey="sessions" format={(v) => `${num(v)} ziyaret`} name="Ziyaret" color={SERIES[1]} />
          </Card>
          <Card title="Trafik kaynağı" sub="Ziyaret payı">
            <Donut rows={TRAFFIC.sources.map(([label, value], i) => ({ label, value, color: SERIES[i] }))} format={(v) => `%${v}`} vertical height={160} />
          </Card>
          <Card title="Dönüşüm hunisi" sub={`Son ${Math.min(days, 180)} gün`} className="xl:col-span-2">
            <Funnel steps={TRAFFIC.funnel} base={sessions} />
          </Card>
          <Card title="Cihaz" sub="Ziyaret payı">
            <BarList rows={TRAFFIC.devices.map(([label, value], i) => ({ label, value, color: SERIES[i] }))} format={(v) => `%${v}`} showShare={false} max={100} />
            <p className="mt-4 rounded-lg bg-bone p-3 text-[12.5px] text-char-600">Ziyaretlerin %78’i telefondan. Site mobil öncelikli tasarlandı: ödeme adımı tek sayfada, 3 dokunuşta biter.</p>
          </Card>
        </div>
      )}

      {tab === 'arama' && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="En çok aranan kelimeler" pad={false}>
            <TableWrap>
              <table className="w-full text-[13.5px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className={th}>Arama</th>
                    <th className={`${th} text-right`}>Arama sayısı</th>
                    <th className={`${th} text-right`}>Sonuç</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {TRAFFIC.searches
                    .filter((s) => s[2] > 0)
                    .map(([term, n, res]) => (
                      <tr key={term}>
                        <td className={`${td} font-medium`}>{term}</td>
                        <td className={`${td} tnum text-right`}>{num(n)}</td>
                        <td className={`${td} tnum text-right text-char-500`}>{res} ürün</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </TableWrap>
          </Card>
          <Card title="Aranıp bulunamayanlar" sub="Müşteri istiyor, rafınızda yok">
            <ul className="space-y-2">
              {TRAFFIC.searches
                .filter((s) => s[2] === 0)
                .map(([term, n]) => (
                  <li key={term} className="flex items-center justify-between rounded-xl bg-flame-50/60 px-4 py-3 text-[13.5px]">
                    <span className="flex items-center gap-2 font-medium">
                      <SearchX size={16} className="text-flame" /> {term}
                    </span>
                    <span className="tnum text-char-600">{n} arama</span>
                  </li>
                ))}
            </ul>
            <p className="mt-4 flex gap-2 rounded-lg bg-bone p-3 text-[12.5px] text-char-600">
              <Lightbulb size={15} className="shrink-0 text-ember-700" /> Hamak ve kamp duşu ayda 160+ kez aranıyor. Tedarikçiden bu iki ürünü eklemek doğrudan satışa döner.
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
