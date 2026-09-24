/**
 * Kampanya motoru ve sepet hesabı.
 *
 * Vitrin, sepet, ödeme ve panel aynı fonksiyonu çağırır; bir kampanya panelden
 * açıldığı an ürün kartındaki rozetten ödeme özetine kadar her yere yansır.
 *
 * Kurallar:
 *  - Bir satıra birden çok kampanya uyuyorsa en yüksek oran uygulanır (üst üste binmez).
 *  - Kademeli kampanyada adet, kapsamdaki tüm satırların toplamıdır
 *    (2 farklı FreeCamp sandalye = 2 adet).
 *  - Kupon, kampanya indirimi düşüldükten sonraki tutara uygulanır.
 *  - Ücretsiz kargo eşiği indirimli ürün tutarına bakar.
 */

import { inCategory } from '../data/catalog'

export const DEFAULT_CAMPAIGNS = [
  {
    id: 'freecamp-kademeli',
    name: 'FreeCamp sandalyelerde adet indirimi',
    type: 'tiered',
    active: true,
    scope: { brands: ['freecamp'], cats: ['masa-sandalye'] },
    tiers: [
      { min: 2, pct: 5 },
      { min: 4, pct: 10 },
    ],
    badge: '2 al %5 · 4 al %10',
    starts: '2026-05-01',
    ends: '2026-10-31',
    stats: { orders: 184, revenue: 612400 },
  },
  {
    id: 'husky-cadir',
    name: 'Husky çadırlarda sepette %10',
    type: 'basket',
    active: true,
    scope: { brands: ['husky'], cats: ['cadir'] },
    pct: 10,
    badge: 'Sepette %10',
    starts: '2026-06-01',
    ends: '2026-09-30',
    stats: { orders: 57, revenue: 598300 },
  },
  {
    id: 'kis-hazirligi',
    name: 'Kış hazırlığı: soba ve ısıtıcılarda %7',
    type: 'basket',
    active: false,
    scope: { cats: ['isitici-soba'] },
    pct: 7,
    badge: 'Sepette %7',
    starts: '2026-10-01',
    ends: '2026-12-31',
    stats: { orders: 0, revenue: 0 },
  },
  {
    id: 'stanley-haftasi',
    name: 'Stanley haftası',
    type: 'basket',
    active: false,
    scope: { brands: ['stanley'] },
    pct: 12,
    badge: 'Sepette %12',
    starts: '2026-11-24',
    ends: '2026-11-30',
    stats: { orders: 0, revenue: 0 },
  },
]

export const DEFAULT_COUPONS = [
  { code: 'KAMP10', kind: 'pct', value: 10, minTotal: 1500, limit: 500, used: 212, expires: '2026-10-31', active: true, note: 'Instagram takipçilerine' },
  { code: 'HOSGELDIN', kind: 'amount', value: 150, minTotal: 1000, limit: 1000, used: 388, expires: '2026-12-31', active: true, note: 'Bülten kaydında gönderilir' },
  { code: 'BILECIK', kind: 'pct', value: 5, minTotal: 0, limit: 200, used: 61, expires: '2026-12-31', active: true, note: 'Mağaza kartvizitinde' },
  { code: 'YAZSONU20', kind: 'pct', value: 20, minTotal: 3000, limit: 150, used: 150, expires: '2026-09-01', active: false, note: 'Süresi doldu' },
]

export const DEFAULT_SETTINGS = {
  freeShippingThreshold: 2500,
  shippingFee: 149.9,
  sameDayCutoff: 15,
  transferDiscountPct: 2,
  codFee: 49.9,
  lowStockThreshold: 3,
  pickupEnabled: true,
}

/* ------------------------------------------------------------ eşleşme */

export function inScope(product, scope = {}) {
  if (scope.handles?.length && !scope.handles.includes(product.handle)) return false
  if (scope.brands?.length && !scope.brands.includes(product.brandSlug)) return false
  if (scope.cats?.length && !scope.cats.some((c) => inCategory(product, c))) return false
  return true
}

/** Ürün kartı / ürün sayfası için: bu ürüne uyan en iyi kampanya */
export function productOffer(product, campaigns) {
  let best = null
  for (const c of campaigns) {
    if (!c.active || !inScope(product, c.scope)) continue
    if (c.type === 'basket') {
      if (!best || c.pct > (best.pct ?? 0)) best = { campaign: c, pct: c.pct, label: c.badge, basketPrice: product.price * (1 - c.pct / 100) }
    } else if (c.type === 'tiered' && !best) {
      best = { campaign: c, tiers: c.tiers, label: c.badge }
    }
  }
  return best
}

/* ------------------------------------------------------------ sepet */

const round2 = (n) => Math.round(n * 100) / 100

