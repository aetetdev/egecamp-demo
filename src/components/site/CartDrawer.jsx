import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, Sparkles, Trash2, Truck, X } from 'lucide-react'
import { Drawer, ProductImg, QtyStepper } from '../ui/Bits'
import { useCart } from '../../store/CartContext'
import { tl } from '../../lib/format'

export function FreeShippingBar({ totals, compact = false }) {
  const done = totals.freeShipRemaining <= 0
  return (
    <div className={compact ? '' : 'rounded-xl bg-bone p-3'}>
      <p className="mb-2 flex items-center gap-2 text-[13px] text-char-700">
        <Truck size={16} className={done ? 'text-moss-600' : 'text-ember-700'} />
        {done ? (
          <span className="font-semibold text-moss-700">Kargonuz ücretsiz!</span>
        ) : (
          <span>
            Ücretsiz kargoya <b className="tnum text-char-900">{tl(totals.freeShipRemaining)}</b> kaldı
          </span>
        )}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-stone">
        <div className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-moss-500' : 'bg-ember'}`} style={{ width: `${totals.freeShipProgress * 100}%` }} />
      </div>
    </div>
  )
}

export function CampaignHints({ totals }) {
  if (!totals.hints.length) return null
  return (
    <div className="space-y-1.5">
      {totals.hints.map((h) => (
        <p key={h.campaign.id} className="flex items-start gap-2 rounded-lg bg-moss-50 px-3 py-2 text-[12.5px] text-moss-700">
          <Sparkles size={14} className="mt-0.5 shrink-0" />
          <span>
            <b>{h.missing} adet daha</b> ekleyin, <b>%{h.pct} indirime</b> geçin <span className="opacity-75">— {h.campaign.name}</span>
          </span>
        </p>
      ))}
    </div>
  )
}

export default function CartDrawer() {
  const { drawer, closeDrawer, lines, totals, setQty, remove } = useCart()
  const navigate = useNavigate()
  const go = (to) => {
    closeDrawer()
    navigate(to)
  }
  return (
    <Drawer open={drawer} onClose={closeDrawer} label="Sepet">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="display text-2xl">
          Sepetim <span className="tnum text-char-400">({totals.itemCount})</span>
        </h2>
        <button onClick={closeDrawer} className="rounded-lg p-1.5 text-char-400 hover:bg-mist hover:text-char-900" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-mist text-char-400">
            <ShoppingBag size={26} />
          </div>
          <p className="font-semibold">Sepetiniz boş</p>
          <p className="max-w-xs text-sm text-char-500">Kampa hazırlık listenizi yapmaya başlayın — ilk öneri: termos ve kafa lambası.</p>
          <button onClick={() => go('/urunler')} className="btn btn-dark mt-2">
            Alışverişe başla
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3 border-b border-line px-5 py-4">
            <FreeShippingBar totals={totals} />
            <CampaignHints totals={totals} />
          </div>
          <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
            {totals.lines.map((l) => (
              <li key={l.key} className="flex gap-3 py-4">
                <Link to={`/urun/${l.product.handle}`} onClick={closeDrawer} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-line">
                  <ProductImg path={l.product.images[0]} widths={[160, 160]} sizes="80px" alt="" className="absolute inset-0 h-full w-full p-1.5" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/urun/${l.product.handle}`} onClick={closeDrawer} className="line-clamp-2 text-[13.5px] leading-5 font-medium text-char-800 hover:underline">
                    {l.product.title}
                  </Link>
                  {l.variant.title && <p className="mt-0.5 text-xs text-char-500">{l.variant.title}</p>}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <QtyStepper size="sm" value={l.qty} max={l.variant.stock || 99} onChange={(q) => setQty(l.key, q)} />
                    <div className="text-right">
                      {l.discount > 0 && <p className="tnum text-[11px] text-char-400 line-through">{tl(l.total)}</p>}
                      <p className="tnum text-[14px] font-semibold">{tl(l.total - l.discount)}</p>
                    </div>
                  </div>
                  {l.discount > 0 && <p className="mt-1 text-[11.5px] font-medium text-moss-600">%{l.pct} kampanya indirimi uygulandı</p>}
                </div>
                <button onClick={() => remove(l.key)} className="self-start p-1 text-char-300 hover:text-flame" aria-label="Kaldır">
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
          <div className="space-y-3 border-t border-line bg-bone/60 px-5 pt-4 pb-safe">
            {totals.campaignDiscount > 0 && (
              <div className="flex justify-between text-[13px] text-moss-700">
                <span>Kampanya indirimi</span>
                <span className="tnum font-semibold">−{tl(totals.campaignDiscount)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-char-600">Ara toplam</span>
              <span className="tnum text-xl font-bold">{tl(totals.goods)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => go('/sepet')} className="btn btn-outline">
                Sepete git
              </button>
              <button onClick={() => go('/odeme')} className="btn btn-primary">
                Ödemeye geç
              </button>
            </div>
            <p className="text-center text-[11.5px] text-char-400">Kargo ve kupon bir sonraki adımda hesaplanır</p>
          </div>
        </>
      )}
    </Drawer>
  )
}
