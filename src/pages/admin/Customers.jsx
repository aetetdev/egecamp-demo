import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, Heart, MessageCircle, Repeat, Search, Send, Ticket, UserPlus, Users, Wallet, X } from 'lucide-react'
import { ACTIVE_CUSTOMERS } from '../../data/generate'
import { TOPCATS } from '../../data/catalog'
import { ago, dateShort, fold, num, pct, tl, tlShort } from '../../lib/format'
import { Card, PageHeader, Pager, Pill, Stat, StatusPill, TableWrap, td, th, useToast } from '../../components/admin/AdminUI'
import { Drawer, Modal } from '../../components/ui/Bits'

const DAY = 86400000
const PER = 25

const SEGMENTS = [
  ['tumu', 'Tümü', null, 'neutral'],
  ['vip', 'VIP', Crown, 'ember'],
  ['sadik', 'Sadık', Heart, 'moss'],
  ['yeni', 'Yeni', UserPlus, 'sky'],
  ['riskli', 'Riskli', Repeat, 'ember'],
  ['kayip', 'Kayıp', X, 'flame'],
]

export default function Customers() {
  const toast = useToast()
  const [seg, setSeg] = useState('tumu')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(null)
  const [broadcast, setBroadcast] = useState(false)
  const [now] = useState(() => Date.now())

  const { list, vipCut } = useMemo(() => {
    const sorted = [...ACTIVE_CUSTOMERS].sort((a, b) => b.spent - a.spent)
    const vipCut = sorted[Math.floor(sorted.length * 0.05)]?.spent ?? Infinity
    const list = sorted.map((c) => {
      const since = now - c.last
      let segment = 'diger'
      if (c.spent >= vipCut) segment = 'vip'
      else if (c.orderCount >= 3 && since < 120 * DAY) segment = 'sadik'
      else if (now - c.first < 30 * DAY) segment = 'yeni'
      else if (since > 240 * DAY) segment = 'kayip'
      else if (since > 120 * DAY) segment = 'riskli'
      return { ...c, segment }
    })
    return { list, vipCut }
  }, [now])

  const counts = useMemo(() => {
    const c = { tumu: list.length }
    list.forEach((x) => (c[x.segment] = (c[x.segment] ?? 0) + 1))
    return c
  }, [list])

  const filtered = useMemo(() => {
    const f = fold(q.trim())
    return list.filter((c) => (seg === 'tumu' || c.segment === seg) && (!f || fold(c.name).includes(f) || fold(c.city).includes(f) || c.phone.includes(q.trim())))
  }, [list, seg, q])

  const repeat = list.filter((c) => c.orderCount > 1).length / list.length
  const ltv = list.reduce((s, c) => s + c.spent, 0) / list.length
  const new30 = list.filter((c) => now - c.first < 30 * DAY).length
  const rows = filtered.slice((page - 1) * PER, page * PER)
  const segPill = (s) => {
    const def = SEGMENTS.find((x) => x[0] === s)
    return def ? <Pill tone={def[3]}>{def[1]}</Pill> : <Pill>Standart</Pill>
  }

  return (
    <div>
      <PageHeader
        title="Müşteriler"
        sub="Sipariş geçmişinden otomatik oluşan müşteri kartları ve segmentler"
        actions={
          <button onClick={() => setBroadcast(true)} className="btn btn-dark btn-sm">
            <Send size={15} /> Segmente mesaj gönder
          </button>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Stat label="Müşteri" icon={Users} value={num(list.length)} sub="En az bir siparişi olan" />
        <Stat label="Tekrar eden" icon={Repeat} value={pct(repeat * 100)} sub="İki ve üzeri sipariş veren" />
        <Stat label="Ortalama yaşam boyu değer" icon={Wallet} value={tlShort(ltv)} sub={`VIP eşiği ${tlShort(vipCut)}`} />
        <Stat label="Yeni müşteri (30 gün)" icon={UserPlus} value={num(new30)} sub="İlk siparişini veren" />
      </div>

      <Card className="mt-5" pad={false}>
        <div className="flex flex-col gap-3 border-b border-line p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {SEGMENTS.map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => {
                  setSeg(id)
                  setPage(1)
                }}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ${seg === id ? 'bg-char-900 text-white' : 'bg-mist text-char-600 hover:bg-stone'}`}
              >
                {Icon && <Icon size={13} />}
                {label}
                <span className={`tnum text-[11px] ${seg === id ? 'text-white/60' : 'text-char-400'}`}>{num(counts[id] ?? 0)}</span>
              </button>
            ))}
          </div>
          <div className="relative lg:w-72">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-char-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPage(1)
              }}
              placeholder="Ad, şehir veya telefon"
              className="field field-sm pl-9"
            />
          </div>
        </div>
        <TableWrap>
          <table className="w-full min-w-[52rem] text-[13.5px]">
            <thead>
              <tr className="border-b border-line">
                <th className={th}>Müşteri</th>
                <th className={th}>Segment</th>
                <th className={`${th} text-right`}>Sipariş</th>
                <th className={`${th} text-right`}>Toplam harcama</th>
                <th className={th}>Son sipariş</th>
                <th className={th}>İlgi alanı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => (
                <tr key={c.id} onClick={() => setOpen(c)} className="cursor-pointer hover:bg-bone/70">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mist text-[12px] font-bold text-char-600">
                        {c.first[0]}
                        {c.last[0]}
                      </span>
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-char-400">
                          {c.district} / {c.city}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={td}>{segPill(c.segment)}</td>
                  <td className={`${td} tnum text-right`}>{c.orderCount}</td>
                  <td className={`${td} tnum text-right font-semibold`}>{tl(c.spent)}</td>
                  <td className={`${td} whitespace-nowrap text-char-500`}>{ago(c.last, now)}</td>
                  <td className={`${td} text-char-600`}>{TOPCATS[c.topCat]?.name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <Pager page={page} pages={Math.ceil(filtered.length / PER)} onChange={setPage} total={filtered.length} per={PER} />
      </Card>

      <Drawer open={!!open} onClose={() => setOpen(null)} label="Müşteri">
        {open && (
          <>
            <div className="flex items-start justify-between border-b border-line p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ember text-sm font-bold text-char-950">
                  {open.first[0]}
                  {open.last[0]}
                </span>
                <div>
                  <p className="text-lg font-semibold">{open.name}</p>
                  <p className="text-[13px] text-char-500">
                    {open.district} / {open.city} · {open.id}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(null)} className="rounded-lg p-1.5 text-char-400 hover:bg-mist" aria-label="Kapat">
                <X size={19} />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ['Sipariş', open.orderCount],
                  ['Harcama', tlShort(open.spent)],
                  ['Ort. sepet', tlShort(open.spent / Math.max(1, open.orderCount))],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-xl bg-bone px-2 py-3">
                    <p className="text-[11.5px] text-char-400">{l}</p>
                    <p className="tnum text-[15px] font-bold">{v}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-[13.5px] text-char-600">
                <p>{open.phone}</p>
                <p>{open.email}</p>
                <p className="text-xs text-char-400">
                  İlk sipariş {dateShort(open.first)} · {open.optIn ? 'Kampanya iletisine izinli' : 'İleti izni yok'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => toast(`${open.first} için %10 kupon (VIP10) gönderildi`)} className="btn btn-outline btn-sm">
                  <Ticket size={15} /> Kupon gönder
                </button>
                <button onClick={() => toast('WhatsApp mesajı gönderildi (demo)')} className="btn btn-outline btn-sm">
                  <MessageCircle size={15} /> WhatsApp
                </button>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold tracking-[0.14em] text-char-400 uppercase">Siparişleri</p>
                <ul className="divide-y divide-line rounded-xl ring-1 ring-line">
                  {[...open.orders].reverse().map((o) => (
                    <li key={o.no}>
                      <Link to={`/yonetim/siparisler/${o.no}`} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[13px] hover:bg-bone">
                        <div>
                          <p className="tnum font-semibold">{o.no}</p>
                          <p className="text-xs text-char-400">
                            {dateShort(o.ts)} · {o.items.length} ürün
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="tnum font-semibold">{tl(o.total)}</p>
                          <StatusPill status={o.status} className="mt-0.5" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </Drawer>

      <Modal
        open={broadcast}
        onClose={() => setBroadcast(false)}
        title="Segmente toplu mesaj"
        footer={
          <>
            <button onClick={() => setBroadcast(false)} className="btn btn-outline btn-sm">
              Vazgeç
            </button>
            <button
              onClick={() => {
                setBroadcast(false)
                toast(`${num(counts[seg === 'tumu' ? 'tumu' : seg] ?? 0)} müşteriye mesaj kuyruğa alındı (yalnızca ileti izni olanlar)`)
              }}
              className="btn btn-dark btn-sm"
            >
              <Send size={15} /> Gönder
            </button>
          </>
        }
      >
        <p className="text-[13.5px] text-char-600">
          Seçili segment: <b>{SEGMENTS.find((s) => s[0] === seg)[1]}</b> · {num(counts[seg] ?? 0)} müşteri
        </p>
        <textarea
          rows={4}
          className="field mt-3"
          defaultValue={seg === 'kayip' || seg === 'riskli' ? 'Sizi özledik! Kış kampı sezonu açıldı; bu hafta sonuna kadar GERIDON koduyla %12 indirim sizin. — Ege Camp Outdoor' : 'Yeni sezon soba ve ısıtıcılar stokta! Bu hafta KIS15 koduyla 2.000 TL üzeri siparişlerde %15 indirim. — Ege Camp Outdoor'}
        />
        <p className="mt-2 text-xs text-char-400">KVKK gereği yalnızca ticari ileti izni veren müşterilere gönderilir; İYS kaydı otomatik kontrol edilir.</p>
      </Modal>
    </div>
  )
}