/**
 * @param lines [{ key, product, variant, qty }]
 * @param ctx { campaigns, coupons, settings, couponCode, payment: 'kart'|'havale'|'kapida', delivery: 'kargo'|'magaza' }
 */
export function computeCart(lines, ctx) {
  const { campaigns = [], coupons = [], settings = DEFAULT_SETTINGS, couponCode, payment = 'kart', delivery = 'kargo' } = ctx
  const active = campaigns.filter((c) => c.active)

  const priced = lines.map((l) => {
    const unit = l.variant?.price ?? l.product.price
    return { ...l, unit, total: round2(unit * l.qty), discount: 0, campaignId: null }
  })
  const subtotal = round2(priced.reduce((s, l) => s + l.total, 0))
  const itemCount = priced.reduce((s, l) => s + l.qty, 0)

  // Her kampanyanın bu sepette geçerli oranı
  const hints = []
  const rates = {}
  for (const c of active) {
    const scoped = priced.filter((l) => inScope(l.product, c.scope))
    if (!scoped.length) continue
    if (c.type === 'basket') rates[c.id] = c.pct
    if (c.type === 'tiered') {
      const qty = scoped.reduce((s, l) => s + l.qty, 0)
      const tier = [...c.tiers].reverse().find((t) => qty >= t.min)
      const next = c.tiers.find((t) => qty < t.min)
      if (tier) rates[c.id] = tier.pct
      if (next) hints.push({ campaign: c, missing: next.min - qty, pct: next.pct })
    }
  }

  // Satır başına en yüksek oran
  for (const l of priced) {
    let bestPct = 0
    let bestId = null
    for (const c of active) {
      const r = rates[c.id]
      if (r && r > bestPct && inScope(l.product, c.scope)) {
        bestPct = r
        bestId = c.id
      }
    }
    if (bestPct) {
      l.discount = round2((l.total * bestPct) / 100)
      l.campaignId = bestId
      l.pct = bestPct
    }
  }

  const discounts = []
  for (const c of active) {
    const amount = round2(priced.filter((l) => l.campaignId === c.id).reduce((s, l) => s + l.discount, 0))
    if (amount > 0) discounts.push({ id: c.id, label: c.name, amount, pct: rates[c.id] })
  }
  const campaignDiscount = round2(discounts.reduce((s, d) => s + d.amount, 0))
  let goods = round2(subtotal - campaignDiscount)

  // Kupon
  let coupon = null
  let couponError = null
  if (couponCode) {
    const code = couponCode.trim().toLocaleUpperCase('tr-TR')
    const c = coupons.find((x) => x.code === code)
    if (!c) couponError = 'Bu kupon kodu bulunamadı.'
    else if (!c.active) couponError = 'Bu kuponun süresi dolmuş.'
    else if (c.used >= c.limit) couponError = 'Bu kuponun kullanım limiti doldu.'
    else if (goods < c.minTotal) couponError = `Bu kupon ${c.minTotal.toLocaleString('tr-TR')} TL ve üzeri sepetlerde geçerli.`
    else {
      const amount = round2(c.kind === 'pct' ? (goods * c.value) / 100 : Math.min(c.value, goods))
      coupon = { code: c.code, amount, label: c.kind === 'pct' ? `%${c.value} kupon` : `${c.value} TL kupon` }
      goods = round2(goods - amount)
    }
  }

  // Kargo
  const threshold = settings.freeShippingThreshold
  const freeShipRemaining = Math.max(0, round2(threshold - goods))
  let shipping = 0
  if (delivery === 'kargo' && subtotal > 0 && goods < threshold) shipping = settings.shippingFee

  // Ödeme yöntemi farkı
  let paymentAdj = 0
  let paymentLabel = null
  if (payment === 'havale' && settings.transferDiscountPct) {
    paymentAdj = -round2((goods * settings.transferDiscountPct) / 100)
    paymentLabel = `Havale/EFT indirimi (%${settings.transferDiscountPct})`
  }
  if (payment === 'kapida') {
    paymentAdj = settings.codFee
    paymentLabel = 'Kapıda ödeme hizmet bedeli'
  }

  const total = round2(goods + shipping + paymentAdj)

  return {
    lines: priced,
    itemCount,
    subtotal,
    discounts,
    campaignDiscount,
    coupon,
    couponError,
    goods,
    shipping,
    freeShipRemaining,
    freeShipProgress: threshold ? Math.min(1, goods / threshold) : 1,
    paymentAdj,
    paymentLabel,
    total,
    hints,
    savings: round2(campaignDiscount + (coupon?.amount ?? 0) + (paymentAdj < 0 ? -paymentAdj : 0)),
  }
}

/** Taksit tutarı — oran toplam tutara uygulanır */
export function installment(total, count, rate) {
  const grand = round2(total * (1 + rate))
  return { grand, monthly: round2(grand / count) }
}
