import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Lock, ShoppingBag, Tag as TagIcon, Trash2, X } from 'lucide-react'
import { useCart } from '../store/CartContext'
import { useStore } from '../store/StoreContext'
import { ProductImg, QtyStepper } from '../components/ui/Bits'
import { CampaignHints, FreeShippingBar } from '../components/site/CartDrawer'
import Rail from '../components/site/Rail'
import { tl } from '../lib/format'

export function CouponBox() {
  const { couponCode, setCouponCode, totals } = useCart()
  const [input, setInput] = useState('')
  if (couponCode && totals.coupon) {
    return (
      <div className="flex items-center justify-between rounded-xl bg-moss-50 px-3 py-2.5 text-sm text-moss-700">
        <span className="flex items-center gap-2">
          <TagIcon size={15} />
          <b>{totals.coupon.code}</b> uygulandı
        </span>
        <button onClick={() => setCouponCode('')} className="p-1 hover:text-flame" aria-label="Kuponu kaldır">
          <X size={15} />
        </button>
      </div>
    )
  }
  return (
    <div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (input.trim()) setCouponCode(input.trim())
        }}
      >
        <input value={input} onChange={(e) => setInput(e.target.value.toUpperCase())} placeholder="Kupon kodu" className="field field-sm uppercase" aria-label="Kupon kodu" />
        <button className="btn btn-outline btn-sm shrink-0">Uygula</button>
      </form>
      {couponCode && totals.couponError && <p className="mt-1.5 text-xs text-flame">{totals.couponError}</p>}
      <p className="mt-1.5 text-[11.5px] text-char-400">Denemek için: KAMP10 · HOSGELDIN · BILECIK</p>
    </div>
  )
}

export function Summary({ totals, children }) {
  return (
    <div className="space-y-2.5 text-[14px]">
      <div className="flex justify-between">
        <span className="text-char-600">Ürünler ({totals.itemCount})</span>
        <span className="tnum">{tl(totals.subtotal)}</span>
      </div>
      {totals.discounts.map((d) => (
        <div key={d.id} className="flex justify-between gap-3 text-moss-700">
          <span className="min-w-0">{d.label}</span>
          <span className="tnum shrink-0 font-medium">−{tl(d.amount)}</span>
        </div>
      ))}
      {totals.coupon && (
        <div className="flex justify-between text-moss-700">
          <span>Kupon ({totals.coupon.code})</span>
          <span className="tnum font-medium">−{tl(totals.coupon.amount)}</span>
        </div>
      )}
      <div className="flex justify-between">
        <span className="text-char-600">Kargo</span>
        <span className="tnum">{totals.shipping ? tl(totals.shipping) : <b className="text-moss-700">Ücretsiz</b>}</span>
      </div>
      {totals.paymentLabel && (
        <div className={`flex justify-between ${totals.paymentAdj < 0 ? 'text-moss-700' : ''}`}>
          <span className={totals.paymentAdj < 0 ? '' : 'text-char-600'}>{totals.paymentLabel}</span>
          <span className="tnum">
            {totals.paymentAdj < 0 ? '−' : '+'}
            {tl(Math.abs(totals.paymentAdj))}
          </span>
        </div>
      )}
      {children}
      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <span className="font-semibold">Toplam</span>
        <span className="tnum text-2xl font-bold">{tl(totals.total)}</span>
      </div>
      {totals.savings > 0 && <p className="text-right text-[12.5px] font-semibold text-moss-600">Bu siparişte {tl(totals.savings)} kazançtasınız</p>}
    </div>
  )
}

export default function Cart() {
  const { lines, totals, setQty, remove, recent } = useCart()
  const { byHandle, shopProducts } = useStore()
  const suggestions = useMemo(() => {
    const inCart = new Set(lines.map((l) => l.handle))
    const fromRecent = recent.map((h) => byHandle[h]).filter((p) => p && p.available && !inCart.has(p.handle))
    const cheap = shopProducts.filter((p) => p.available && p.price < 600 && !inCart.has(p.handle)).sort((a, b) => b.popularity - a.popularity)
    return [...fromRecent, ...cheap].slice(0, 12)
  }, [lines, recent, byHandle, shopProducts])

  if (!lines.length) {
    return (
      <div className="shell py-16 text-center md:py-24">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-char-300 ring-1 ring-line">
          <ShoppingBag size={32} />
        </div>
        <h1 className="display mt-5 text-4xl">Sepetiniz boş</h1>
        <p className="mt-2 text-char-500">Kamp listenizi oluşturmaya başlayın.</p>
        <Link to="/urunler" className="btn btn-dark mt-6">
          Alışverişe başla
        </Link>
        {suggestions.length > 0 && (
          <div className="mt-16 text-left">
            <h2 className="display mb-5 text-3xl">Size önerilenler</h2>
            <Rail products={suggestions} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="shell py-8 md:py-12">
      <h1 className="display text-[2.6rem] md:text-[3.2rem]">
        Sepetim <span className="tnum text-char-300">({totals.itemCount})</span>
      </h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_24rem] lg:gap-10">
        <div className="space-y-4">
          <FreeShippingBar totals={totals} />
          <CampaignHints totals={totals} />
          <ul className="divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
            {totals.lines.map((l) => (
              <li key={l.key} className="flex gap-4 p-4">
                <Link to={`/urun/${l.product.handle}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-line md:h-28 md:w-28">
                  <ProductImg path={l.product.images[0]} widths={[200, 240]} sizes="112px" alt="" className="absolute inset-0 h-full w-full p-2" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold tracking-wider text-char-400 uppercase">{l.product.brand}</p>
                      <Link to={`/urun/${l.product.handle}`} className="line-clamp-2 text-[14.5px] leading-5 font-medium hover:underline">
                        {l.product.title}
                      </Link>
                      {l.variant.title && <p className="mt-0.5 text-[13px] text-char-500">{l.variant.title}</p>}
                    </div>
                    <button onClick={() => remove(l.key)} className="self-start p-1 text-char-300 hover:text-flame" aria-label="Kaldır">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                    <QtyStepper size="sm" value={l.qty} max={l.variant.stock || 99} onChange={(q) => setQty(l.key, q)} />
                    <div className="text-right">
                      {l.discount > 0 ? (
                        <>
                          <p className="tnum text-xs text-char-400 line-through">{tl(l.total)}</p>
                          <p className="tnum font-bold">{tl(l.total - l.discount)}</p>
                          <p className="text-[11.5px] font-medium text-moss-600">%{l.pct} kampanya</p>
                        </>
                      ) : (
                        <p className="tnum font-bold">{tl(l.total)}</p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-line">
            <p className="font-semibold">Sipariş özeti</p>
            <CouponBox />
            <Summary totals={totals} />
            <Link to="/odeme" className="btn btn-primary btn-lg w-full">
              Ödemeye geç <ArrowRight size={17} />
            </Link>
            <p className="flex items-center justify-center gap-1.5 text-xs text-char-400">
              <Lock size={12} /> 256-bit SSL · iyzico güvencesi
            </p>
          </div>
        </aside>
      </div>
      {suggestions.length > 0 && (
        <section className="pt-16">
          <h2 className="display mb-5 text-3xl">Sepetine eklemeyi unutma</h2>
          <Rail products={suggestions} />
        </section>
      )}
    </div>
  )
}
