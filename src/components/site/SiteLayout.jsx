import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Heart,
  Instagram,
  LayoutDashboard,
  MapPin,
  Menu,
  PackageSearch,
  Phone,
  ShoppingBag,
  Youtube,
  X,
} from 'lucide-react'
import { BRAND } from '../../config/brand'
import { CATEGORIES, SERIES } from '../../data/categories'
import { BRANDS, img, inCategory } from '../../data/catalog'
import { useCart } from '../../store/CartContext'
import { useStore } from '../../store/StoreContext'
import { tl } from '../../lib/format'
import { Drawer, ProductImg } from '../ui/Bits'
import SearchBox from './SearchBox'
import CartDrawer from './CartDrawer'

function WhatsAppIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.2-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3ZM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8Zm0-21.6A11.8 11.8 0 0 0 1.9 17.9L.2 24l6.3-1.7A11.8 11.8 0 1 0 12 .2Z" />
    </svg>
  )
}
export { WhatsAppIcon }

function AnnouncementBar() {
  const [i, setI] = useState(0)
  const n = BRAND.announcements.length
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % n), 4500)
    return () => clearInterval(t)
  }, [n])
  return (
    <div className="bg-char-900 text-[12.5px] text-white/85">
      <div className="shell flex h-9 items-center justify-between gap-4">
        <a href={`tel:${BRAND.phoneHref}`} className="hidden items-center gap-1.5 hover:text-white lg:flex">
          <Phone size={13} /> {BRAND.phone}
        </a>
        <div className="flex flex-1 items-center justify-center gap-2 lg:flex-none">
          <button onClick={() => setI((i - 1 + n) % n)} aria-label="Önceki duyuru" className="p-1 text-white/50 hover:text-white">
            <ChevronLeft size={14} />
          </button>
          <p key={i} className="min-w-0 animate-fade truncate text-center font-medium sm:min-w-[22rem]">
            {BRAND.announcements[i]}
          </p>
          <button onClick={() => setI((i + 1) % n)} aria-label="Sonraki duyuru" className="p-1 text-white/50 hover:text-white">
            <ChevronRight size={14} />
          </button>
        </div>
        <nav className="hidden items-center gap-5 lg:flex">
          <Link to="/siparis-takip" className="hover:text-white">Sipariş takibi</Link>
          <Link to="/bayilik" className="hover:text-white">Bayilik & toptan</Link>
          <Link to="/magaza" className="hover:text-white">Mağazamız</Link>
        </nav>
      </div>
    </div>
  )
}

