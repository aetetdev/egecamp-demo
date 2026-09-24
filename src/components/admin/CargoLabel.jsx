import { BRAND } from '../../config/brand'
import { hashString } from '../../lib/rand'
import { dateNum } from '../../lib/format'

/** Takip numarasından deterministik "barkod" çizgileri */
function Barcode({ value, height = 44 }) {
  const bars = []
  let x = 0
  let h = hashString(value)
  for (let i = 0; i < 46; i++) {
    h = (h * 1103515245 + 12345) >>> 0
    const w = 1 + (h % 3)
    if (i % 2 === 0) bars.push(<rect key={i} x={x} y={0} width={w} height={height} fill="#000" />)
    x += w
  }
  return (
    <svg viewBox={`0 0 ${x} ${height}`} className="h-11 w-full" preserveAspectRatio="none" aria-hidden>
      {bars}
    </svg>
  )
}

export function trackingFor(o) {
  return o.tracking ?? String(hashString(o.no)).padStart(10, '7').slice(0, 10) + '26'
}

export default function CargoLabel({ order }) {
  const tracking = trackingFor(order)
  const pieces = order.items.reduce((s, i) => s + i.qty, 0)
  return (
    <div className="flex h-full flex-col rounded-lg border-2 border-black bg-white p-3 text-[11px] leading-tight text-black">
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <span className="text-[13px] font-black tracking-tight uppercase">{order.cargo ?? 'Yurtiçi Kargo'}</span>
        <span className="font-mono text-[10px]">{dateNum(Date.now())}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 border-b border-black py-2">
        <div>
          <p className="text-[9px] font-bold uppercase">Gönderici</p>
          <p className="font-semibold">{BRAND.name}</p>
          <p>{BRAND.addressLines[1]}</p>
          <p>{BRAND.phone}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase">Alıcı</p>
          <p className="font-semibold">{order.customer.name}</p>
          <p>
            {order.customer.district} / {order.customer.city}
          </p>
          <p>{order.customer.phone}</p>
        </div>
      </div>
      <div className="flex items-center justify-between py-2">
        <span>
          Sipariş <b>{order.no}</b>
        </span>
        <span>
          {pieces} parça · {order.payment === 'kapida' ? <b>KAPIDA ÖDEME</b> : 'Ödendi'}
        </span>
      </div>
      <div className="mt-auto">
        <Barcode value={tracking} />
        <p className="mt-1 text-center font-mono text-[12px] tracking-[0.2em]">{tracking}</p>
      </div>
    </div>
  )
}
