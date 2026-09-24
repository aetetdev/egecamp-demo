/**
 * Ziyaretçi tarafı durum: sepet, favoriler, son bakılanlar, kupon.
 * Sepet toplamı her zaman `computeCart` ile hesaplanır; kampanya panelden
 * değişirse sepet de anında değişir.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useStore, load, save } from './StoreContext'
import { computeCart } from '../lib/pricing'

const CartContext = createContext(null)

function usePersisted(key, initial) {
  const [value, setValue] = useState(() => load(`shop:${key}`, initial))
  useEffect(() => save(`shop:${key}`, value), [key, value])
  return [value, setValue]
}

export function CartProvider({ children }) {
  const { byHandle, campaigns, coupons, settings } = useStore()
  const [raw, setRaw] = usePersisted('cart', [])
  const [favorites, setFavorites] = usePersisted('favorites', [])
  const [recent, setRecent] = usePersisted('recent', [])
  const [couponCode, setCouponCode] = usePersisted('coupon', '')
  const [drawer, setDrawer] = useState(false)
  const [toast, setToast] = useState(null)

  /** Sepet satırları — ürün ve varyant çözülmüş, silinmiş ürünler ayıklanmış */
  const lines = useMemo(
    () =>
      raw
        .map((l) => {
          const product = byHandle[l.handle]
          const variant = product?.variants.find((v) => v.id === l.variantId)
          return product && variant ? { ...l, product, variant } : null
        })
        .filter(Boolean),
    [raw, byHandle],
  )

  const totals = useMemo(
    () => computeCart(lines, { campaigns, coupons, settings, couponCode }),
    [lines, campaigns, coupons, settings, couponCode],
  )

  const add = useCallback(
    (product, variant, qty = 1, { silent = false } = {}) => {
      const v = variant ?? product.variants.find((x) => x.available) ?? product.variants[0]
      const key = v.id
      setRaw((cur) => {
        const found = cur.find((l) => l.key === key)
        const max = v.stock ?? 99
        if (found) return cur.map((l) => (l.key === key ? { ...l, qty: Math.min(max, l.qty + qty) } : l))
        return [...cur, { key, handle: product.handle, variantId: v.id, qty: Math.min(max, qty), addedAt: Date.now() }]
      })
      if (!silent) {
        setToast({ id: Date.now(), product, variant: v, qty })
        setDrawer(true)
      }
    },
    [setRaw],
  )

  const setQty = useCallback(
    (key, qty) =>
      setRaw((cur) => (qty <= 0 ? cur.filter((l) => l.key !== key) : cur.map((l) => (l.key === key ? { ...l, qty } : l)))),
    [setRaw],
  )
  const remove = useCallback((key) => setRaw((cur) => cur.filter((l) => l.key !== key)), [setRaw])
  const clear = useCallback(() => {
    setRaw([])
    setCouponCode('')
  }, [setRaw, setCouponCode])

  const toggleFavorite = useCallback(
    (handle) => setFavorites((f) => (f.includes(handle) ? f.filter((h) => h !== handle) : [handle, ...f])),
    [setFavorites],
  )
  const pushRecent = useCallback(
    (handle) => setRecent((r) => [handle, ...r.filter((h) => h !== handle)].slice(0, 12)),
    [setRecent],
  )

  const value = {
    lines,
    totals,
    count: totals.itemCount,
    add,
    setQty,
    remove,
    clear,
    couponCode,
    setCouponCode,
    favorites,
    isFavorite: (h) => favorites.includes(h),
    toggleFavorite,
    recent,
    pushRecent,
    drawer,
    openDrawer: () => setDrawer(true),
    closeDrawer: () => setDrawer(false),
    toast,
    dismissToast: () => setToast(null),
  }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
