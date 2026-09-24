import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Bell, ClipboardList, Download, Minus, PackageX, Plus, Snail, Wallet } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { PRODUCT_STATS, waitlistFor } from '../../data/generate'
import { rng } from '../../lib/rand'
import { ago, dateTime, num, tl, tlShort } from '../../lib/format'
import { Card, PageHeader, Pill, Stat, TableWrap, Tabs, td, th, useToast } from '../../components/admin/AdminUI'
import { Modal, ProductImg } from '../../components/ui/Bits'
import { downloadCsv } from './Orders'

const DAY = 86400000

function Thumb({ p }) {
  return (
    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-line">
      <ProductImg path={p.images[0]} widths={[80, 80]} sizes="40px" alt="" className="absolute inset-0 h-full w-full p-0.5" />
    </span>
  )
}

export default function Inventory() {
  const { products, orders, setStock, settings, logActivity } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState('kritik')
  const [po, setPo] = useState(false)

  const [now] = useState(() => Date.now())
  const data = useMemo(() => {
    let value = 0
    let units = 0
    const critical = []
    const out = []
    const dead = []
    for (const p of products) {
      const s = PRODUCT_STATS[p.handle]
      const velocity = (s?.units90 ?? 0) / 90
      for (const v of p.variants) {
        value += v.stock * v.price * p.costRatio
        units += v.stock
        if (v.stock > 0 && v.stock <= Math.max(settings.lowStockThreshold, Math.ceil(velocity * 7))) {
          const perVariant = velocity / p.variants.length
          critical.push({ p, v, velocity: perVariant, days: perVariant > 0 ? v.stock / perVariant : null, suggest: Math.max(6, Math.ceil(perVariant * 45) - v.stock) })
        }
      }
      if (!p.available) out.push({ p, waiting: waitlistFor(p), last: s?.last ?? null })
      else if (!s || now - s.last > 90 * DAY) dead.push({ p, value: p.variants.reduce((a, v) => a + v.stock * v.price * p.costRatio, 0), last: s?.last ?? null })
    }
    critical.sort((a, b) => (a.days ?? 999) - (b.days ?? 999))
    out.sort((a, b) => b.waiting - a.waiting)
    dead.sort((a, b) => b.value - a.value)
    return { value, units, critical, out, dead }
  }, [products, settings.lowStockThreshold, now])

  const moves = useMemo(() => {
    const list = []
    orders
      .filter((o) => o.status !== 'iptal')
      .slice(0, 14)
      .forEach((o) => o.items.forEach((i) => list.push({ ts: o.ts, kind: 'satis', title: i.title, qty: -i.qty, ref: o.no })))
    const r = rng('moves-v1')
    const brands = ['Husky', 'Stanley', 'Orcamp', 'Evolite', 'FreeCamp', 'Madfox', 'TecnoPoint']
    for (let k = 0; k < 6; k++) {
      const b = r.pick(brands)
      const p = products.find((x) => x.brand === b && x.available)
      if (p) list.push({ ts: now - r.float(0.3, 6) * DAY, kind: 'kabul', title: p.title, qty: r.pick([12, 24, 36, 48]), ref: `${b} irsaliye #${r.int(2000, 9000)}` })
    }
    for (let k = 0; k < 3; k++) {
      const p = r.pick(products.filter((x) => x.available))
      list.push({ ts: now - r.float(0.5, 8) * DAY, kind: r.chance(0.5) ? 'iade' : 'sayim', title: p.title, qty: r.chance(0.5) ? 1 : -1, ref: r.chance(0.5) ? 'Müşteri iadesi' : 'Sayım düzeltmesi' })
    }
    return list.sort((a, b) => b.ts - a.ts).slice(0, 40)
  }, [orders, products, now])

  const poGroups = useMemo(() => {
    const g = {}
    data.critical.forEach((c) => (g[c.p.brand] ??= []).push(c))
    return Object.entries(g).sort((a, b) => b[1].length - a[1].length)
  }, [data.critical])

  return (
    <div>
      <PageHeader
        title="Stok"
        sub="Varyant bazında stok, satış hızına göre tükenme tahmini ve bekleyen müşteriler"
        actions={
          <button onClick={() => setPo(true)} className="btn btn-dark btn-sm">
            <ClipboardList size={15} /> Tedarik listesi oluştur
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Stat label="Stok değeri (maliyet)" icon={Wallet} value={tlShort(data.value)} sub={`${num(data.units)} adet ürün rafta`} />
        <Stat label="Kritik stok" icon={AlertTriangle} value={num(data.critical.length)} sub="Bir haftadan az yetecek varyant" />
        <Stat label="Tükenen ürün" icon={PackageX} value={num(data.out.length)} sub={`${num(data.out.reduce((s, x) => s + x.waiting, 0))} müşteri haber bekliyor`} />
        <Stat label="Ölü stok" icon={Snail} value={tlShort(data.dead.reduce((s, x) => s + x.value, 0))} sub={`${data.dead.length} ürün 90 gündür satılmadı`} />
      </div>

      <Tabs
        className="mt-6 mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          ['kritik', 'Kritik stok', data.critical.length],
          ['tukenen', 'Tükenenler', data.out.length],
          ['olu', 'Ölü stok', data.dead.length],
          ['hareket', 'Stok hareketleri'],
        ]}
      />

      {tab === 'kritik' && (
        <Card pad={false}>
          <TableWrap>
            <table className="w-full min-w-[54rem] text-[13.5px]">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Ürün</th>
                  <th className={th}>Satış hızı</th>
                  <th className={th}>Kaç gün yeter</th>
                  <th className={th}>Önerilen sipariş</th>
                  <th className={th}>Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.critical.slice(0, 60).map(({ p, v, velocity, days, suggest }) => (
                  <tr key={v.id} className="hover:bg-bone/60">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Thumb p={p} />
                        <div className="min-w-0">
                          <Link to={`/yonetim/urunler/${p.handle}`} className="line-clamp-1 max-w-sm font-medium hover:underline">
                            {p.title}
                          </Link>
                          <p className="text-xs text-char-400">
                            {p.brand}
                            {v.title && ` · ${v.title}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`${td} tnum whitespace-nowrap text-char-600`}>{velocity > 0 ? `${(velocity * 7).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} / hafta` : '—'}</td>
                    <td className={td}>
                      {days == null ? (
                        <span className="text-char-400">Satış yok</span>
                      ) : (
                        <Pill tone={days < 3 ? 'flame' : days < 7 ? 'ember' : 'neutral'}>{days < 1 ? 'Bugün biter' : `${Math.round(days)} gün`}</Pill>
                      )}
                    </td>
                    <td className={`${td} tnum text-char-600`}>+{suggest} adet</td>
                    <td className={td}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setStock(v.id, v.stock - 1)} className="rounded-md p-1.5 text-char-400 ring-1 ring-line hover:text-char-900" aria-label="Azalt">
                          <Minus size={13} />
                        </button>
                        <span className="tnum w-9 text-center font-bold text-flame">{v.stock}</span>
                        <button onClick={() => setStock(v.id, v.stock + 1)} className="rounded-md p-1.5 text-char-400 ring-1 ring-line hover:text-char-900" aria-label="Artır">
                          <Plus size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setStock(v.id, v.stock + suggest)
                            logActivity(`Mal kabul: ${p.title} +${suggest}`, 'stock')
                            toast(`Mal kabul: +${suggest} adet`)
                          }}
                          className="btn btn-outline btn-sm ml-2"
                        >
                          Mal kabul
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      )}

      {tab === 'tukenen' && (
        <Card pad={false}>
          <TableWrap>
            <table className="w-full min-w-[46rem] text-[13.5px]">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Ürün</th>
                  <th className={th}>Bekleyen müşteri</th>
                  <th className={th}>Son satış</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.out.slice(0, 60).map(({ p, waiting, last }) => (
                  <tr key={p.handle} className="hover:bg-bone/60">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Thumb p={p} />
                        <div className="min-w-0">
                          <Link to={`/yonetim/urunler/${p.handle}`} className="line-clamp-1 max-w-md font-medium hover:underline">
                            {p.title}
                          </Link>
                          <p className="text-xs text-char-400">{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className={td}>{waiting > 0 ? <Pill tone={waiting > 10 ? 'ember' : 'neutral'}><Bell size={12} /> {waiting} kişi</Pill> : <span className="text-char-400">—</span>}</td>
                    <td className={`${td} whitespace-nowrap text-char-500`}>{last ? ago(last) : 'Hiç satılmadı'}</td>
                    <td className={`${td} text-right`}>
                      <button
                        onClick={() => {
                          p.variants.forEach((v) => setStock(v.id, 10))
                          logActivity(`Stoğa girdi: ${p.title}`, 'stock')
                          toast(waiting ? `Stoğa girdi — ${waiting} müşteriye “ürün geldi” SMS’i gönderildi` : 'Stoğa girdi, vitrinde satışta')
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        Stoğa gir (+10)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      )}

      {tab === 'olu' && (
        <Card pad={false}>
          <p className="border-b border-line px-5 py-3 text-[13.5px] text-char-600">Bu ürünlere bağlanan sermaye kampanyayla nakde çevrilebilir. Seçip “Kampanyaya ekle” deyin, indirim vitrine anında yansır.</p>
          <TableWrap>
            <table className="w-full min-w-[46rem] text-[13.5px]">
              <thead>
                <tr className="border-b border-line">
                  <th className={th}>Ürün</th>
                  <th className={th}>Stok</th>
                  <th className={`${th} text-right`}>Bağlı sermaye</th>
                  <th className={th}>Son satış</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.dead.slice(0, 50).map(({ p, value, last }) => (
                  <tr key={p.handle} className="hover:bg-bone/60">
                    <td className={td}>
                      <div className="flex items-center gap-3">
                        <Thumb p={p} />
                        <Link to={`/yonetim/urunler/${p.handle}`} className="line-clamp-1 max-w-md font-medium hover:underline">
                          {p.title}
                        </Link>
                      </div>
                    </td>
                    <td className={`${td} tnum`}>{p.stock}</td>
                    <td className={`${td} tnum text-right font-semibold`}>{tl(value)}</td>
                    <td className={`${td} whitespace-nowrap text-char-500`}>{last ? ago(last) : 'Hiç satılmadı'}</td>
                    <td className={`${td} text-right`}>
                      <Link to="/yonetim/kampanyalar" className="btn btn-outline btn-sm">
                        Kampanyaya ekle
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>
      )}

      {tab === 'hareket' && (
        <Card pad={false}>
          <ul className="divide-y divide-line">
            {moves.map((m, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-3 text-[13.5px]">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.qty > 0 ? 'bg-moss-50 text-moss-600' : 'bg-mist text-char-500'}`}>
                  {m.qty > 0 ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-medium">{m.title}</p>
                  <p className="text-xs text-char-400">
                    {{ satis: 'Satış', kabul: 'Mal kabul', iade: 'İade', sayim: 'Sayım' }[m.kind]} · {m.ref} · {dateTime(m.ts)}
                  </p>
                </div>
                <span className={`tnum font-bold ${m.qty > 0 ? 'text-moss-600' : 'text-char-700'}`}>
                  {m.qty > 0 ? '+' : ''}
                  {m.qty}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={po}
        onClose={() => setPo(false)}
        title="Tedarik listesi (marka bazında)"
        wide
        footer={
          <>
            <button
              onClick={() => {
                downloadCsv('tedarik-listesi.csv', [['Marka', 'Ürün', 'Varyant', 'Mevcut', 'Sipariş'], ...data.critical.map((c) => [c.p.brand, c.p.title, c.v.title, c.v.stock, c.suggest])])
                toast('Tedarik listesi indirildi')
              }}
              className="btn btn-outline btn-sm"
            >
              <Download size={15} /> Excel
            </button>
            <button onClick={() => { setPo(false); toast(`${poGroups.length} tedarikçiye sipariş e-postası hazırlandı (demo)`) }} className="btn btn-dark btn-sm">
              Tedarikçilere gönder
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {poGroups.map(([brand, items]) => (
            <div key={brand} className="rounded-xl ring-1 ring-line">
              <p className="flex items-center justify-between border-b border-line bg-bone px-4 py-2 text-[13px] font-semibold">
                {brand} <span className="text-char-400">{items.length} kalem</span>
              </p>
              <ul className="divide-y divide-line">
                {items.map((c) => (
                  <li key={c.v.id} className="flex items-center justify-between gap-3 px-4 py-2 text-[13px]">
                    <span className="min-w-0 truncate">
                      {c.p.title}
                      {c.v.title && <span className="text-char-400"> · {c.v.title}</span>}
                    </span>
                    <span className="tnum shrink-0 font-semibold">{c.suggest} adet</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
