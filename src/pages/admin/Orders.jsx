import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Download, FileText, MessageCircle, PackageCheck, Printer, Search, ShoppingCart, Store, Truck, X } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { ABANDONED } from '../../data/generate'
import { CHANNEL_LABEL, PAYMENT_LABEL, STATUS } from '../../lib/status'
import { ago, dateTime, dateShort, fold, num, tl } from '../../lib/format'
import { Card, PageHeader, Pager, Pill, StatusPill, TableWrap, Tabs, td, th, useToast } from '../../components/admin/AdminUI'
import { Modal, ProductImg } from '../../components/ui/Bits'
import CargoLabel, { trackingFor } from '../../components/admin/CargoLabel'

const PER = 25
const DAY = 86400000

export function downloadCsv(name, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export function LabelsModal({ orders, open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={`Kargo etiketleri (${orders.length})`} wide footer={
      <>
        <button onClick={onClose} className="btn btn-outline btn-sm">Kapat</button>
        <button onClick={() => window.print()} className="btn btn-dark btn-sm">
          <Printer size={15} /> Yazdır
        </button>
      </>
    }>
      <p className="no-print mb-4 text-[13px] text-char-500">Canlı sistemde etiketler kargo firmasının API’sinden gerçek takip numarasıyla gelir; müşteriye SMS otomatik gider.</p>
      <div className="print-area grid gap-3 sm:grid-cols-2">
        {orders.map((o) => (
          <div key={o.no} className="h-64 break-inside-avoid">
            <CargoLabel order={o} />
          </div>
        ))}
      </div>
    </Modal>
  )
}

function Abandoned() {
  const toast = useToast()
  return (
    <Card pad={false}>
      <div className="flex flex-col gap-2 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-[13.5px] text-char-600">
          Ödeme adımına gelip siparişi tamamlamayan ziyaretçiler. Hatırlatma, sepette kalan tutarın ortalama <b>%18</b>’ini geri getirir.
        </p>
        <button onClick={() => toast('Hatırlatma kuyruğa alındı — WhatsApp şablonu: “Sepetinizde ürün kaldı, %5 kupon: SEPET5”')} className="btn btn-dark btn-sm shrink-0">
          <MessageCircle size={15} /> Tümüne hatırlat
        </button>
      </div>
      <TableWrap>
        <table className="w-full min-w-[46rem] text-[13.5px]">
          <thead>
            <tr className="border-b border-line">
              <th className={th}>Müşteri</th>
              <th className={th}>Sepet</th>
              <th className={th}>Aşama</th>
              <th className={th}>Zaman</th>
              <th className={`${th} text-right`}>Tutar</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ABANDONED.map((a) => (
              <tr key={a.id} className="hover:bg-bone/60">
                <td className={td}>
                  <p className="font-medium">{a.customer.name}</p>
                  <p className="text-xs text-char-400">{a.customer.city}</p>
                </td>
                <td className={td}>
                  <p className="line-clamp-1 max-w-72">{a.items.map((i) => i.title).join(', ')}</p>
                  <p className="text-xs text-char-400">{a.items.length} ürün</p>
                </td>
                <td className={td}>
                  <Pill tone={a.stage === 'Sepette' ? 'neutral' : 'ember'}>{a.stage}</Pill>
                </td>
                <td className={`${td} whitespace-nowrap text-char-500`}>{ago(a.ts)}</td>
                <td className={`${td} tnum text-right font-semibold`}>{tl(a.total)}</td>
                <td className={`${td} text-right`}>
                  {a.recovered ? (
                    <Pill tone="moss">Siparişe döndü</Pill>
                  ) : a.reminded ? (
                    <Pill tone="sky">Hatırlatıldı</Pill>
                  ) : (
                    <button onClick={() => toast(`${a.customer.name} için hatırlatma gönderildi`)} className="btn btn-outline btn-sm">
                      Hatırlat
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </Card>
  )
}

export default function Orders() {
  const { orders, patchOrder } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('durum') ?? 'tumu'
  const [q, setQ] = useState('')
  const [range, setRange] = useState('90')
  const [payment, setPayment] = useState('')
  const [channel, setChannel] = useState('')
  const [page, setPage] = useState(1)
  const [sel, setSel] = useState(new Set())
  const [labels, setLabels] = useState(null)

  useEffect(() => {
    setPage(1)
    setSel(new Set())
  }, [tab, q, range, payment, channel])

  const counts = useMemo(() => {
    const c = { yeni: 0, hazirlaniyor: 0, kargoda: 0 }
    orders.forEach((o) => {
      if (c[o.status] != null) c[o.status]++
    })
    return c
  }, [orders])

  const filtered = useMemo(() => {
    const f = fold(q.trim())
    const from = range === 'hepsi' ? 0 : Date.now() - Number(range) * DAY
    return orders.filter((o) => {
      if (tab === 'bekleyen' && !(o.status === 'yeni' || o.status === 'hazirlaniyor')) return false
      if (['yeni', 'hazirlaniyor', 'kargoda', 'teslim'].includes(tab) && o.status !== tab) return false
      if (tab === 'iade' && !(o.status === 'iade' || o.status === 'iptal')) return false
      if (o.ts < from) return false
      if (payment && o.payment !== payment) return false
      if (channel && o.channel !== channel) return false
      if (f && !(fold(o.no).includes(f) || fold(o.customer.name).includes(f) || o.customer.phone.replace(/\D/g, '').includes(f.replace(/\D/g, '') || '§') || fold(o.customer.city).includes(f))) return false
      return true
    })
  }, [orders, tab, q, range, payment, channel])

  const pages = Math.ceil(filtered.length / PER)
  const rows = filtered.slice((page - 1) * PER, page * PER)
  const selected = filtered.filter((o) => sel.has(o.no))
  const allOnPage = rows.length > 0 && rows.every((o) => sel.has(o.no))
  const toggle = (no) =>
    setSel((s) => {
      const n = new Set(s)
      n.has(no) ? n.delete(no) : n.add(no)
      return n
    })
  const setTab = (t) => setSp(t === 'tumu' ? {} : { durum: t }, { replace: true })

  const bulk = (status, note) => {
    selected.forEach((o) => {
      const patch = { status }
      if (status === 'kargoda') patch.tracking = trackingFor(o)
      if (status !== 'yeni' && !o.invoice) patch.invoice = `EGC2026${String(o.seq).padStart(9, '0')}`
      patchOrder(o.no, patch, note)
    })
    toast(`${selected.length} sipariş güncellendi`)
    setSel(new Set())
  }

  const exportCsv = () => {
    const list = selected.length ? selected : filtered
    downloadCsv(`siparisler-${dateShort(Date.now()).replace(/\s/g, '-')}.csv`, [
      ['Sipariş no', 'Tarih', 'Müşteri', 'Şehir', 'Telefon', 'Ürün adedi', 'Tutar', 'Ödeme', 'Taksit', 'Durum', 'Kargo', 'Takip no'],
      ...list.map((o) => [o.no, dateTime(o.ts), o.customer.name, o.customer.city, o.customer.phone, o.items.reduce((s, i) => s + i.qty, 0), o.total.toFixed(2).replace('.', ','), PAYMENT_LABEL[o.payment], o.installments, STATUS[o.status].label, o.cargo ?? 'Mağazadan', o.tracking ?? '']),
    ])
    toast(`${list.length} sipariş Excel (CSV) olarak indirildi`)
  }

  return (
    <div>
      <PageHeader
        title="Siparişler"
        sub={`${num(orders.length)} sipariş · web, mobil, Instagram ve WhatsApp tek listede`}
        actions={
          <button onClick={exportCsv} className="btn btn-outline btn-sm">
            <Download size={15} /> Excel’e aktar
          </button>
        }
      />

      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        tabs={[
          ['tumu', 'Tümü'],
          ['bekleyen', 'Kargo bekleyen', counts.yeni + counts.hazirlaniyor],
          ['yeni', 'Yeni', counts.yeni],
          ['hazirlaniyor', 'Hazırlanıyor', counts.hazirlaniyor],
          ['kargoda', 'Kargoda', counts.kargoda],
          ['teslim', 'Teslim edildi'],
          ['iade', 'İade / iptal'],
          ['sepetler', 'Terk edilen sepetler', ABANDONED.filter((a) => !a.recovered).length],
        ]}
      />

      {tab === 'sepetler' ? (
        <Abandoned />
      ) : (
        <Card pad={false}>
          <div className="flex flex-col gap-2 border-b border-line p-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-char-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sipariş no, müşteri, telefon veya şehir" className="field field-sm pl-9" />
            </div>
            <div className="grid grid-cols-3 gap-2 md:flex">
              <select value={range} onChange={(e) => setRange(e.target.value)} className="field field-sm md:w-36">
                <option value="1">Son 24 saat</option>
                <option value="7">Son 7 gün</option>
                <option value="30">Son 30 gün</option>
                <option value="90">Son 90 gün</option>
                <option value="hepsi">Tümü</option>
              </select>
              <select value={payment} onChange={(e) => setPayment(e.target.value)} className="field field-sm md:w-36">
                <option value="">Tüm ödemeler</option>
                {Object.entries(PAYMENT_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <select value={channel} onChange={(e) => setChannel(e.target.value)} className="field field-sm md:w-36">
                <option value="">Tüm kanallar</option>
                {Object.entries(CHANNEL_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-b border-line bg-char-900 px-4 py-2.5 text-white">
              <span className="mr-2 text-[13px] font-semibold">{selected.length} seçili</span>
              <button onClick={() => bulk('hazirlaniyor', 'Hazırlığa alındı')} className="btn btn-sm bg-white/10 text-white hover:bg-white/20">
                <PackageCheck size={15} /> Hazırlığa al
              </button>
              <button
                onClick={() => {
                  setLabels(selected)
                  bulk('kargoda', 'Kargoya verildi, takip no SMS ile gönderildi')
                }}
                className="btn btn-sm bg-ember text-char-950 hover:bg-ember-400"
              >
                <Truck size={15} /> Kargoya ver + etiket
              </button>
              <button onClick={() => toast(`${selected.length} sipariş için e-Arşiv fatura kesildi ve müşterilere e-postalandı`)} className="btn btn-sm bg-white/10 text-white hover:bg-white/20">
                <FileText size={15} /> Fatura kes
              </button>
              <button onClick={() => setSel(new Set())} className="ml-auto rounded-lg p-1.5 text-white/60 hover:text-white" aria-label="Seçimi temizle">
                <X size={17} />
              </button>
            </div>
          )}

          <TableWrap>
            <table className="w-full min-w-[60rem] text-[13.5px]">
              <thead>
                <tr className="border-b border-line">
                  <th className={`${th} w-10`}>
                    <input
                      type="checkbox"
                      checked={allOnPage}
                      onChange={() =>
                        setSel((s) => {
                          const n = new Set(s)
                          rows.forEach((o) => (allOnPage ? n.delete(o.no) : n.add(o.no)))
                          return n
                        })
                      }
                      className="h-4 w-4 accent-[var(--color-char-900)]"
                      aria-label="Sayfadakileri seç"
                    />
                  </th>
                  <th className={th}>Sipariş</th>
                  <th className={th}>Müşteri</th>
                  <th className={th}>Ürünler</th>
                  <th className={th}>Ödeme</th>
                  <th className={th}>Teslimat</th>
                  <th className={`${th} text-right`}>Tutar</th>
                  <th className={th}>Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((o) => (
                  <tr key={o.no} onClick={() => navigate(`/yonetim/siparisler/${o.no}`)} className={`cursor-pointer ${sel.has(o.no) ? 'bg-ember-50/60' : 'hover:bg-bone/70'}`}>
                    <td className={td} onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={sel.has(o.no)} onChange={() => toggle(o.no)} className="h-4 w-4 accent-[var(--color-char-900)]" aria-label={`${o.no} seç`} />
                    </td>
                    <td className={td}>
                      <p className="tnum flex items-center gap-1.5 font-semibold whitespace-nowrap">
                        {o.no}
                        {o.placedHere && <Pill tone="ember" className="!px-1.5 !text-[10px]">Demo</Pill>}
                      </p>
                      <p className="text-xs whitespace-nowrap text-char-400">{dateTime(o.ts)}</p>
                    </td>
                    <td className={td}>
                      <p className="font-medium whitespace-nowrap">{o.customer.name}</p>
                      <p className="text-xs whitespace-nowrap text-char-400">
                        {o.customer.city} · {CHANNEL_LABEL[o.channel]}
                      </p>
                    </td>
                    <td className={td}>
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {o.items.slice(0, 3).map((i) => (
                            <span key={i.variantId} className="relative h-8 w-8 overflow-hidden rounded-lg bg-white ring-2 ring-white">
                              <ProductImg path={i.image} widths={[80, 80]} sizes="32px" alt="" className="absolute inset-0 h-full w-full border border-line p-0.5" />
                            </span>
                          ))}
                        </div>
                        <span className="text-xs whitespace-nowrap text-char-500">{o.items.reduce((s, i) => s + i.qty, 0)} adet</span>
                      </div>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      <p>{PAYMENT_LABEL[o.payment]}</p>
                      <p className="text-xs text-char-400">{o.payment === 'kart' ? (o.installments > 1 ? `${o.installments} taksit` : 'Tek çekim') : o.payment === 'havale' ? '%2 indirimli' : 'Nakit / kart'}</p>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      {o.delivery === 'magaza' ? (
                        <span className="flex items-center gap-1.5 text-char-600">
                          <Store size={14} /> Mağazadan
                        </span>
                      ) : (
                        <>
                          <p>{o.cargo}</p>
                          <p className="tnum text-xs text-char-400">{o.tracking ?? '—'}</p>
                        </>
                      )}
                    </td>
                    <td className={`${td} tnum text-right font-semibold whitespace-nowrap`}>{tl(o.total)}</td>
                    <td className={td}>
                      <StatusPill status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          {rows.length === 0 && (
            <div className="flex flex-col items-center py-14 text-center">
              <ShoppingCart size={28} className="text-char-300" />
              <p className="mt-2 font-semibold">Bu filtrelerle sipariş yok</p>
            </div>
          )}
          <Pager page={page} pages={pages} onChange={setPage} total={filtered.length} per={PER} />
        </Card>
      )}

      <LabelsModal orders={labels ?? []} open={!!labels} onClose={() => setLabels(null)} />
      <p className="mt-3 text-center text-xs text-char-400">
        İpucu: vitrinden verdiğiniz sipariş <Link to="/" className="underline">mağazada</Link> tamamlandığı an listenin en üstüne “Demo” etiketiyle düşer.
      </p>
    </div>
  )
}
