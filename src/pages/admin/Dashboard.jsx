import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Eye, MessageCircle, PackageCheck, Percent, ShoppingBag, ShoppingCart, Timer, Wallet } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { ABANDONED, TRAFFIC } from '../../data/generate'
import { TOPCATS } from '../../data/catalog'
import { dailySeries, groupItems, groupOrders, periodCompare, todayCompare, weekly } from '../../lib/metrics'
import { ago, dayName, dateShort, duration, hm, num, pct, tl, tlRound, tlShort } from '../../lib/format'
import { Card, Delta, PageHeader, Segmented, Stat, StatusPill, TableWrap, td, th, useToast } from '../../components/admin/AdminUI'
import { BarList, Donut, RevenueChart, SERIES } from '../../components/admin/charts'
import { ProductImg, cutoffRemaining, useNow } from '../../components/ui/Bits'
import { BRAND } from '../../config/brand'

function greeting(h) {
  if (h < 6) return 'İyi geceler'
  if (h < 12) return 'Günaydın'
  if (h < 18) return 'İyi günler'
  return 'İyi akşamlar'
}

export default function Dashboard() {
  const { orders, products, settings } = useStore()
  const toast = useToast()
  const [days, setDays] = useState(30)
  const [metric, setMetric] = useState('revenue')
  const now = useNow(30000)

  const cmp = useMemo(() => periodCompare(orders, days, now), [orders, days, now])
  const today = useMemo(() => todayCompare(orders, now), [orders, now])
  const series = useMemo(() => {
    const s = dailySeries(orders, days, now)
    return days > 45 ? weekly(s) : s
  }, [orders, days, now])
  const spark = useMemo(() => dailySeries(orders, 14, now), [orders, now])

  const recent = orders.slice(0, 7)
  const toShip = orders.filter((o) => (o.status === 'yeni' || o.status === 'hazirlaniyor') && o.delivery === 'kargo')
  const left = cutoffRemaining(now, settings.sameDayCutoff)

  const periodOrders = useMemo(() => orders.filter((o) => o.ts >= now - days * 86400000), [orders, days, now])
  const cats = useMemo(
    () =>
      groupItems(periodOrders, (i) => i.top)
        .slice(0, 5)
        .map((g, i) => ({ label: TOPCATS[g.key]?.name ?? g.key, value: g.revenue, color: SERIES[i] }))
        .concat(
          (() => {
            const all = groupItems(periodOrders, (i) => i.top)
            const rest = all.slice(5).reduce((s, g) => s + g.revenue, 0)
            return rest > 0 ? [{ label: 'Diğer', value: rest, color: '#cfd1cb' }] : []
          })(),
        ),
    [periodOrders],
  )
  const topProducts = useMemo(() => groupItems(periodOrders, (i) => i.handle).slice(0, 6), [periodOrders])
  const cities = useMemo(() => groupOrders(periodOrders, (o) => o.customer.city).slice(0, 7).map((g) => ({ label: g.key, value: g.revenue })), [periodOrders])
  const low = useMemo(
    () =>
      products
        .flatMap((p) => p.variants.filter((v) => v.stock > 0 && v.stock <= settings.lowStockThreshold).map((v) => ({ p, v })))
        .sort((a, b) => b.p.popularity - a.p.popularity)
        .slice(0, 6),
    [products, settings.lowStockThreshold],
  )
  const traffic = TRAFFIC.days.slice(-days)
  const sessions = traffic.reduce((s, d) => s + d.sessions, 0)
  const conv = sessions ? (cmp.cur.count / sessions) * 100 : 0
  const abandoned7 = ABANDONED.filter((a) => !a.recovered)
  const abandonedValue = abandoned7.reduce((s, a) => s + a.total, 0)
  const byHandle = Object.fromEntries(products.map((p) => [p.handle, p]))
  const d = new Date(now)

  return (
    <div>
      <PageHeader
        title={`${greeting(d.getHours())} 👋`}
        sub={`${dayName(d.getDay())}, ${dateShort(d)} · ${BRAND.name} mağazasında son durum`}
        actions={
          <Segmented
            value={days}
            onChange={setDays}
            options={[
              [7, '7 gün'],
              [30, '30 gün'],
              [90, '90 gün'],
            ]}
          />
        }
      />

      {toShip.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-ember-50 px-5 py-4 ring-1 ring-ember-100 md:flex-row md:items-center md:justify-between">
          <p className="flex items-center gap-3 text-[14px] text-char-800">
            <Timer size={20} className="shrink-0 text-ember-700" />
            <span>
              <b>{toShip.length} sipariş</b> kargoya verilmeyi bekliyor.{' '}
              {left != null ? (
                <>
                  Aynı gün kargo kesimine <b className="tnum">{duration(left)}</b> kaldı.
                </>
              ) : (
                'Bugünkü kargo kesimi geçti; yarın sabah ilk iş.'
              )}
            </span>
          </p>
          <Link to="/yonetim/siparisler?durum=bekleyen" className="btn btn-dark btn-sm shrink-0">
            Hazırlamaya başla <ArrowRight size={15} />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-5">
        <div className="topo col-span-2 flex flex-col rounded-2xl bg-char-900 p-4 text-white md:p-5 xl:col-span-1">
          <p className="flex items-center gap-2 text-[13px] font-medium text-white/60">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-moss-100 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-moss-100" />
            </span>
            Bugün · canlı
          </p>
          <p className="tnum mt-1.5 text-[1.75rem] leading-tight font-bold">{tlShort(today.cur.revenue)}</p>
          <p className="mt-1 text-[13px] text-white/60">
            <b className="tnum text-white">{today.cur.count}</b> sipariş · dün bu saatte {today.prev.count}
          </p>
          <p className="mt-auto pt-3 text-[11.5px] text-white/40">Son sipariş {orders[0] ? `${hm(orders[0].ts)} · ${orders[0].customer.city}` : '—'}</p>
        </div>
        <Stat label="Ciro" icon={Wallet} value={tlShort(cmp.cur.revenue)} delta={cmp.delta.revenue} spark={spark.map((x) => x.revenue)} deltaSuffix={`önceki ${days} gün`} />
        <Stat label="Sipariş" icon={ShoppingBag} value={num(cmp.cur.count)} delta={cmp.delta.count} spark={spark.map((x) => x.orders)} deltaSuffix={`önceki ${days} gün`} />
        <Stat label="Ortalama sepet" icon={ShoppingCart} value={tlRound(cmp.cur.aov)} delta={cmp.delta.aov} deltaSuffix={`önceki ${days} gün`} />
        <Stat label="Dönüşüm oranı" icon={Percent} value={pct(conv, 2)} sub={`${num(sessions)} ziyaret`} />
      </div>

      <div className="mt-4 grid gap-4 md:mt-5 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title={metric === 'revenue' ? 'Ciro' : 'Sipariş sayısı'}
          sub={`Son ${days} gün${days > 45 ? ' · haftalık' : ' · günlük'} — gri çizgi önceki dönem`}
          action={
            <Segmented
              size="sm"
              value={metric}
              onChange={setMetric}
              options={[
                ['revenue', 'Ciro'],
                ['orders', 'Sipariş'],
              ]}
            />
          }
        >
          <RevenueChart data={series} metric={metric} />
        </Card>
        <Card title="Kategori dağılımı" sub={`Son ${days} gün cirosu`}>
          <Donut rows={cats} center={[tlShort(cmp.cur.revenue), 'toplam']} height={170} vertical />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:mt-5 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Son siparişler"
          pad={false}
          action={
            <Link to="/yonetim/siparisler" className="text-[13px] font-semibold text-char-600 hover:text-char-900">
              Tümü →
            </Link>
          }
        >
          <TableWrap>
            <table className="w-full min-w-[40rem] text-[13.5px]">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Sipariş</th>
                  <th className={th}>Müşteri</th>
                  <th className={th}>Ürün</th>
                  <th className={`${th} text-right`}>Tutar</th>
                  <th className={th}>Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((o) => (
                  <tr key={o.no} className="hover:bg-bone/70">
                    <td className={td}>
                      <Link to={`/yonetim/siparisler/${o.no}`} className="tnum font-semibold hover:underline">
                        {o.no}
                      </Link>
                      <p className="text-xs text-char-400">{ago(o.ts, now)}</p>
                    </td>
                    <td className={td}>
                      <p className="font-medium">{o.customer.name}</p>
                      <p className="text-xs text-char-400">{o.customer.city}</p>
                    </td>
                    <td className={td}>
                      <div className="flex -space-x-2">
                        {o.items.slice(0, 3).map((i) => (
                          <span key={i.variantId} className="relative h-8 w-8 overflow-hidden rounded-lg bg-white ring-2 ring-white">
                            <ProductImg path={i.image} widths={[80, 80]} sizes="32px" alt="" className="absolute inset-0 h-full w-full border border-line p-0.5" />
                          </span>
                        ))}
                        {o.items.length > 3 && <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mist text-[11px] font-semibold ring-2 ring-white">+{o.items.length - 3}</span>}
                      </div>
                    </td>
                    <td className={`${td} tnum text-right font-semibold`}>{tl(o.total)}</td>
                    <td className={td}>
                      <StatusPill status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>

        <Card
          title="Kritik stok"
          sub={`${settings.lowStockThreshold} adet ve altı`}
          action={
            <Link to="/yonetim/stok" className="text-[13px] font-semibold text-char-600 hover:text-char-900">
              Stok →
            </Link>
          }
        >
          {low.length === 0 ? (
            <p className="py-6 text-center text-sm text-char-500">Kritik seviyede ürün yok.</p>
          ) : (
            <ul className="divide-y divide-line">
              {low.map(({ p, v }) => (
                <li key={v.id} className="flex items-center gap-3 py-2.5">
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-line">
                    <ProductImg path={p.images[0]} widths={[80, 80]} sizes="40px" alt="" className="absolute inset-0 h-full w-full p-0.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/yonetim/urunler/${p.handle}`} className="line-clamp-1 text-[13px] font-medium hover:underline">
                      {p.title}
                    </Link>
                    <p className="text-xs text-char-400">{v.title || p.sku}</p>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-flame-50 px-2 py-0.5 text-xs font-bold text-flame">
                    <AlertTriangle size={12} />
                    {v.stock}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:mt-5 lg:grid-cols-2 xl:grid-cols-3">
        <Card title="Çok satanlar" sub={`Son ${days} gün`}>
          <ul className="space-y-3">
            {topProducts.map((g, i) => {
              const p = byHandle[g.key]
              return (
                <li key={g.key} className="flex items-center gap-3">
                  <span className="tnum w-4 text-sm font-bold text-char-300">{i + 1}</span>
                  <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ring-1 ring-line">
                    <ProductImg path={p?.images[0]} widths={[80, 80]} sizes="40px" alt="" className="absolute inset-0 h-full w-full p-0.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[13px] font-medium">{p?.title ?? g.key}</p>
                    <p className="text-xs text-char-400">{g.units} adet</p>
                  </div>
                  <span className="tnum text-[13px] font-semibold">{tlShort(g.revenue)}</span>
                </li>
              )
            })}
          </ul>
        </Card>
        <Card title="Şehirler" sub="Sipariş cirosu">
          <BarList rows={cities} />
        </Card>
        <Card title="Terk edilen sepetler" sub="Son 7 gün" className="lg:col-span-2 xl:col-span-1">
          <div className="flex items-baseline gap-3">
            <p className="tnum text-3xl font-bold">{tlShort(abandonedValue)}</p>
            <p className="text-sm text-char-500">{abandoned7.length} sepette bekliyor</p>
          </div>
          <p className="mt-1 text-[13px] text-char-500">
            Geçen hafta hatırlatılan sepetlerin <b className="text-moss-700">%{Math.round((ABANDONED.filter((a) => a.recovered).length / ABANDONED.filter((a) => a.reminded || a.recovered).length) * 100)}</b>’i siparişe döndü.
          </p>
          <ul className="mt-4 divide-y divide-line">
            {abandoned7.slice(0, 4).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                <div className="min-w-0">
                  <p className="font-medium">{a.customer.name}</p>
                  <p className="truncate text-xs text-char-400">
                    {a.items[0].title}
                    {a.items.length > 1 && ` +${a.items.length - 1}`}
                  </p>
                </div>
                <span className="tnum shrink-0 font-semibold">{tlShort(a.total)}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => toast(`${abandoned7.length} müşteriye WhatsApp hatırlatması kuyruğa alındı`)} className="btn btn-outline btn-sm mt-3 w-full">
            <MessageCircle size={15} /> Hepsine hatırlatma gönder
          </button>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:mt-5 md:grid-cols-3">
        {[
          [Eye, 'Ziyaret (bugün)', num(TRAFFIC.days[TRAFFIC.days.length - 1].sessions), 'Instagram %34 · Google %27'],
          [PackageCheck, 'Zamanında kargo', '%97,8', `Son ${days} günde kesimden önce çıkan siparişler`],
          [ShoppingBag, 'Tekrar eden müşteri', pct(28.4), 'İkinci siparişi veren müşteri oranı'],
        ].map(([Icon, l, v, s]) => (
          <div key={l} className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-line">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mist text-char-500">
              <Icon size={20} />
            </span>
            <div>
              <p className="text-[13px] text-char-500">{l}</p>
              <p className="tnum text-xl font-bold">{v}</p>
              <p className="text-xs text-char-400">{s}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
