import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, PackageSearch, RotateCcw, Search } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { ProductImg } from '../components/ui/Bits'
import { dateTime, tl } from '../lib/format'
import { STATUS } from '../lib/status'

const FLOW = ['yeni', 'hazirlaniyor', 'kargoda', 'teslim']

function cargoEvents(o) {
  if (!['kargoda', 'teslim', 'iade'].includes(o.status)) return []
  const h = 3600000
  const base = o.ts + 20 * h
  const ev = [
    [base, 'Gönderi kargo şubesine teslim edildi', 'Bilecik Merkez Şube'],
    [base + 5 * h, 'Transfer merkezinden çıktı', 'Eskişehir Transfer Merkezi'],
    [base + 16 * h, 'Varış şubesine ulaştı', `${o.customer.city} ${o.customer.district}`],
    [base + 19 * h, 'Dağıtıma çıktı', 'Kurye: tahmini 13:00 – 17:00'],
  ]
  if (o.status !== 'kargoda') ev.push([base + 24 * h, 'Teslim edildi', 'Alıcıya teslim edildi'])
  return ev.filter(([t]) => t < Date.now()).reverse()
}

export default function OrderTrack() {
  const [sp] = useSearchParams()
  const { orders } = useStore()
  const [no, setNo] = useState(sp.get('no') ?? '')
  const [phone, setPhone] = useState('')
  const [query, setQuery] = useState(sp.get('no') ? { no: sp.get('no'), phone: '' } : null)
  const [ret, setRet] = useState(false)

  const example = useMemo(() => orders.find((o) => o.status === 'kargoda' && !o.placedHere), [orders])
  const order = useMemo(() => {
    if (!query) return null
    const n = query.no.trim().toUpperCase().replace(/^(\d)/, 'EC-$1')
    const o = orders.find((x) => x.no === n)
    if (!o) return null
    if (query.phone && !o.customer.phone.replace(/\D/g, '').endsWith(query.phone.replace(/\D/g, ''))) return null
    return o
  }, [query, orders])

  const stepIndex = order ? FLOW.indexOf(order.status) : -1
  const events = order ? cargoEvents(order) : []

  return (
    <div className="shell max-w-3xl py-10 md:py-16">
      <div className="text-center">
        <PackageSearch size={36} className="mx-auto text-ember-700" />
        <h1 className="display mt-3 text-[2.6rem] md:text-[3.2rem]">Sipariş takibi</h1>
        <p className="mt-1 text-char-500">Sipariş numaranız SMS ve e-postanızda yazıyor.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          setQuery({ no, phone })
          setRet(false)
        }}
        className="mt-8 grid gap-3 rounded-2xl bg-white p-5 ring-1 ring-line sm:grid-cols-[1fr_1fr_auto]"
      >
        <input value={no} onChange={(e) => setNo(e.target.value)} placeholder="Sipariş no (EC-…)" className="field" required aria-label="Sipariş numarası" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefonun son 4 hanesi" inputMode="numeric" maxLength={4} className="field" aria-label="Telefonun son 4 hanesi" />
        <button className="btn btn-dark">
          <Search size={16} /> Sorgula
        </button>
      </form>
      {example && !order && (
        <p className="mt-3 text-center text-[13px] text-char-500">
          Demo için:{' '}
          <button
            onClick={() => {
              const last4 = example.customer.phone.replace(/\D/g, '').slice(-4)
              setNo(example.no)
              setPhone(last4)
              setQuery({ no: example.no, phone: last4 })
            }}
            className="font-semibold text-char-900 underline underline-offset-2"
          >
            {example.no} numaralı kargodaki siparişi göster
          </button>
        </p>
      )}

      {query && !order && <p className="mt-6 rounded-xl bg-flame-50 p-4 text-center text-sm text-flame">Bu bilgilerle eşleşen bir sipariş bulamadık. Numarayı ve telefonu kontrol edin.</p>}

      {order && (
        <div className="mt-8 animate-rise space-y-4">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-line md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="tnum text-lg font-bold">{order.no}</p>
                <p className="text-[13px] text-char-500">{dateTime(order.ts)} · {tl(order.total)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS[order.status].pill}`}>{STATUS[order.status].label}</span>
            </div>

            {stepIndex >= 0 && (
              <ol className="mt-7 grid grid-cols-4">
                {FLOW.map((s, i) => (
                  <li key={s} className="relative flex flex-col items-center text-center">
                    {i > 0 && <span className={`absolute top-4 right-1/2 h-0.5 w-full ${i <= stepIndex ? 'bg-moss-500' : 'bg-stone'}`} />}
                    <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${i <= stepIndex ? 'bg-moss-600 text-white' : 'bg-mist text-char-400'}`}>
                      {i < stepIndex || order.status === 'teslim' ? <Check size={15} /> : i + 1}
                    </span>
                    <span className={`mt-2 text-[11.5px] leading-4 font-medium sm:text-[12.5px] ${i <= stepIndex ? 'text-char-900' : 'text-char-400'}`}>{STATUS[s].label}</span>
                  </li>
                ))}
              </ol>
            )}

            {order.tracking && (
              <p className="mt-6 rounded-xl bg-bone px-4 py-3 text-[13.5px]">
                <b>{order.cargo}</b> · takip no <span className="tnum font-semibold">{order.tracking}</span>
              </p>
            )}
            {events.length > 0 && (
              <ul className="mt-5 space-y-3 border-l-2 border-line pl-5">
                {events.map(([t, title, where], i) => (
                  <li key={t} className="relative">
                    <span className={`absolute top-1.5 -left-[27px] h-3 w-3 rounded-full ring-4 ring-white ${i === 0 ? 'bg-ember' : 'bg-char-300'}`} />
                    <p className="text-[14px] font-medium">{title}</p>
                    <p className="text-xs text-char-500">
                      {dateTime(t)} · {where}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.variantId} className="flex items-center gap-3 py-3 text-sm">
                  <div className="relative h-12 w-12 shrink-0 rounded-lg ring-1 ring-line">
                    <ProductImg path={i.image} widths={[100, 100]} sizes="48px" alt="" className="absolute inset-0 h-full w-full p-1" />
                  </div>
                  <p className="min-w-0 flex-1">
                    <span className="line-clamp-1">{i.title}</span>
                    <span className="text-xs text-char-400">
                      {i.qty} adet{i.variant ? ` · ${i.variant}` : ''}
                    </span>
                  </p>
                  <p className="tnum font-medium">{tl(i.total)}</p>
                </li>
              ))}
            </ul>
            {order.status === 'teslim' && (
              <div className="mt-3 border-t border-line pt-4">
                {ret ? (
                  <p className="flex items-center gap-2 text-sm font-semibold text-moss-700">
                    <Check size={16} /> İade talebiniz alındı. Anlaşmalı kargo kodu SMS ile gönderildi.
                  </p>
                ) : (
                  <button onClick={() => setRet(true)} className="btn btn-outline btn-sm">
                    <RotateCcw size={15} /> İade / değişim talebi oluştur
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
