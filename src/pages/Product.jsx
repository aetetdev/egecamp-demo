import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  BadgeCheck,
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Heart,
  PackageCheck,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Timer,
  Truck,
} from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { useCart } from '../store/CartContext'
import { SUBCATS, TOPCATS, img, inCategory, isColorOption, loadDetails, swatchFor } from '../data/catalog'
import { reviewsFor } from '../data/generate'
import { BRAND, INSTALLMENT_COUNTS, INSTALLMENT_PLANS } from '../config/brand'
import { installment, productOffer } from '../lib/pricing'
import { dateShort, dayMonth, dayName, duration, tl } from '../lib/format'
import { Price, ProductImg, QtyStepper, Stars, Tag, cutoffRemaining, useNow } from '../components/ui/Bits'
import Rail from '../components/site/Rail'
import { WhatsAppIcon } from '../components/site/SiteLayout'
import NotFound from './NotFound'

const COMPLEMENTS = {
  cadir: ['uyku-tulumu', 'mat-yatak-kampet', 'aydinlatma', 'cadir-aksesuarlari'],
  'uyku-tulumu': ['mat-yatak-kampet', 'cadir', 'aydinlatma'],
  'mat-yatak-kampet': ['uyku-tulumu', 'cadir'],
  'masa-sandalye': ['mangal-izgara', 'bardaklar', 'sogutucu-buzluk'],
  'isitici-soba': ['cadir', 'pisirme-setleri', 'guc-kaynaklari'],
  'kamp-ocaklari': ['kartus-purmuz', 'pisirme-setleri', 'bardaklar'],
  'kartus-purmuz': ['kamp-ocaklari', 'pisirme-setleri'],
  'pisirme-setleri': ['kamp-ocaklari', 'kartus-purmuz', 'mutfak-ekipmanlari'],
  'mangal-izgara': ['mutfak-ekipmanlari', 'masa-sandalye', 'sogutucu-buzluk'],
  'sogutucu-buzluk': ['guc-kaynaklari', 'masa-sandalye'],
  termos: ['bardaklar', 'kamp-ocaklari'],
  ayakkabi: ['bot-aksesuari', 'pantolon-sort', 'sapka-eldiven'],
  'mont-ceket': ['polar', 'sapka-eldiven', 'bandana-boyunluk'],
  'guc-kaynaklari': ['gunes-panelleri', 'sogutucu-buzluk'],
  'gunes-panelleri': ['guc-kaynaklari'],
}

/** Kargoya veriliş ve tahmini teslim tarihi */
function shipping(now, cutoff) {
  const d = new Date(now)
  let ship = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const sameDay = cutoffRemaining(now, cutoff) != null
  if (!sameDay) ship = new Date(ship.getTime() + 86400000)
  while (ship.getDay() === 0) ship = new Date(ship.getTime() + 86400000)
  const addBiz = (from, n) => {
    let x = new Date(from)
    let k = 0
    while (k < n) {
      x = new Date(x.getTime() + 86400000)
      if (x.getDay() !== 0) k++
    }
    return x
  }
  return { sameDay, ship, from: addBiz(ship, 1), to: addBiz(ship, 3) }
}

