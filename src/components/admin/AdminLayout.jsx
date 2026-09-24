import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BadgePercent,
  BarChart3,
  Bell,
  Boxes,
  ExternalLink,
  Handshake,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Package,
  Puzzle,
  RotateCcw,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Users,
  X,
} from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { BRAND } from '../../config/brand'
import { ago, dateShort, dayName, fold } from '../../lib/format'
import { ToastProvider } from './AdminUI'

const NAV = [
  { group: null, items: [{ to: '/yonetim', label: 'Genel bakış', icon: LayoutDashboard, end: true }] },
  {
    group: 'Satış',
    items: [
      { to: '/yonetim/siparisler', label: 'Siparişler', icon: ShoppingBag, module: 'orders', badge: 'orders' },
      { to: '/yonetim/iadeler', label: 'İadeler', icon: RotateCcw, module: 'returns' },
    ],
  },
  {
    group: 'Katalog',
    items: [
      { to: '/yonetim/urunler', label: 'Ürünler', icon: Package, module: 'catalog' },
      { to: '/yonetim/stok', label: 'Stok', icon: Boxes, module: 'inventory', badge: 'stock' },
    ],
  },
  {
    group: 'Pazarlama',
    items: [
      { to: '/yonetim/kampanyalar', label: 'Kampanyalar', icon: BadgePercent, module: 'campaigns' },
      { to: '/yonetim/musteriler', label: 'Müşteriler', icon: Users, module: 'customers' },
    ],
  },
  {
    group: 'Büyüme',
    items: [
      { to: '/yonetim/raporlar', label: 'Raporlar', icon: BarChart3, module: 'reports' },
      { to: '/yonetim/bayiler', label: 'Bayiler', icon: Handshake, module: 'dealers', badge: 'dealers' },
      { to: '/yonetim/pazaryerleri', label: 'Pazaryerleri', icon: Store, module: 'marketplace' },
    ],
  },
  {
    group: 'Sistem',
    items: [
      { to: '/yonetim/moduller', label: 'Modüller ve paket', icon: Puzzle },
      { to: '/yonetim/ayarlar', label: 'Ayarlar', icon: Settings },
    ],
  },
]

function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="8" fill="#F79400" />
        <path d="M16 8.5 7.8 24h3.6L16 15.2 20.6 24h3.6Z" fill="#171B18" />
      </svg>
      <div className="leading-tight">
        <p className="text-[15px] font-bold tracking-tight text-white">EgeCamp</p>
        <p className="text-[11px] text-white/45">Yönetim paneli</p>
      </div>
    </div>
  )
}

