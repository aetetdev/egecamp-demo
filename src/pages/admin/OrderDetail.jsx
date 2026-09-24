import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Printer,
  Send,
  ShieldCheck,
  Store,
  Truck,
  User,
  XCircle,
} from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { CUSTOMERS } from '../../data/generate'
import { CARGO_COMPANIES } from '../../config/brand'
import { CHANNEL_LABEL, NEXT_STATUS, PAYMENT_LABEL, STATUS } from '../../lib/status'
import { dateTime, tl } from '../../lib/format'
import { Card, Pill, StatusPill, useToast } from '../../components/admin/AdminUI'
import { Modal, ProductImg } from '../../components/ui/Bits'
import { LabelsModal } from './Orders'
import { trackingFor } from '../../components/admin/CargoLabel'
import { BRAND } from '../../config/brand'

const FLOW = ['yeni', 'hazirlaniyor', 'kargoda', 'teslim']

function templates(o) {
  const first = o.customer.name.split(' ')[0]
  return [
    ['Kargoya verildi', `Merhaba ${first}, ${o.no} numaralı siparişiniz ${o.cargo ?? 'kargoya'} teslim edildi. Takip no: ${o.tracking ?? trackingFor(o)}. İyi kamplar! — ${BRAND.name}`],
    ['Mağazada hazır', `Merhaba ${first}, ${o.no} numaralı siparişiniz Bilecik mağazamızda hazır. Pzt–Cmt 10:00–20:00 arası teslim alabilirsiniz.`],
    ['Değerlendirme iste', `Merhaba ${first}, ürünlerinizi kullanma fırsatınız oldu mu? 1 dakikanızı ayırıp değerlendirirseniz çok seviniriz. Teşekkürler!`],
  ]
}

