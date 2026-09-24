import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import SiteLayout from './components/site/SiteLayout'
import Home from './pages/Home'
import Collection from './pages/Collection'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Favorites from './pages/Favorites'
import NotFound from './pages/NotFound'
import { useStore } from './store/StoreContext'
import { moduleForPath } from './config/modules'

// Ödeme ve panel ayrı parçalarda: vitrin ziyaretçisi grafik kütüphanesini indirmez
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderConfirmed = lazy(() => import('./pages/OrderConfirmed'))
const OrderTrack = lazy(() => import('./pages/OrderTrack'))
const Dealer = lazy(() => import('./pages/Dealer'))
const StorePage = lazy(() => import('./pages/StorePage'))
const Help = lazy(() => import('./pages/Help'))

const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Orders = lazy(() => import('./pages/admin/Orders'))
const OrderDetail = lazy(() => import('./pages/admin/OrderDetail'))
const ProductsAdmin = lazy(() => import('./pages/admin/ProductsAdmin'))
const ProductEditor = lazy(() => import('./pages/admin/ProductEditor'))
const Inventory = lazy(() => import('./pages/admin/Inventory'))
const Campaigns = lazy(() => import('./pages/admin/Campaigns'))
const Customers = lazy(() => import('./pages/admin/Customers'))
const Returns = lazy(() => import('./pages/admin/Returns'))
const Reports = lazy(() => import('./pages/admin/Reports'))
const Dealers = lazy(() => import('./pages/admin/Dealers'))
const Marketplace = lazy(() => import('./pages/admin/Marketplace'))
const Modules = lazy(() => import('./pages/admin/Modules'))
const Settings = lazy(() => import('./pages/admin/Settings'))
const LockedModule = lazy(() => import('./components/admin/LockedModule'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone border-t-ember" />
    </div>
  )
}

function RequireAuth({ children }) {
  const { authed } = useStore()
  const loc = useLocation()
  if (!authed) return <Navigate to="/yonetim/giris" replace state={{ from: loc.pathname }} />
  return children
}

/** Pakette olmayan modül: sayfa yerine yükseltme ekranı */
function Gate({ children }) {
  const { hasModule } = useStore()
  const { pathname } = useLocation()
  const mod = moduleForPath(pathname)
  if (mod && !hasModule(mod.id)) return <LockedModule module={mod} />
  return children
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route index element={<Home />} />
            <Route path="urunler" element={<Collection mode="all" />} />
            <Route path="kategori/:slug" element={<Collection mode="category" />} />
            <Route path="marka/:slug" element={<Collection mode="brand" />} />
            <Route path="seri/:slug" element={<Collection mode="series" />} />
            <Route path="firsatlar" element={<Collection mode="sale" />} />
            <Route path="ara" element={<Collection mode="search" />} />
            <Route path="urun/:handle" element={<Product />} />
            <Route path="sepet" element={<Cart />} />
            <Route path="favoriler" element={<Favorites />} />
            <Route path="siparis-takip" element={<OrderTrack />} />
            <Route path="siparis/:no" element={<OrderConfirmed />} />
            <Route path="bayilik" element={<Dealer />} />
            <Route path="magaza" element={<StorePage />} />
            <Route path="yardim" element={<Help />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="odeme" element={<Checkout />} />

          <Route path="yonetim/giris" element={<AdminLogin />} />
          <Route
            path="yonetim"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="siparisler" element={<Gate><Orders /></Gate>} />
            <Route path="siparisler/:no" element={<Gate><OrderDetail /></Gate>} />
            <Route path="urunler" element={<Gate><ProductsAdmin /></Gate>} />
            <Route path="urunler/:handle" element={<Gate><ProductEditor /></Gate>} />
            <Route path="stok" element={<Gate><Inventory /></Gate>} />
            <Route path="kampanyalar" element={<Gate><Campaigns /></Gate>} />
            <Route path="musteriler" element={<Gate><Customers /></Gate>} />
            <Route path="iadeler" element={<Gate><Returns /></Gate>} />
            <Route path="raporlar" element={<Gate><Reports /></Gate>} />
            <Route path="bayiler" element={<Gate><Dealers /></Gate>} />
            <Route path="pazaryerleri" element={<Gate><Marketplace /></Gate>} />
            <Route path="moduller" element={<Modules />} />
            <Route path="ayarlar" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
