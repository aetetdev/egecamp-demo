import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Copy, LayoutDashboard, MessageSquare, Package, Store, Truck } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { BRAND } from '../config/brand'
import { ProductImg } from '../components/ui/Bits'
import { dateTime, tl } from '../lib/format'
import NotFound from './NotFound'

export default function OrderConfirmed() {
  const { no } = useParams()
  const { orders } = useStore()
  const o = orders.find((x) => x.no === no)
  if (!o) return <NotFound />

  const steps =
    o.delivery === 'magaza'
      ? [
          [MessageSquare, 'Onay SMS’i gönderildi', `${o.customer.phone} numarasına sipariş özeti gitti.`],
          [Package, 'Mağazada hazırlanıyor', 'Siparişiniz genelde 2 saat içinde hazır olur.'],
          [Store, 'Teslim alın', `${BRAND.addressLines[0]} ${BRAND.addressLines[1]}`],
        ]
      : [
          [MessageSquare, 'Onay SMS’i gönderildi', `${o.customer.phone} numarasına sipariş özeti gitti.`],
          [Package, 'Hazırlanıyor', 'Saat 15:00’e kadar verilen siparişler aynı gün paketlenir.'],
          [Truck, `${o.cargo}’ya teslim`, 'Takip numarası SMS ile gelir; buradan da izleyebilirsiniz.'],
        ]

  return (
    <div className="shell max-w-4xl py-10 md:py-16">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 animate-pop items-center justify-center rounded-full bg-moss-600 text-white">
          <CheckCircle2 size={34} />
        </div>
        <h1 className="display mt-5 text-[2.6rem] md:text-[3.4rem]">Siparişiniz alındı</h1>
        <p className="mt-2 text-char-500">Teşekkürler {o.customer.name.split(' ')[0]}, kampa bir adım daha yakınsınız.</p>
        <button
          onClick={() => navigator.clipboard?.writeText(o.no)}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 ring-1 ring-line hover:ring-char-300"
          title="Kopyala"
        >
          <span className="text-sm text-char-500">Sipariş no</span>
          <span className="tnum text-lg font-bold">{o.no}</span>
          <Copy size={15} className="text-char-400" />
        </button>
      </div>

      <div className="mt-8 rounded-2xl bg-char-900 p-5 text-white md:flex md:items-center md:justify-between md:gap-6">
        <div className="flex gap-3">
          <LayoutDashboard size={22} className="mt-0.5 shrink-0 text-ember" />
          <div>
            <p className="font-semibold">Sunum notu: bu sipariş şu an yönetim panelinde</p>
            <p className="mt-0.5 text-[13.5px] text-white/65">“Yeni” durumuyla sipariş listesinin en üstünde; stoktan da düşüldü.</p>
          </div>
        </div>
        <Link to={`/yonetim/siparisler/${o.no}`} className="btn btn-primary mt-4 shrink-0 md:mt-0">
          Panelde aç
        </Link>
      </div>

      {o.payment === 'havale' && (
        <div className="mt-6 rounded-2xl bg-ember-50 p-5 ring-1 ring-ember-100">
          <p className="font-semibold">Havale / EFT bilgileri</p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-char-500">Alıcı</dt>
              <dd className="font-medium">{BRAND.name}</dd>
            </div>
            <div>
              <dt className="text-char-500">IBAN</dt>
              <dd className="tnum font-medium">TR00 0000 0000 0000 0000 0000 00</dd>
            </div>
            <div>
              <dt className="text-char-500">Açıklama</dt>
              <dd className="font-medium">{o.no}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-char-500">Demo IBAN’ıdır. Ödeme 24 saat içinde ulaşmazsa sipariş otomatik iptal edilir.</p>
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
          <p className="mb-4 font-semibold">Sırada ne var?</p>
          <ol className="space-y-5">
            {steps.map(([Icon, t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${i === 0 ? 'bg-moss-600 text-white' : 'bg-mist text-char-500'}`}>
                  <Icon size={17} />
                </span>
                <div>
                  <p className="text-[14.5px] font-semibold">{t}</p>
                  <p className="text-[13px] text-char-500">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link to={`/siparis-takip?no=${o.no}`} className="btn btn-outline mt-6 w-full">
            Siparişimi takip et
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
          <p className="mb-1 font-semibold">Özet</p>
          <p className="mb-4 text-xs text-char-400">{dateTime(o.ts)}</p>
          <ul className="space-y-3">
            {o.items.map((i) => (
              <li key={i.variantId} className="flex items-start gap-3 text-[13px]">
                <div className="relative h-12 w-12 shrink-0 rounded-lg ring-1 ring-line">
                  <ProductImg path={i.image} widths={[100, 100]} sizes="48px" alt="" className="absolute inset-0 h-full w-full p-1" />
                </div>
                <p className="line-clamp-2 min-w-0 flex-1">
                  {i.qty} × {i.title}
                </p>
                <p className="tnum font-medium">{tl(i.total)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1.5 border-t border-line pt-3 text-[13.5px]">
            {o.discount > 0 && (
              <p className="flex justify-between text-moss-700">
                <span>İndirimler</span>
                <span className="tnum">−{tl(o.discount)}</span>
              </p>
            )}
            <p className="flex justify-between">
              <span className="text-char-500">Kargo</span>
              <span className="tnum">{o.shipping ? tl(o.shipping) : 'Ücretsiz'}</span>
            </p>
            <p className="flex justify-between text-base font-bold">
              <span>Toplam</span>
              <span className="tnum">{tl(o.total)}</span>
            </p>
            <p className="text-right text-xs text-char-400">
              {o.payment === 'kart' ? (o.installments > 1 ? `Kredi kartı · ${o.installments} taksit` : 'Kredi kartı · tek çekim') : o.payment === 'havale' ? 'Havale / EFT' : 'Kapıda ödeme'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link to="/" className="text-sm font-semibold text-char-700 underline underline-offset-4 hover:text-char-900">
          Alışverişe devam et
        </Link>
      </div>
    </div>
  )
}