function MegaMenu({ cat, onClose }) {
  const { shopProducts } = useStore()
  const featured = useMemo(
    () =>
      shopProducts
        .filter((p) => p.available && inCategory(p, cat.slug))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 2),
    [shopProducts, cat.slug],
  )
  const brands = useMemo(() => {
    const counts = {}
    shopProducts.forEach((p) => {
      if (inCategory(p, cat.slug)) counts[p.brandSlug] = (counts[p.brandSlug] ?? 0) + 1
    })
    return BRANDS.filter((b) => counts[b.slug]).sort((a, b) => counts[b.slug] - counts[a.slug]).slice(0, 8)
  }, [shopProducts, cat.slug])
  return (
    <div className="absolute top-full right-0 left-0 z-40 animate-fade border-t border-line bg-white card-lift-lg">
      <div className="shell grid grid-cols-12 gap-8 py-8">
        <div className="col-span-3">
          <p className="eyebrow mb-3">{cat.name}</p>
          <ul className="space-y-1.5">
            {cat.children.map((c) => (
              <li key={c.slug}>
                <Link to={`/kategori/${c.slug}`} onClick={onClose} className="text-[14px] text-char-700 hover:text-ember-700">
                  {c.name}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link to={`/kategori/${cat.slug}`} onClick={onClose} className="text-[13px] font-semibold text-char-900 underline decoration-ember decoration-2 underline-offset-4">
                Tümünü gör
              </Link>
            </li>
          </ul>
        </div>
        <div className="col-span-3">
          <p className="eyebrow mb-3">Markalar</p>
          <ul className="grid grid-cols-1 gap-1.5">
            {brands.map((b) => (
              <li key={b.slug}>
                <Link to={`/marka/${b.slug}`} onClick={onClose} className="text-[14px] text-char-700 hover:text-ember-700">
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="col-span-6 grid grid-cols-2 gap-4">
          {featured.map((p) => (
            <Link key={p.handle} to={`/urun/${p.handle}`} onClick={onClose} className="group flex gap-3 rounded-xl bg-bone p-3 hover:bg-mist">
              <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-white">
                <ProductImg path={p.images[0]} widths={[200, 200]} sizes="96px" alt="" className="absolute inset-0 h-full w-full p-2" />
              </div>
              <div className="flex min-w-0 flex-col py-1">
                <span className="text-[11px] font-semibold tracking-wider text-char-400 uppercase">Çok satan</span>
                <span className="mt-1 line-clamp-3 text-[13.5px] font-medium text-char-800 group-hover:underline">{p.title}</span>
                <span className="tnum mt-auto text-sm font-bold">{tl(p.price)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function Header({ onMenu }) {
  const { count, totals, openDrawer, favorites } = useCart()
  const [mega, setMega] = useState(null)
  const timer = useRef(null)
  const loc = useLocation()
  useEffect(() => setMega(null), [loc.pathname, loc.search])

  const enter = (slug) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMega(slug), 120)
  }
  const leave = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setMega(null), 150)
  }
  const megaCat = CATEGORIES.find((c) => c.slug === mega)

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90" onMouseLeave={leave}>
      <div className="shell flex h-16 items-center gap-3 md:h-[4.5rem] md:gap-6">
        <button onClick={onMenu} className="-ml-2 rounded-lg p-2 text-char-800 lg:hidden" aria-label="Menü">
          <Menu size={22} />
        </button>
        <Link to="/" className="shrink-0" aria-label={`${BRAND.name} ana sayfa`}>
          <img src={BRAND.logo} alt={BRAND.name} className="h-8 w-auto md:h-10" width="376" height="96" />
        </Link>
        <SearchBox className="mx-auto hidden max-w-2xl flex-1 md:block" />
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Link to="/siparis-takip" className="hidden flex-col items-center rounded-lg px-2.5 py-1.5 text-char-700 hover:bg-mist lg:flex">
            <PackageSearch size={20} />
            <span className="mt-0.5 text-[11px] font-medium">Siparişim</span>
          </Link>
          <Link to="/favoriler" className="relative flex flex-col items-center rounded-lg px-2.5 py-1.5 text-char-700 hover:bg-mist">
            <Heart size={20} />
            <span className="mt-0.5 hidden text-[11px] font-medium lg:block">Favoriler</span>
            {favorites.length > 0 && (
              <span className="tnum absolute top-0.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-char-900 px-1 text-[10px] font-bold text-white">{favorites.length}</span>
            )}
          </Link>
          <button onClick={openDrawer} className="relative flex items-center gap-2.5 rounded-xl py-1.5 pr-1.5 pl-2.5 text-char-800 hover:bg-mist md:bg-char-900 md:pr-3.5 md:pl-3 md:text-white md:hover:bg-char-700">
            <span className="relative">
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="tnum absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-char-950">{count}</span>
              )}
            </span>
            <span className="hidden text-left leading-tight md:block">
              <span className="block text-[11px] text-white/60">Sepetim</span>
              <span className="tnum block text-[13px] font-semibold">{tl(totals.goods)}</span>
            </span>
          </button>
        </div>
      </div>
      <div className="shell pb-3 md:hidden">
        <SearchBox />
      </div>
      <nav className="relative hidden border-t border-line lg:block">
        <div className="shell flex h-12 items-center gap-1">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to={`/kategori/${c.slug}`}
              onMouseEnter={() => enter(c.slug)}
              className={`flex h-full items-center gap-1 px-2 text-[13px] font-medium whitespace-nowrap transition-colors 2xl:px-3 2xl:text-[13.5px] ${mega === c.slug ? 'text-ember-700' : 'text-char-700 hover:text-char-950'}`}
            >
              {c.name}
              <ChevronDown size={13} className={`transition-transform ${mega === c.slug ? 'rotate-180' : ''}`} />
            </Link>
          ))}
          <span className="mx-1 h-5 w-px shrink-0 bg-line xl:mx-2" />
          <Link to="/firsatlar" onMouseEnter={leave} className="flex h-full items-center px-2 text-[13.5px] font-semibold whitespace-nowrap text-flame hover:underline 2xl:px-3">
            Fırsatlar
          </Link>
          <Link to="/seri/pro" onMouseEnter={leave} className="hidden h-full items-center px-3 text-[13.5px] font-semibold whitespace-nowrap text-char-900 2xl:flex">
            EgeCamp®
          </Link>
        </div>
        {megaCat && (
          <div onMouseEnter={() => clearTimeout(timer.current)}>
            <MegaMenu cat={megaCat} onClose={() => setMega(null)} />
          </div>
        )}
      </nav>
    </header>
  )
}

function MobileMenu({ open, onClose }) {
  const [openCat, setOpenCat] = useState(null)
  return (
    <Drawer open={open} onClose={onClose} side="left" width="max-w-[22rem]" label="Menü">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <img src={BRAND.logo} alt={BRAND.name} className="h-8 w-auto" />
        <button onClick={onClose} className="rounded-lg p-2 text-char-500 hover:bg-mist" aria-label="Kapat">
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <Link to="/firsatlar" onClick={onClose} className="flex items-center justify-between rounded-lg px-3 py-3 text-[15px] font-semibold text-flame">
          Fırsatlar
        </Link>
        {CATEGORIES.map((c) => (
          <div key={c.slug} className="border-b border-line/70">
            <button onClick={() => setOpenCat(openCat === c.slug ? null : c.slug)} className="flex w-full items-center justify-between px-3 py-3 text-left text-[15px] font-medium text-char-800">
              {c.name}
              <ChevronDown size={16} className={`text-char-400 transition-transform ${openCat === c.slug ? 'rotate-180' : ''}`} />
            </button>
            {openCat === c.slug && (
              <ul className="animate-fade pb-2 pl-3">
                <li>
                  <Link to={`/kategori/${c.slug}`} onClick={onClose} className="block px-3 py-2 text-sm font-semibold text-char-900">
                    Tümü
                  </Link>
                </li>
                {c.children.map((s) => (
                  <li key={s.slug}>
                    <Link to={`/kategori/${s.slug}`} onClick={onClose} className="block px-3 py-2 text-sm text-char-600">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        <div className="mt-3 space-y-0.5">
          {SERIES.map((s) => (
            <Link key={s.slug} to={`/seri/${s.slug}`} onClick={onClose} className="block rounded-lg px-3 py-2 text-sm text-char-700 hover:bg-mist">
              {s.name}
            </Link>
          ))}
        </div>
        <div className="mt-3 space-y-0.5 border-t border-line pt-3">
          {[
            ['/siparis-takip', 'Sipariş takibi'],
            ['/favoriler', 'Favorilerim'],
            ['/bayilik', 'Bayilik & toptan satış'],
            ['/magaza', 'Mağazamız & iletişim'],
            ['/yardim', 'Kargo, iade ve SSS'],
          ].map(([to, label]) => (
            <Link key={to} to={to} onClick={onClose} className="block rounded-lg px-3 py-2 text-sm text-char-700 hover:bg-mist">
              {label}
            </Link>
          ))}
        </div>
      </nav>
      <div className="border-t border-line bg-bone p-4 pb-safe text-sm">
        <a href={`tel:${BRAND.phoneHref}`} className="flex items-center gap-2 font-semibold">
          <Phone size={15} /> {BRAND.phone}
        </a>
        <p className="mt-1 text-xs text-char-500">Pzt–Cmt 10:00–20:00 · Paz 10:00–16:00</p>
      </div>
    </Drawer>
  )
}

function Footer() {
  return (
    <footer className="topo relative mt-20 bg-char-900 text-white/75">
      <div className="shell grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <img src={BRAND.logo} alt={BRAND.name} className="h-10 w-auto brightness-0 invert" />
          <p className="mt-4 max-w-sm text-sm leading-6">
            Kamp, outdoor ve av ekipmanları. 40’tan fazla marka ve kendi tasarımımız EgeCamp® serileri — Bilecik’teki mağazamızdan Türkiye’nin her yerine.
          </p>
          <div className="mt-5 flex gap-2">
            {[
              [BRAND.instagramUrl, Instagram, 'Instagram'],
              [BRAND.facebookUrl, Facebook, 'Facebook'],
              [BRAND.youtubeUrl, Youtube, 'YouTube'],
            ].map(([href, Icon, label]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white hover:bg-ember hover:text-char-950">
                <Icon size={17} />
              </a>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          <p className="mb-3 text-xs font-bold tracking-[0.16em] text-white uppercase">Kategoriler</p>
          <ul className="space-y-2 text-sm">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link to={`/kategori/${c.slug}`} className="hover:text-ember-300">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-2">
          <p className="mb-3 text-xs font-bold tracking-[0.16em] text-white uppercase">Yardım</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/siparis-takip" className="hover:text-ember-300">Sipariş takibi</Link></li>
            <li><Link to="/yardim" className="hover:text-ember-300">Kargo ve teslimat</Link></li>
            <li><Link to="/yardim" className="hover:text-ember-300">İade ve değişim</Link></li>
            <li><Link to="/yardim" className="hover:text-ember-300">Taksit seçenekleri</Link></li>
            <li><Link to="/bayilik" className="hover:text-ember-300">Bayilik & toptan</Link></li>
            <li><Link to="/magaza" className="hover:text-ember-300">İletişim</Link></li>
          </ul>
        </div>
        <div className="lg:col-span-4">
          <p className="mb-3 text-xs font-bold tracking-[0.16em] text-white uppercase">Mağazamız</p>
          <p className="flex gap-2 text-sm leading-6">
            <MapPin size={16} className="mt-1 shrink-0 text-ember" />
            <span>
              {BRAND.addressLines[0]}
              <br />
              {BRAND.addressLines[1]}
            </span>
          </p>
          <a href={`tel:${BRAND.phoneHref}`} className="mt-2 flex items-center gap-2 text-sm text-white hover:text-ember-300">
            <Phone size={15} className="text-ember" /> {BRAND.phone}
          </a>
          <dl className="mt-3 space-y-0.5 text-sm">
            {BRAND.hours.map(([d, h]) => (
              <div key={d} className="flex justify-between gap-4 border-b border-white/8 py-1">
                <dt>{d}</dt>
                <dd className="tnum text-white">{h}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="shell flex flex-col items-center justify-between gap-3 py-5 text-xs text-white/50 md:flex-row">
          <p>© 2026 {BRAND.name} · Bu site bir tanıtım demosudur; ödeme alınmaz.</p>
          <div className="flex items-center gap-2">
            {['VISA', 'Mastercard', 'TROY', 'iyzico'].map((x) => (
              <span key={x} className="rounded border border-white/15 px-2 py-0.5 text-[10.5px] font-semibold tracking-wide text-white/70">
                {x}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function SiteLayout() {
  const [menu, setMenu] = useState(false)
  const loc = useLocation()
  // Ürün sayfasında mobil satın alma çubuğu altta — yüzen düğmeler üstüne çıkar
  const lift = loc.pathname.startsWith("/urun/") ? "bottom-[5.5rem]" : "bottom-4"
  useEffect(() => setMenu(false), [loc.pathname])
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Header onMenu={() => setMenu(true)} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MobileMenu open={menu} onClose={() => setMenu(false)} />
      <CartDrawer />

      <a
        href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent('Merhaba, sitenizden bir ürün hakkında bilgi almak istiyorum.')}`}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp ile yazın"
        className={`fixed right-4 ${lift} z-40 flex h-13 w-13 items-center justify-center rounded-full bg-[#25d366] text-white card-lift-lg transition-transform hover:scale-105 md:right-6 md:bottom-6`}
      >
        <WhatsAppIcon size={26} />
      </a>

      <Link
        to="/yonetim"
        aria-label="Yönetim paneli (demo)"
        className={`fixed ${lift} left-4 z-40 flex items-center gap-2 rounded-full bg-char-900/92 p-2 sm:pr-4 text-[12.5px] font-medium text-white card-lift-lg backdrop-blur hover:bg-char-800 md:bottom-6 md:left-6`}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ember text-char-950">
          <LayoutDashboard size={14} />
        </span>
        <span className="hidden sm:inline">Demo · Yönetim paneli</span>
      </Link>
    </div>
  )
}

export const categoryImage = (slug, w = 800) => (BRAND.categoryImages[slug] ? img(BRAND.categoryImages[slug], w) : null)