export default function OrderDetail() {
  const { no } = useParams()
  const { orders, patchOrder } = useStore()
  const toast = useToast()
  const o = orders.find((x) => x.no === no)
  const [note, setNote] = useState('')
  const [labels, setLabels] = useState(false)
  const [invoice, setInvoice] = useState(false)
  const [msg, setMsg] = useState(null)
  const [cargo, setCargo] = useState(o?.cargo ?? CARGO_COMPANIES[0])

  const customer = useMemo(() => CUSTOMERS.find((c) => c.name === o?.customer.name && c.phone === o?.customer.phone), [o])
  const history = useMemo(() => {
    if (!o) return []
    const h = [[o.ts, 'Sipariş oluşturuldu', `${CHANNEL_LABEL[o.channel]} · ${PAYMENT_LABEL[o.payment]}`]]
    if (o.payment === 'kart') h.push([o.ts + 4000, 'Ödeme onaylandı', `iyzico · 3D Secure${o.installments > 1 ? ` · ${o.installments} taksit` : ''}`])
    const idx = FLOW.indexOf(o.status)
    if (!o.placedHere) {
      if (idx >= 1) h.push([o.ts + 2.5 * 3600000, 'Hazırlığa alındı', 'Depo: raf toplama listesi yazdırıldı'])
      if (idx >= 2) h.push([o.ts + 18 * 3600000, 'Kargoya verildi', `${o.cargo} · ${o.tracking}`])
      if (idx >= 3) h.push([o.ts + 44 * 3600000, 'Teslim edildi', 'Alıcıya teslim'])
      if (o.status === 'iade') h.push([o.ts + 6 * 86400000, 'İade tamamlandı', 'Ödeme karta iade edildi'])
      if (o.status === 'iptal') h.push([o.ts + 2 * 3600000, 'Sipariş iptal edildi', 'Müşteri talebi'])
    }
    ;(o.history ?? []).forEach((x) => h.push([x.ts, x.text, 'Panel']))
    return h.sort((a, b) => b[0] - a[0])
  }, [o])

  if (!o) {
    return (
      <div className="py-20 text-center">
        <p className="font-semibold">Sipariş bulunamadı</p>
        <Link to="/yonetim/siparisler" className="btn btn-outline btn-sm mt-4">
          Siparişlere dön
        </Link>
      </div>
    )
  }

  const next = NEXT_STATUS[o.status]
  const stepIdx = FLOW.indexOf(o.status)
  const advance = () => {
    const [status, label] = next
    const patch = { status }
    if (status === 'kargoda') {
      patch.cargo = cargo
      patch.tracking = trackingFor(o)
    }
    if (!o.invoice) patch.invoice = `EGC2026${String(o.seq).padStart(9, '0')}`
    patchOrder(o.no, patch, status === 'kargoda' ? `Kargoya verildi (${cargo}) — müşteriye SMS gönderildi` : label)
    toast(status === 'kargoda' ? 'Kargoya verildi, müşteriye takip numarası SMS ile gitti' : `Durum: ${STATUS[status].label}`)
  }
  const pieces = o.items.reduce((s, i) => s + i.qty, 0)

  return (
    <div>
      <Link to="/yonetim/siparisler" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-char-500 hover:text-char-900">
        <ArrowLeft size={15} /> Siparişler
      </Link>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="tnum font-sans text-[1.7rem] font-bold tracking-tight normal-case">{o.no}</h1>
            <StatusPill status={o.status} />
            {o.placedHere && <Pill tone="ember">Vitrinden (demo)</Pill>}
          </div>
          <p className="mt-1 text-[13.5px] text-char-500">
            {dateTime(o.ts)} · {CHANNEL_LABEL[o.channel]} · {pieces} ürün
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {o.delivery === 'kargo' && (
            <button onClick={() => setLabels(true)} className="btn btn-outline btn-sm">
              <Printer size={15} /> Kargo etiketi
            </button>
          )}
          <button onClick={() => setInvoice(true)} className="btn btn-outline btn-sm">
            <FileText size={15} /> Fatura
          </button>
          {next && (
            <button onClick={advance} className="btn btn-primary btn-sm">
              <Check size={15} /> {o.delivery === 'magaza' && next[0] === 'kargoda' ? 'Teslim edildi işaretle' : next[1]}
            </button>
          )}
        </div>
      </div>

      {stepIdx >= 0 && (
        <div className="mb-5 rounded-2xl bg-white p-5 ring-1 ring-line">
          <ol className="grid grid-cols-4">
            {FLOW.map((s, i) => (
              <li key={s} className="relative flex flex-col items-center text-center">
                {i > 0 && <span className={`absolute top-4 right-1/2 h-0.5 w-full ${i <= stepIdx ? 'bg-moss-500' : 'bg-stone'}`} />}
                <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i <= stepIdx ? 'bg-moss-600 text-white' : 'bg-mist text-char-400'}`}>
                  {i <= stepIdx ? <Check size={15} /> : i + 1}
                </span>
                <span className={`mt-2 text-[12.5px] font-medium ${i <= stepIdx ? 'text-char-900' : 'text-char-400'}`}>{STATUS[s].label}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-5">
          <Card title="Ürünler" pad={false}>
            <ul className="divide-y divide-line">
              {o.items.map((i) => (
                <li key={i.variantId} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-line">
                    <ProductImg path={i.image} widths={[120, 120]} sizes="56px" alt="" className="absolute inset-0 h-full w-full p-1" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link to={`/yonetim/urunler/${i.handle}`} className="line-clamp-1 text-[14px] font-medium hover:underline">
                      {i.title}
                    </Link>
                    <p className="text-xs text-char-400">
                      {i.brand}
                      {i.variant && ` · ${i.variant}`}
                    </p>
                  </div>
                  <p className="tnum text-[13px] whitespace-nowrap text-char-500">
                    {i.qty} × {tl(i.unit)}
                  </p>
                  <p className="tnum w-28 text-right font-semibold">{tl(i.total)}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-1.5 border-t border-line bg-bone/50 px-5 py-4 text-[13.5px]">
              <p className="flex justify-between">
                <span className="text-char-500">Ara toplam</span>
                <span className="tnum">{tl(o.subtotal)}</span>
              </p>
              {o.discount > 0 && (
                <p className="flex justify-between text-moss-700">
                  <span>İndirim{o.coupon ? ` (${o.coupon})` : ''}</span>
                  <span className="tnum">−{tl(o.discount)}</span>
                </p>
              )}
              <p className="flex justify-between">
                <span className="text-char-500">Kargo</span>
                <span className="tnum">{o.shipping ? tl(o.shipping) : 'Ücretsiz'}</span>
              </p>
              {o.payAdj !== 0 && (
                <p className="flex justify-between">
                  <span className="text-char-500">{o.payAdj < 0 ? 'Havale indirimi' : 'Kapıda ödeme bedeli'}</span>
                  <span className="tnum">
                    {o.payAdj < 0 ? '−' : '+'}
                    {tl(Math.abs(o.payAdj))}
                  </span>
                </p>
              )}
              <p className="flex justify-between border-t border-line pt-2 text-base font-bold">
                <span>Toplam</span>
                <span className="tnum">{tl(o.total)}</span>
              </p>
            </div>
          </Card>

          <Card title="Sipariş geçmişi">
            <ul className="space-y-4 border-l-2 border-line pl-5">
              {history.map(([t, title, sub], i) => (
                <li key={`${t}-${i}`} className="relative">
                  <span className={`absolute top-1.5 -left-[27px] h-3 w-3 rounded-full ring-4 ring-white ${i === 0 ? 'bg-ember' : 'bg-char-300'}`} />
                  <p className="text-[13.5px] font-medium">{title}</p>
                  <p className="text-xs text-char-400">
                    {dateTime(t)} · {sub}
                  </p>
                </li>
              ))}
            </ul>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!note.trim()) return
                patchOrder(o.no, {}, `Not: ${note.trim()}`)
                setNote('')
              }}
              className="mt-5 flex gap-2"
            >
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ekibe iç not ekle (müşteri görmez)" className="field field-sm" />
              <button className="btn btn-dark btn-sm shrink-0">Ekle</button>
            </form>
            {o.note && <p className="mt-3 rounded-lg bg-ember-50 px-3 py-2 text-[13px] text-ember-800">Müşteri notu: “{o.note}”</p>}
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Müşteri">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-mist text-char-500">
                <User size={20} />
              </span>
              <div>
                <p className="font-semibold">{o.customer.name}</p>
                <p className="text-xs text-char-400">{customer ? `${customer.orderCount}. sipariş · toplam ${tl(customer.spent)}` : 'İlk sipariş'}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-[13.5px]">
              <p className="flex items-center gap-2 text-char-600">
                <Phone size={14} className="text-char-400" /> {o.customer.phone}
              </p>
              <p className="flex items-center gap-2 text-char-600">
                <Mail size={14} className="text-char-400" /> {o.customer.email}
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => setMsg(templates(o)[0])} className="btn btn-outline btn-sm">
                <MessageCircle size={15} /> WhatsApp
              </button>
              <button onClick={() => toast('SMS gönderildi (demo)')} className="btn btn-outline btn-sm">
                <Send size={15} /> SMS
              </button>
            </div>
          </Card>

          <Card title="Teslimat">
            {o.delivery === 'magaza' ? (
              <p className="flex gap-2 text-[13.5px] text-char-600">
                <Store size={16} className="mt-0.5 shrink-0 text-ember-700" /> Bilecik mağazasından teslim alacak
              </p>
            ) : (
              <>
                <p className="flex gap-2 text-[13.5px] text-char-600">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-char-400" />
                  <span>
                    {o.customer.address ?? `${o.customer.district} Mah., örnek adres`}
                    <br />
                    {o.customer.district} / {o.customer.city}
                  </span>
                </p>
                <div className="mt-4">
                  <label className="label">Kargo firması</label>
                  <select value={cargo} onChange={(e) => setCargo(e.target.value)} disabled={stepIdx >= 2} className="field field-sm">
                    {CARGO_COMPANIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {o.tracking && (
                  <p className="mt-3 flex items-center gap-2 rounded-lg bg-bone px-3 py-2 text-[13px]">
                    <Truck size={15} className="text-char-400" /> Takip no <b className="tnum">{o.tracking}</b>
                  </p>
                )}
              </>
            )}
          </Card>

          <Card title="Ödeme">
            <div className="space-y-2 text-[13.5px]">
              <p className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-char-600">
                  <CreditCard size={15} className="text-char-400" /> {PAYMENT_LABEL[o.payment]}
                </span>
                <span className="font-medium">{o.payment === 'kart' ? (o.installments > 1 ? `${o.installments} taksit` : 'Tek çekim') : ''}</span>
              </p>
              {o.payment === 'kart' && (
                <>
                  <p className="flex items-center gap-2 text-moss-700">
                    <ShieldCheck size={15} /> 3D Secure doğrulandı · iyzico
                  </p>
                  <p className="tnum text-xs text-char-400">Ödeme ID: {String(o.seq * 7919).padStart(9, '0')}</p>
                </>
              )}
              {o.payment === 'havale' && <p className="text-xs text-char-500">Havale {o.status === 'yeni' ? 'bekleniyor' : 'hesaba geçti'}</p>}
              {o.payment === 'kapida' && <p className="text-xs text-char-500">Kapıda tahsil edilecek: {tl(o.total)}</p>}
            </div>
          </Card>

          {o.status !== 'iptal' && o.status !== 'teslim' && o.status !== 'iade' && (
            <button
              onClick={() => {
                patchOrder(o.no, { status: 'iptal' }, 'Sipariş iptal edildi, ödeme iadesi başlatıldı')
                toast('Sipariş iptal edildi')
              }}
              className="btn btn-ghost btn-sm w-full text-flame"
            >
              <XCircle size={15} /> Siparişi iptal et
            </button>
          )}
        </div>
      </div>

      <LabelsModal orders={[{ ...o, cargo }]} open={labels} onClose={() => setLabels(false)} />

      <Modal open={invoice} onClose={() => setInvoice(false)} title="e-Arşiv fatura" wide>
        <div className="rounded-xl border border-line p-6 text-[13px]">
          <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <img src={BRAND.logo} alt="" className="h-8" />
              <p className="mt-2 text-char-600">{BRAND.address}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">e-ARŞİV FATURA</p>
              <p className="tnum text-char-500">{o.invoice ?? 'Kesilmedi'}</p>
              <p className="text-char-500">{dateTime(o.ts)}</p>
            </div>
          </div>
          <p className="mt-4 font-semibold">{o.invoiceInfo?.company ?? o.customer.name}</p>
          <p className="text-char-500">
            {o.customer.district} / {o.customer.city}
          </p>
          <table className="mt-4 w-full">
            <thead>
              <tr className="border-b border-line text-left text-xs text-char-400">
                <th className="py-2">Ürün</th>
                <th className="py-2 text-right">Adet</th>
                <th className="py-2 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {o.items.map((i) => (
                <tr key={i.variantId} className="border-b border-line/60">
                  <td className="py-2">{i.title}</td>
                  <td className="tnum py-2 text-right">{i.qty}</td>
                  <td className="tnum py-2 text-right">{tl(i.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 ml-auto w-60 space-y-1">
            <p className="flex justify-between">
              <span className="text-char-500">Matrah</span>
              <span className="tnum">{tl(o.total / 1.2)}</span>
            </p>
            <p className="flex justify-between">
              <span className="text-char-500">KDV %20</span>
              <span className="tnum">{tl(o.total - o.total / 1.2)}</span>
            </p>
            <p className="flex justify-between font-bold">
              <span>Genel toplam</span>
              <span className="tnum">{tl(o.total)}</span>
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-char-400">Canlı sistemde fatura, entegratör (ör. Paraşüt, Logo e-Arşiv) üzerinden GİB’e iletilir ve müşteriye e-postalanır.</p>
      </Modal>

      <Modal
        open={!!msg}
        onClose={() => setMsg(null)}
        title="WhatsApp mesajı"
        footer={
          <>
            <button onClick={() => setMsg(null)} className="btn btn-outline btn-sm">
              Vazgeç
            </button>
            <button
              onClick={() => {
                setMsg(null)
                toast('Mesaj WhatsApp Business ile gönderildi (demo)')
              }}
              className="btn btn-dark btn-sm"
            >
              <Send size={15} /> Gönder
            </button>
          </>
        }
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          {templates(o).map((t) => (
            <button key={t[0]} onClick={() => setMsg(t)} className={`rounded-full px-3 py-1 text-[12.5px] font-medium ${msg?.[0] === t[0] ? 'bg-char-900 text-white' : 'bg-mist text-char-600'}`}>
              {t[0]}
            </button>
          ))}
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-[#dcf8c6] p-3.5 text-[14px] leading-6 text-char-900">{msg?.[1]}</div>
        <p className="mt-2 text-xs text-char-400">Alıcı: {o.customer.name} · {o.customer.phone}</p>
      </Modal>
    </div>
  )
}