function Gallery({ product }) {
  const [i, setI] = useState(0)
  const [zoom, setZoom] = useState(null)
  const track = useRef(null)
  useEffect(() => setI(0), [product.handle])
  const images = product.images

  const onScroll = () => {
    const el = track.current
    if (el) setI(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div className="lg:flex lg:gap-3">
      <div className="hidden w-20 shrink-0 flex-col gap-2 lg:flex">
        {images.map((p, k) => (
          <button
            key={p}
            onClick={() => setI(k)}
            onMouseEnter={() => setI(k)}
            className={`relative aspect-square overflow-hidden rounded-lg bg-white ring-2 transition ${k === i ? 'ring-char-900' : 'ring-transparent hover:ring-stone'}`}
          >
            <ProductImg path={p} widths={[160, 160]} sizes="80px" alt="" className="absolute inset-0 h-full w-full p-1" />
          </button>
        ))}
      </div>

      {/* Masaüstü: yakınlaştırmalı tek görsel */}
      <div
        className="relative hidden aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-2xl bg-white ring-1 ring-line lg:block"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
        }}
        onMouseLeave={() => setZoom(null)}
      >
        <img
          src={img(images[i], 1200)}
          alt={product.title}
          className="absolute inset-0 h-full w-full object-contain p-6 transition-transform duration-200"
          style={zoom ? { transform: 'scale(1.9)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
      </div>

      {/* Mobil: kaydırmalı */}
      <div className="relative -mx-4 lg:hidden">
        <div ref={track} onScroll={onScroll} className="no-scrollbar snap-x-mandatory flex overflow-x-auto">
          {images.map((p, k) => (
            <div key={p} className="snap-start relative aspect-square w-full shrink-0 bg-white">
              <ProductImg path={p} widths={[480, 800]} sizes="100vw" eager={k === 0} alt={k === 0 ? product.title : ''} className="absolute inset-0 h-full w-full p-4" />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/80 px-2 py-1 backdrop-blur">
            {images.map((p, k) => (
              <span key={p} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-5 bg-char-900' : 'w-1.5 bg-char-300'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InstallmentTable({ price }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-[13px]">
        <thead>
          <tr className="text-left text-xs text-char-500">
            <th className="py-2 pr-3 font-medium">Taksit</th>
            {INSTALLMENT_PLANS.map((b) => (
              <th key={b.bank} className="px-2 py-2 font-semibold" style={{ color: b.color }}>
                {b.bank}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tnum">
          {INSTALLMENT_COUNTS.map((n) => (
            <tr key={n} className="border-t border-line">
              <td className="py-2 pr-3 font-medium text-char-700">{n === 1 ? 'Tek çekim' : `${n} taksit`}</td>
              {INSTALLMENT_PLANS.map((b) => {
                const { grand, monthly } = installment(price, n, b.rates[n])
                return (
                  <td key={b.bank} className="px-2 py-2 text-char-800">
                    <span className="block font-medium">{tl(monthly)}</span>
                    <span className={`block text-[11px] ${b.rates[n] === 0 && n > 1 ? 'font-semibold text-moss-600' : 'text-char-400'}`}>
                      {b.rates[n] === 0 && n > 1 ? 'Peşin fiyatına' : tl(grand)}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-char-400">Oranlar örnektir. Canlı sistemde ödeme kuruluşunun (iyzico / PayTR) güncel oranları otomatik çekilir.</p>
    </div>
  )
}

function Reviews({ product }) {
  const reviews = useMemo(() => reviewsFor(product), [product])
  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-bone p-4">
        <p className="display text-5xl">{product.rating.toLocaleString('tr-TR')}</p>
        <div>
          <Stars value={product.rating} size={16} />
          <p className="mt-1 text-xs text-char-500">{product.reviewCount} değerlendirme</p>
        </div>
        <Tag tone="outline" className="ml-auto">Örnek yorumlar · demo verisi</Tag>
      </div>
      <ul className="mt-2 divide-y divide-line">
        {reviews.map((r) => (
          <li key={r.id} className="py-4">
            <div className="flex items-center gap-2">
              <Stars value={r.rating} size={12} />
              <span className="text-[13px] font-semibold">{r.name}</span>
              {r.verified && (
                <span className="flex items-center gap-1 text-[11px] text-moss-600">
                  <BadgeCheck size={13} /> Satın aldı
                </span>
              )}
              <span className="ml-auto text-xs text-char-400">{dateShort(r.date)}</span>
            </div>
            <p className="mt-1.5 text-[14px] text-char-700">{r.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Product() {
  const { handle } = useParams()
  const { byHandle, shopProducts, campaigns, settings } = useStore()
  const { add, isFavorite, toggleFavorite, pushRecent } = useCart()
  const navigate = useNavigate()
  const product = byHandle[handle]
  const [details, setDetails] = useState(null)
  const [sel, setSel] = useState([])
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('aciklama')
  const [notify, setNotify] = useState(false)
  const now = useNow(30000)

  useEffect(() => {
    if (!product) return
    pushRecent(product.handle)
    const first = product.variants.find((v) => v.available) ?? product.variants[0]
    setSel(first.options)
    setQty(1)
    setTab('aciklama')
    setNotify(false)
    let alive = true
    loadDetails().then((d) => alive && setDetails(d[product.handle] ?? { desc: [], features: [] }))
    return () => {
      alive = false
    }
  }, [product?.handle]) // eslint-disable-line react-hooks/exhaustive-deps

  const variant = useMemo(() => {
    if (!product) return null
    return product.variants.find((v) => v.options.every((o, k) => o === sel[k])) ?? product.variants[0]
  }, [product, sel])

  const similar = useMemo(() => {
    if (!product) return []
    return shopProducts
      .filter((p) => p.handle !== product.handle && p.cats[0] === product.cats[0] && p.available)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 12)
  }, [product, shopProducts])

  const complements = useMemo(() => {
    if (!product) return []
    const cats = COMPLEMENTS[product.cats[0]] ?? TOPCATS[product.top].children.map((c) => c.slug).filter((c) => c !== product.cats[0])
    const out = []
    cats.forEach((c) => {
      shopProducts
        .filter((p) => p.available && inCategory(p, c))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 4)
        .forEach((p) => out.push(p))
    })
    return out.slice(0, 12)
  }, [product, shopProducts])

  if (!product || !product.active) return <NotFound />

  const offer = productOffer(product, campaigns)
  const sub = SUBCATS[product.cats[0]]
  const top = TOPCATS[product.top]
  const fav = isFavorite(product.handle)
  const ship = shipping(now, settings.sameDayCutoff)
  const left = cutoffRemaining(now, settings.sameDayCutoff)
  const price = variant.price
  const compare = variant.compare
  const lowStock = variant.available && variant.stock <= 5
  const maxInstallment = price >= 1000 ? 12 : price >= 500 ? 6 : 3
  const freeShip = price >= settings.freeShippingThreshold

  const optionAvailable = (k, value) =>
    product.variants.some((v) => v.available && v.options[k] === value && v.options.every((o, j) => j === k || o === sel[j]))

  const buyNow = () => {
    add(product, variant, qty, { silent: true })
    navigate('/odeme')
  }

  return (
    <div className="pb-24 lg:pb-0">
      <div className="shell pt-4 md:pt-6">
        <nav className="mb-4 flex flex-wrap items-center gap-1 text-[12.5px] text-char-400">
          <Link to="/" className="hover:text-char-800">Ana sayfa</Link>
          <ChevronRight size={13} />
          <Link to={`/kategori/${top.slug}`} className="hover:text-char-800">{top.name}</Link>
          <ChevronRight size={13} />
          <Link to={`/kategori/${sub.slug}`} className="hover:text-char-800">{sub.name}</Link>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
          <div className="lg:sticky lg:top-36 lg:self-start">
            <Gallery product={product} />
          </div>

          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <Link to={`/marka/${product.brandSlug}`} className="text-[12px] font-bold tracking-[0.14em] text-ember-700 uppercase hover:underline">
                {product.brand}
              </Link>
              <div className="flex gap-1">
                <button
                  onClick={() => navigator.share?.({ title: product.title, url: window.location.href }).catch(() => {})}
                  className="rounded-full p-2 text-char-400 hover:bg-mist hover:text-char-900"
                  aria-label="Paylaş"
                >
                  <Share2 size={18} />
                </button>
                <button onClick={() => toggleFavorite(product.handle)} className={`rounded-full p-2 hover:bg-mist ${fav ? 'text-flame' : 'text-char-400 hover:text-char-900'}`} aria-label="Favori">
                  <Heart size={18} fill={fav ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
            <h1 className="mt-1 font-sans text-[1.45rem] leading-tight font-semibold tracking-tight text-char-900 md:text-[1.75rem]">{product.title}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-char-500">
              <button onClick={() => setTab('yorum')} className="flex items-center gap-1.5 hover:text-char-900">
                <Stars value={product.rating} />
                <span className="tnum font-medium">{product.rating.toLocaleString('tr-TR')}</span>
                <span>({product.reviewCount} değerlendirme)</span>
              </button>
              <span className="text-char-300">·</span>
              <span>Stok kodu: {product.sku}</span>
            </div>

            <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-line md:p-5">
              <Price price={price} compare={compare} size="lg" />
              {offer?.basketPrice && (
                <p className="mt-2 flex items-center gap-2 rounded-lg bg-moss-50 px-3 py-2 text-[13.5px] text-moss-700">
                  <Sparkles size={15} />
                  <span>
                    {offer.label} — sepette <b className="tnum">{tl(price * (1 - offer.pct / 100))}</b>
                  </span>
                </p>
              )}
              {offer?.tiers && (
                <div className="mt-2 rounded-lg bg-moss-50 px-3 py-2 text-[13.5px] text-moss-700">
                  <p className="flex items-center gap-2 font-semibold">
                    <Sparkles size={15} /> {offer.campaign.name}
                  </p>
                  <p className="mt-0.5 pl-6 text-[12.5px]">
                    {offer.tiers.map((t) => `${t.min} adette %${t.pct}`).join(' · ')} — farklı modeller birlikte sayılır.
                  </p>
                </div>
              )}
              <p className="mt-3 flex items-center gap-2 text-[13px] text-char-600">
                <CreditCard size={15} className="text-char-400" />
                {price >= 500 ? (
                  <span>
                    Bonus ve World kartlara <b>peşin fiyatına 3 taksit</b> · {maxInstallment} aya varan taksit{' '}
                    <button onClick={() => setTab('taksit')} className="font-semibold text-char-900 underline underline-offset-2">
                      tablo
                    </button>
                  </span>
                ) : (
                  <span>Tüm kartlarla güvenli ödeme</span>
                )}
              </p>
            </div>

            {product.options.map((opt, k) => (
              <div key={opt.name} className="mt-5">
                <p className="mb-2 text-[13px] text-char-500">
                  {opt.name}: <b className="font-semibold text-char-900">{sel[k]}</b>
                </p>
                <div className="flex flex-wrap gap-2">
                  {opt.values.map((val) => {
                    const on = sel[k] === val
                    const ok = optionAvailable(k, val)
                    const sw = isColorOption(opt.name) ? swatchFor(val) : null
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSel((s) => s.map((x, j) => (j === k ? val : x)))}
                        className={`relative flex h-10 min-w-11 items-center justify-center gap-2 rounded-lg px-3 text-[13px] font-medium ring-1 transition ${on ? 'bg-char-900 text-white ring-char-900' : ok ? 'bg-white text-char-800 ring-stone hover:ring-char-500' : 'bg-bone text-char-300 ring-line'}`}
                      >
                        {sw && <span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ background: sw }} />}
                        {val}
                        {!ok && <span className="absolute inset-x-2 top-1/2 h-px -rotate-12 bg-char-300" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {variant.available ? (
              <>
                {lowStock && (
                  <p className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-flame">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flame opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-flame" />
                    </span>
                    Son {variant.stock} ürün — tükenmeden alın
                  </p>
                )}
                <div className="mt-4 flex gap-2.5">
                  <QtyStepper value={qty} onChange={setQty} max={variant.stock} />
                  <button onClick={() => add(product, variant, qty)} className="btn btn-primary btn-lg flex-1">
                    <ShoppingBag size={18} /> Sepete ekle
                  </button>
                </div>
                <button onClick={buyNow} className="btn btn-dark btn-lg mt-2.5 w-full">
                  Hemen al
                </button>
              </>
            ) : (
              <div className="mt-5 rounded-2xl bg-bone p-4">
                <p className="font-semibold">Bu seçenek şu an tükendi</p>
                <p className="mt-1 text-[13px] text-char-500">Stoğa girdiğinde SMS ile haber verelim.</p>
                {notify ? (
                  <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-moss-700">
                    <Check size={16} /> Listeye eklendiniz. Gelince ilk siz öğreneceksiniz.
                  </p>
                ) : (
                  <form
                    className="mt-3 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      setNotify(true)
                    }}
                  >
                    <input required inputMode="tel" placeholder="05xx xxx xx xx" className="field" />
                    <button className="btn btn-dark shrink-0">
                      <Bell size={16} /> Haber ver
                    </button>
                  </form>
                )}
              </div>
            )}

            <a
              href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(`Merhaba, "${product.title}" hakkında bilgi almak istiyorum.`)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13.5px] font-medium text-char-700 ring-1 ring-line hover:bg-white"
            >
              <span className="text-[#1ea952]">
                <WhatsAppIcon size={18} />
              </span>
              Ürün hakkında WhatsApp’tan sorun
            </a>

            <div className="mt-5 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
              <div className="flex gap-3 p-4">
                <Timer size={20} className="mt-0.5 shrink-0 text-ember-700" />
                <div className="text-[13.5px]">
                  {ship.sameDay ? (
                    <p>
                      <b className="tnum text-char-900">{duration(left)}</b> içinde sipariş verirseniz <b className="text-moss-700">bugün kargoda</b>
                    </p>
                  ) : (
                    <p>
                      <b>{dayName(ship.ship.getDay())}</b> günü kargoya verilir
                    </p>
                  )}
                  <p className="mt-0.5 text-char-500">
                    Tahmini teslim: <b className="text-char-800">{dayMonth(ship.from)} – {dayMonth(ship.to)}</b>
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-4">
                <Truck size={20} className="mt-0.5 shrink-0 text-ember-700" />
                <p className="text-[13.5px]">
                  {freeShip ? (
                    <b className="text-moss-700">Ücretsiz kargo</b>
                  ) : (
                    <>
                      <b>{tl(settings.freeShippingThreshold)}</b> ve üzeri siparişlerde kargo ücretsiz
                    </>
                  )}
                  <span className="block text-char-500">Yurtiçi Kargo · Aras Kargo</span>
                </p>
              </div>
              <div className="flex gap-3 p-4">
                <Store size={20} className="mt-0.5 shrink-0 text-ember-700" />
                <p className="text-[13.5px]">
                  <b>Bilecik mağazasından ücretsiz teslim al</b>
                  <span className="block text-char-500">{variant.available ? 'Mağaza stoğunda var · 2 saatte hazır' : 'Mağazada şu an yok'}</span>
                </p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-line text-center text-[11.5px] text-char-600">
                {[
                  [RotateCcw, '14 gün iade'],
                  [ShieldCheck, 'Orijinal ürün'],
                  [PackageCheck, 'Özenli paketleme'],
                ].map(([Icon, label]) => (
                  <div key={label} className="flex flex-col items-center gap-1 px-2 py-3">
                    <Icon size={17} className="text-char-400" />
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="mt-12 md:mt-16">
          <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line">
            {[
              ['aciklama', 'Ürün açıklaması'],
              ['taksit', 'Taksit seçenekleri'],
              ['kargo', 'Kargo ve iade'],
              ['yorum', `Değerlendirmeler (${product.reviewCount})`],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`shrink-0 border-b-2 px-4 py-3 text-[14px] font-semibold transition ${tab === id ? 'border-ember text-char-900' : 'border-transparent text-char-400 hover:text-char-800'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="py-6 md:py-8">
            {tab === 'aciklama' &&
              (!details ? (
                <div className="space-y-3">
                  {[90, 75, 82].map((w) => (
                    <div key={w} className="skeleton h-4 rounded" style={{ width: `${w}%` }} />
                  ))}
                </div>
              ) : (
                <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
                  <div className="space-y-3 text-[15px] leading-7 text-char-700">
                    {details.desc.length ? details.desc.map((p, k) => <p key={k}>{p}</p>) : <p>{product.title}.</p>}
                  </div>
                  {details.features.length > 0 && (
                    <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
                      <p className="mb-3 text-xs font-bold tracking-[0.14em] text-char-500 uppercase">Öne çıkan özellikler</p>
                      <ul className="space-y-2.5">
                        {details.features.map((f, k) => (
                          <li key={k} className="flex gap-2.5 text-[14px] text-char-700">
                            <Check size={16} className="mt-0.5 shrink-0 text-moss-600" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            {tab === 'taksit' && <InstallmentTable price={price} />}
            {tab === 'kargo' && (
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ['Aynı gün kargo', `Hafta içi ve Cumartesi saat ${settings.sameDayCutoff}:00’e kadar verilen siparişler aynı gün kargoya teslim edilir. Takip numarası SMS ile gelir.`],
                  ['Ücretsiz kargo', `${tl(settings.freeShippingThreshold)} ve üzeri siparişlerde kargo ücretsizdir. Altındaki siparişlerde kargo ücreti ${tl(settings.shippingFee)}.`],
                  ['14 gün koşulsuz iade', 'Kullanılmamış ürünü 14 gün içinde iade edebilirsiniz. İade kodunu sipariş takip sayfasından alırsınız, kargo bizden.'],
                ].map(([t, d]) => (
                  <div key={t} className="rounded-2xl bg-white p-5 ring-1 ring-line">
                    <p className="font-semibold">{t}</p>
                    <p className="mt-1.5 text-sm leading-6 text-char-600">{d}</p>
                  </div>
                ))}
              </div>
            )}
            {tab === 'yorum' && <Reviews product={product} />}
          </div>
        </div>
      </div>

      {complements.length > 0 && (
        <section className="shell pt-6">
          <h2 className="display mb-5 text-[1.9rem] md:text-[2.3rem]">Yanına iyi gider</h2>
          <Rail products={complements} />
        </section>
      )}
      {similar.length > 0 && (
        <section className="shell pt-14">
          <h2 className="display mb-5 text-[1.9rem] md:text-[2.3rem]">Benzer ürünler</h2>
          <Rail products={similar} />
        </section>
      )}

      {/* Mobil yapışkan satın alma çubuğu */}
      {variant.available && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-line bg-white/95 px-4 pt-3 pb-safe backdrop-blur lg:hidden">
          <div className="min-w-0 flex-1">
            {compare && <p className="tnum text-[11px] text-char-400 line-through">{tl(compare)}</p>}
            <p className="tnum text-lg leading-tight font-bold">{tl(price)}</p>
          </div>
          <button onClick={() => add(product, variant, qty)} className="btn btn-primary flex-[1.4]">
            <ShoppingBag size={17} /> Sepete ekle
          </button>
        </div>
      )}
    </div>
  )
}
