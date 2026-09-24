/**
 * Mağaza durumu — vitrin ve panelin ortak kaynağı.
 *
 * Panelde yapılan her değişiklik (fiyat, stok, kampanya, sipariş durumu)
 * tarayıcıya kaydedilir ve aynı anda vitrine yansır. Vitrinden verilen sipariş
 * de panelin sipariş listesine düşer ve stoktan düşülür. Sunumda en etkili an:
 * telefondan sipariş ver, bilgisayarda panele düştüğünü göster.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { BASE_PRODUCTS } from '../data/catalog'
import { BASE_STOCK, ORDERS_DESC, DEALER_APPLICATIONS, NOW } from '../data/generate'
import { DEFAULT_CAMPAIGNS, DEFAULT_COUPONS, DEFAULT_SETTINGS } from '../lib/pricing'
import { DEFAULT_PLAN, planById } from '../config/modules'
import { BRAND } from '../config/brand'

const PREFIX = 'egecamp-demo-v1:'

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}
export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    /* gizli sekme vb. — sessizce geç */
  }
}
export function clearAll() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* yok say */
  }
}

function usePersisted(key, initial) {
  const [value, setValue] = useState(() => load(key, typeof initial === 'function' ? initial() : initial))
  useEffect(() => save(key, value), [key, value])
  return [value, setValue]
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [overrides, setOverrides] = usePersisted('overrides', {})
  const [stockPatch, setStockPatch] = usePersisted('stock', {})
  const [campaigns, setCampaigns] = usePersisted('campaigns', DEFAULT_CAMPAIGNS)
  const [coupons, setCoupons] = usePersisted('coupons', DEFAULT_COUPONS)
  const [settings, setSettings] = usePersisted('settings', DEFAULT_SETTINGS)
  const [placed, setPlaced] = usePersisted('placed', [])
  const [orderPatch, setOrderPatch] = usePersisted('orderPatch', {})
  const [dealerApps, setDealerApps] = usePersisted('dealerApps', [])
  const [dealerDecisions, setDealerDecisions] = usePersisted('dealerDecisions', {})
  const [returnPatch, setReturnPatch] = usePersisted('returnPatch', {})
  const [planId, setPlanId] = usePersisted('plan', DEFAULT_PLAN)
  const [authed, setAuthed] = usePersisted('auth', false)
  const [activity, setActivity] = usePersisted('activity', [])

  // Başka sekmede yapılan değişikliği yakala (telefon/bilgisayar değil ama iki sekme sunumu)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key?.startsWith(PREFIX) && !e.key.startsWith(`${PREFIX}shop:`)) window.location.reload()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const stock = useMemo(() => ({ ...BASE_STOCK, ...stockPatch }), [stockPatch])

  /** Panel değişiklikleri bindirilmiş ürün listesi */
  const products = useMemo(
    () =>
      BASE_PRODUCTS.map((p) => {
        const o = overrides[p.handle]
        const variants = p.variants.map((v) => {
          const vo = o?.variants?.[v.id]
          const price = vo?.price ?? (o?.price != null && !p.hasVariants ? o.price : v.price)
          const compare = vo?.compare !== undefined ? vo.compare : o?.compare !== undefined && !p.hasVariants ? o.compare : v.compare
          const qty = stock[v.id] ?? 0
          return { ...v, price, compare, stock: qty, available: qty > 0 }
        })
        const cheapest = variants.reduce((a, b) => (b.available && (!a.available || b.price < a.price) ? b : a), variants[0])
        const totalStock = variants.reduce((s, v) => s + v.stock, 0)
        return {
          ...p,
          title: o?.title ?? p.title,
          variants,
          price: cheapest.price,
          compare: cheapest.compare,
          stock: totalStock,
          available: totalStock > 0,
          active: o?.active ?? true,
          edited: !!o,
        }
      }),
    [overrides, stock],
  )
  const byHandle = useMemo(() => Object.fromEntries(products.map((p) => [p.handle, p])), [products])
  const shopProducts = useMemo(() => products.filter((p) => p.active), [products])

  /** Tüm siparişler — yeniden eskiye, panel düzenlemeleri uygulanmış */
  const orders = useMemo(() => {
    const all = [...placed.map((o) => ({ ...o, date: new Date(o.ts), placedHere: true })), ...ORDERS_DESC]
    return all.map((o) => (orderPatch[o.no] ? { ...o, ...orderPatch[o.no] } : o))
  }, [placed, orderPatch])

  const logActivity = useCallback(
    (text, kind = 'info') => setActivity((a) => [{ id: Date.now() + Math.random(), text, kind, ts: Date.now() }, ...a].slice(0, 40)),
    [setActivity],
  )

  /* ---------------------------------------------------------- ürün işlemleri */

  const updateProduct = useCallback(
    (handle, patch) => setOverrides((all) => ({ ...all, [handle]: { ...all[handle], ...patch } })),
    [setOverrides],
  )
  const updateVariant = useCallback(
    (handle, variantId, patch) =>
      setOverrides((all) => {
        const cur = all[handle] ?? {}
        return { ...all, [handle]: { ...cur, variants: { ...cur.variants, [variantId]: { ...cur.variants?.[variantId], ...patch } } } }
      }),
    [setOverrides],
  )
  const setStock = useCallback((variantId, qty) => setStockPatch((s) => ({ ...s, [variantId]: Math.max(0, Math.round(qty)) })), [setStockPatch])

  /** Toplu fiyat: [{handle, variantId?, price, compare}] */
  const bulkPrice = useCallback(
    (changes) =>
      setOverrides((all) => {
        const next = { ...all }
        for (const c of changes) {
          const cur = next[c.handle] ?? {}
          next[c.handle] = { ...cur, variants: { ...cur.variants, [c.variantId]: { ...cur.variants?.[c.variantId], price: c.price, compare: c.compare } } }
        }
        return next
      }),
    [setOverrides],
  )

  /* ---------------------------------------------------------- sipariş işlemleri */

  // Vitrinden verilen siparişler ayrı numara aralığında: üretilen günlük siparişlerle çakışmaz
  const lastSeq = useMemo(() => Math.max(30000, ...placed.map((o) => o.seq)), [placed])

  const placeOrder = useCallback(
    (draft) => {
      const seq = lastSeq + 1
      const order = { ...draft, no: `${BRAND.orderPrefix}-${seq}`, seq, ts: Date.now(), status: 'yeni', placedHere: true }
      setPlaced((p) => [order, ...p])
      // stoktan düş
      setStockPatch((s) => {
        const next = { ...s }
        for (const i of draft.items) next[i.variantId] = Math.max(0, (next[i.variantId] ?? BASE_STOCK[i.variantId] ?? 0) - i.qty)
        return next
      })
      if (draft.coupon) setCoupons((cs) => cs.map((c) => (c.code === draft.coupon ? { ...c, used: c.used + 1 } : c)))
      logActivity(`Yeni sipariş ${order.no} — ${draft.customer.name}`, 'order')
      return order
    },
    [lastSeq, setPlaced, setStockPatch, setCoupons, logActivity],
  )

  const patchOrder = useCallback(
    (no, patch, note) => {
      setOrderPatch((all) => {
        const cur = all[no] ?? {}
        const history = note ? [...(cur.history ?? []), { ts: Date.now(), text: note }] : cur.history
        return { ...all, [no]: { ...cur, ...patch, ...(history ? { history } : {}) } }
      })
      if (note) logActivity(`${no}: ${note}`, 'order')
    },
    [setOrderPatch, logActivity],
  )

  /* ---------------------------------------------------------- bayi */

  const allDealerApps = useMemo(
    () => [...dealerApps, ...DEALER_APPLICATIONS].map((a) => ({ ...a, decision: dealerDecisions[a.id] ?? null })),
    [dealerApps, dealerDecisions],
  )
  const submitDealerApp = useCallback(
    (app) => {
      const id = `BB-${42 + dealerApps.length}`
      setDealerApps((a) => [{ ...app, id, ts: Date.now() }, ...a])
      logActivity(`Bayilik başvurusu: ${app.company}`, 'dealer')
      return id
    },
    [dealerApps.length, setDealerApps, logActivity],
  )

  /* ---------------------------------------------------------- paket */

  const plan = planById(planId)
  const hasModule = useCallback((id) => plan.modules.includes(id), [plan])

  const value = {
    now: NOW,
    products,
    shopProducts,
    byHandle,
    stock,
    setStock,
    updateProduct,
    updateVariant,
    bulkPrice,
    overrides,
    campaigns,
    setCampaigns,
    coupons,
    setCoupons,
    settings,
    setSettings,
    orders,
    placed,
    placeOrder,
    patchOrder,
    dealerApps: allDealerApps,
    submitDealerApp,
    decideDealer: (id, decision) => setDealerDecisions((d) => ({ ...d, [id]: decision })),
    returnPatch,
    patchReturn: (id, patch) => setReturnPatch((r) => ({ ...r, [id]: { ...r[id], ...patch } })),
    plan,
    setPlanId,
    hasModule,
    authed,
    setAuthed,
    activity,
    logActivity,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)
