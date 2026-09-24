import { memo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag, Truck } from 'lucide-react'
import { ProductImg, Stars, Tag } from '../ui/Bits'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'
import { productOffer } from '../../lib/pricing'
import { tl } from '../../lib/format'
import { NOW } from '../../data/generate'

const NEW_DAYS = 45

function optionSummary(p) {
  if (!p.options?.length) return null
  const o = p.options[0]
  const n = o.values.length
  if (/renk/i.test(o.name)) return `${n} renk`
  if (/beden|boyut|numara/i.test(o.name)) return `${n} beden`
  return `${n} seçenek`
}

function ProductCard({ product: p, eager = false }) {
  const { add, isFavorite, toggleFavorite } = useCart()
  const { campaigns, settings } = useStore()
  const navigate = useNavigate()
  const [hover, setHover] = useState(false)
  const offer = productOffer(p, campaigns)
  const off = p.compare && p.compare > p.price ? Math.round((1 - p.price / p.compare) * 100) : 0
  const isNew = (NOW - new Date(p.created)) / 86400000 < NEW_DAYS
  const fav = isFavorite(p.handle)
  const summary = optionSummary(p)
  const second = p.images[1]

  const quickAdd = (e) => {
    e.preventDefault()
    if (p.hasVariants) navigate(`/urun/${p.handle}`)
    else add(p)
  }

  return (
    <Link
      to={`/urun/${p.handle}`}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-line transition-shadow hover:card-lift"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-white">
        <ProductImg path={p.images[0]} alt={p.title} eager={eager} className="absolute inset-0 h-full w-full p-3 transition-transform duration-500 group-hover:scale-[1.03]" />
        {second && hover && <ProductImg path={second} alt="" className="absolute inset-0 hidden h-full w-full bg-white p-3 md:block" />}

        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {off > 0 && <Tag tone="flame">%{off}</Tag>}
          {offer && <Tag tone="moss">{offer.label}</Tag>}
          {isNew && !off && <Tag tone="dark">Yeni</Tag>}
          {p.own && <Tag tone="ember">EgeCamp®</Tag>}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            toggleFavorite(p.handle)
          }}
          aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          className={`absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 ring-1 ring-line backdrop-blur transition ${fav ? 'text-flame' : 'text-char-400 hover:text-char-900'}`}
        >
          <Heart size={15} fill={fav ? 'currentColor' : 'none'} />
        </button>

        {!p.available && (
          <div className="absolute inset-x-0 bottom-0 bg-char-900/85 py-1.5 text-center text-xs font-semibold tracking-wide text-white">Tükendi · Gelince haber ver</div>
        )}

        {p.available && (
          <button
            type="button"
            onClick={quickAdd}
            className="absolute right-2 bottom-2 left-2 hidden translate-y-2 items-center justify-center gap-2 rounded-lg bg-char-900 py-2.5 text-[13px] font-semibold text-white opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-char-700 md:flex"
          >
            <ShoppingBag size={15} />
            {p.hasVariants ? 'Seçenekleri gör' : 'Sepete ekle'}
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 border-t border-line/70 p-3 pt-2.5">
        <p className="text-[11px] font-semibold tracking-wider text-char-400 uppercase">{p.brand}</p>
        <h3 className="line-clamp-2 min-h-[2.5rem] font-sans text-[13.5px] leading-5 font-medium text-char-800">{p.title}</h3>
        <div className="flex items-center gap-1.5 text-[11px] text-char-400">
          <Stars value={p.rating} size={11} />
          <span className="tnum">({p.reviewCount})</span>
          {summary && <span className="ml-auto">{summary}</span>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <div className="min-w-0">
            {off > 0 && <p className="tnum text-[11px] text-char-400 line-through">{tl(p.compare)}</p>}
            <p className="tnum text-[15px] font-bold text-char-900">{tl(p.price)}</p>
            {offer?.basketPrice && (
              <p className="tnum text-[11.5px] font-semibold text-moss-600">Sepette {tl(offer.basketPrice)}</p>
            )}
          </div>
          {p.available && (
            <button
              type="button"
              onClick={quickAdd}
              aria-label="Sepete ekle"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ember text-char-950 md:hidden"
            >
              <ShoppingBag size={16} />
            </button>
          )}
        </div>
        {p.price >= settings.freeShippingThreshold && p.available && (
          <p className="flex items-center gap-1 text-[11px] font-medium text-moss-600">
            <Truck size={12} /> Ücretsiz kargo
          </p>
        )}
      </div>
    </Link>
  )
}

export default memo(ProductCard)

export function ProductGrid({ products, eagerCount = 4, className = '' }) {
  return (
    <div className={`grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 ${className}`}>
      {products.map((p, i) => (
        <ProductCard key={p.handle} product={p} eager={i < eagerCount} />
      ))}
    </div>
  )
}