function Sidebar({ onNavigate }) {
  const { hasModule, orders, products, dealerApps, plan, settings } = useStore()
  const badges = useMemo(
    () => ({
      orders: orders.filter((o) => o.status === 'yeni').length,
      stock: products.filter((p) => p.available && p.variants.some((v) => v.stock > 0 && v.stock <= settings.lowStockThreshold)).length,
      dealers: dealerApps.filter((a) => !a.decision).length,
    }),
    [orders, products, dealerApps, settings.lowStockThreshold],
  )
  return (
    <div className="flex h-full flex-col bg-char-900 text-white/70">
      <div className="flex h-16 items-center px-5">
        <LogoMark />
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {NAV.map((g) => (
          <div key={g.group ?? 'root'}>
            {g.group && <p className="mb-1.5 px-3 text-[10.5px] font-bold tracking-[0.16em] text-white/30 uppercase">{g.group}</p>}
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const locked = it.module && !hasModule(it.module)
                const badge = it.badge ? badges[it.badge] : 0
                return (
                  <li key={it.to}>
                    <NavLink
                      to={it.to}
                      end={it.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <it.icon size={17} className={isActive ? 'text-ember' : 'text-white/40 group-hover:text-white/70'} />
                          <span className={`flex-1 ${locked ? 'text-white/40' : ''}`}>{it.label}</span>
                          {locked ? (
                            <Lock size={13} className="text-white/30" />
                          ) : (
                            badge > 0 && <span className="tnum rounded-full bg-ember px-1.5 text-[11px] font-bold text-char-950">{badge}</span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="m-3 rounded-xl bg-white/5 p-3.5">
        <p className="text-[11px] text-white/40">Mevcut paket</p>
        <p className="mt-0.5 text-sm font-semibold text-white">{plan.name}</p>
        <Link to="/yonetim/moduller" onClick={onNavigate} className="mt-2 inline-flex text-[12px] font-semibold text-ember hover:underline">
          Paketleri karşılaştır →
        </Link>
      </div>
    </div>
  )
}

function GlobalSearch() {
  const { orders, products } = useStore()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useRef(null)
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const res = useMemo(() => {
    const f = fold(q.trim())
    if (f.length < 2) return null
    return {
      orders: orders.filter((o) => fold(o.no).includes(f) || fold(o.customer.name).includes(f)).slice(0, 5),
      products: products.filter((p) => p.search.includes(f) || fold(p.sku).includes(f)).slice(0, 5),
    }
  }, [q, orders, products])
  const go = (to) => {
    setOpen(false)
    setQ('')
    navigate(to)
  }
  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-char-400" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Sipariş no, müşteri, ürün veya stok kodu…"
        className="h-10 w-full rounded-lg bg-mist pr-3 pl-9 text-[13.5px] placeholder:text-char-400 focus:bg-white focus:ring-2 focus:ring-ember/30 focus:outline-none"
      />
      {open && res && (
        <div className="absolute top-full right-0 left-0 z-50 mt-1.5 animate-pop overflow-hidden rounded-xl bg-white ring-1 ring-line card-lift-lg">
          {!res.orders.length && !res.products.length && <p className="p-4 text-sm text-char-500">Sonuç yok</p>}
          {res.orders.length > 0 && (
            <div className="border-b border-line p-1.5">
              <p className="px-2.5 py-1 text-[11px] font-bold tracking-wider text-char-400 uppercase">Siparişler</p>
              {res.orders.map((o) => (
                <button key={o.no} onClick={() => go(`/yonetim/siparisler/${o.no}`)} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-bone">
                  <span>
                    <b className="tnum">{o.no}</b> · {o.customer.name}
                  </span>
                  <span className="text-xs text-char-400">{dateShort(o.ts)}</span>
                </button>
              ))}
            </div>
          )}
          {res.products.length > 0 && (
            <div className="p-1.5">
              <p className="px-2.5 py-1 text-[11px] font-bold tracking-wider text-char-400 uppercase">Ürünler</p>
              {res.products.map((p) => (
                <button key={p.handle} onClick={() => go(`/yonetim/urunler/${p.handle}`)} className="flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-bone">
                  <span className="truncate">{p.title}</span>
                  <span className="tnum shrink-0 text-xs text-char-400">{p.sku}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Notifications() {
  const { orders, products, dealerApps, activity, settings } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const items = useMemo(() => {
    const list = []
    orders
      .filter((o) => o.status === 'yeni')
      .slice(0, 4)
      .forEach((o) => list.push({ to: `/yonetim/siparisler/${o.no}`, text: `Yeni sipariş ${o.no} — ${o.customer.name}`, ts: o.ts, kind: 'order' }))
    dealerApps
      .filter((a) => !a.decision)
      .slice(0, 2)
      .forEach((a) => list.push({ to: '/yonetim/bayiler', text: `Bayilik başvurusu: ${a.company}`, ts: a.ts, kind: 'dealer' }))
    const low = products.filter((p) => p.available && p.stock <= settings.lowStockThreshold).length
    if (low) list.push({ to: '/yonetim/stok', text: `${low} üründe stok kritik seviyede`, ts: Date.now() - 3600000, kind: 'stock' })
    activity.slice(0, 3).forEach((a) => list.push({ to: null, text: a.text, ts: a.ts, kind: 'act' }))
    return list.sort((a, b) => b.ts - a.ts).slice(0, 8)
  }, [orders, dealerApps, products, activity, settings.lowStockThreshold])
  const count = orders.filter((o) => o.status === 'yeni').length + dealerApps.filter((a) => !a.decision).length
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((x) => !x)} className="relative rounded-lg p-2 text-char-500 hover:bg-mist hover:text-char-900" aria-label="Bildirimler">
        <Bell size={19} />
        {count > 0 && <span className="tnum absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-flame px-1 text-[10px] font-bold text-white">{count}</span>}
      </button>
      {open && (
        <div className="absolute top-full right-0 z-50 mt-1.5 w-80 animate-pop overflow-hidden rounded-xl bg-white ring-1 ring-line card-lift-lg">
          <p className="border-b border-line px-4 py-3 text-sm font-semibold">Bildirimler</p>
          <ul className="max-h-96 divide-y divide-line overflow-y-auto">
            {items.map((n, i) => (
              <li key={i}>
                {n.to ? (
                  <Link to={n.to} onClick={() => setOpen(false)} className="block px-4 py-3 text-[13px] hover:bg-bone">
                    {n.text}
                    <span className="mt-0.5 block text-[11.5px] text-char-400">{ago(n.ts)}</span>
                  </Link>
                ) : (
                  <p className="px-4 py-3 text-[13px] text-char-600">
                    {n.text}
                    <span className="mt-0.5 block text-[11.5px] text-char-400">{ago(n.ts)}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function AdminLayout() {
  const [mobile, setMobile] = useState(false)
  const { setAuthed } = useStore()
  const loc = useLocation()
  const navigate = useNavigate()
  useEffect(() => setMobile(false), [loc.pathname])
  const today = new Date()

  return (
    <ToastProvider>
      <div className="min-h-screen bg-bone">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 lg:block">
          <Sidebar />
        </aside>
        {mobile && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 animate-fade bg-char-950/50" onClick={() => setMobile(false)} />
            <aside className="absolute inset-y-0 left-0 w-64 animate-drawer-left">
              <Sidebar onNavigate={() => setMobile(false)} />
            </aside>
            <button onClick={() => setMobile(false)} className="absolute top-4 left-[16.5rem] rounded-full bg-white p-2" aria-label="Kapat">
              <X size={18} />
            </button>
          </div>
        )}

        <div className="lg:pl-60">
          <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 md:px-8">
              <button onClick={() => setMobile(true)} className="-ml-1 rounded-lg p-2 text-char-700 lg:hidden" aria-label="Menü">
                <Menu size={21} />
              </button>
              <div className="hidden flex-1 md:block">
                <GlobalSearch />
              </div>
              <p className="hidden text-[13px] text-char-400 xl:block">
                {dayName(today.getDay())}, {dateShort(today)}
              </p>
              <div className="ml-auto flex items-center gap-1 md:ml-0">
                <a href="/" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm hidden sm:inline-flex">
                  <ExternalLink size={14} /> Mağazayı gör
                </a>
                <Notifications />
                <div className="ml-1 flex items-center gap-2.5 border-l border-line pl-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ember text-[13px] font-bold text-char-950">EC</span>
                  <div className="hidden leading-tight md:block">
                    <p className="text-[13px] font-semibold">{BRAND.ownerShort}</p>
                    <p className="text-[11.5px] text-char-400">{BRAND.demoEmail}</p>
                  </div>
                  <button
                    onClick={() => {
                      setAuthed(false)
                      navigate('/yonetim/giris')
                    }}
                    className="rounded-lg p-2 text-char-400 hover:bg-mist hover:text-char-900"
                    aria-label="Çıkış"
                    title="Çıkış"
                  >
                    <LogOut size={17} />
                  </button>
                </div>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-[96rem] px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
