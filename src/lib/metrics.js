/** Panel metrikleri — tamamı sipariş listesinden türetilir */

import { dayMonthShort, monthShort } from './format'

const DAY = 86400000
export const startOfDay = (t) => {
  const d = new Date(t)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export const countable = (o) => o.status !== 'iptal'

export function summarize(orders) {
  let revenue = 0
  let count = 0
  let units = 0
  let cost = 0
  for (const o of orders) {
    if (!countable(o)) continue
    revenue += o.total
    count++
    for (const i of o.items) {
      units += i.qty
      cost += (i.cost ?? i.unit * 0.6) * i.qty
    }
  }
  return { revenue, count, units, aov: count ? revenue / count : 0, cost, margin: revenue ? (revenue - cost) / revenue : 0 }
}

export function inRange(orders, from, to) {
  return orders.filter((o) => o.ts >= from && o.ts < to)
}

/** Son N gün ve önceki N gün — değişim yüzdesiyle */
export function periodCompare(orders, days, now = Date.now()) {
  const end = startOfDay(now) + DAY
  const cur = summarize(inRange(orders, end - days * DAY, end))
  const prev = summarize(inRange(orders, end - 2 * days * DAY, end - days * DAY))
  const delta = (a, b) => (b ? ((a - b) / b) * 100 : null)
  return {
    cur,
    prev,
    delta: {
      revenue: delta(cur.revenue, prev.revenue),
      count: delta(cur.count, prev.count),
      aov: delta(cur.aov, prev.aov),
      units: delta(cur.units, prev.units),
    },
  }
}

/** Bugün ile dünün aynı saatine kadar olan kısmını karşılaştırır */
export function todayCompare(orders, now = Date.now()) {
  const t0 = startOfDay(now)
  const elapsed = now - t0
  const cur = summarize(inRange(orders, t0, now + 1))
  const prev = summarize(inRange(orders, t0 - DAY, t0 - DAY + elapsed))
  return { cur, prev, delta: { revenue: prev.revenue ? ((cur.revenue - prev.revenue) / prev.revenue) * 100 : null, count: prev.count ? ((cur.count - prev.count) / prev.count) * 100 : null } }
}

/** Günlük seri; `compare` ile önceki dönemin aynı gününü de ekler */
export function dailySeries(orders, days, now = Date.now()) {
  const end = startOfDay(now) + DAY
  const start = end - days * DAY
  const prevStart = start - days * DAY
  const cur = new Array(days).fill(0).map(() => ({ revenue: 0, orders: 0 }))
  const prev = new Array(days).fill(0).map(() => ({ revenue: 0, orders: 0 }))
  for (const o of orders) {
    if (!countable(o) || o.ts < prevStart || o.ts >= end) continue
    if (o.ts >= start) {
      const i = Math.floor((o.ts - start) / DAY)
      cur[i].revenue += o.total
      cur[i].orders++
    } else {
      const i = Math.floor((o.ts - prevStart) / DAY)
      prev[i].revenue += o.total
      prev[i].orders++
    }
  }
  return cur.map((c, i) => ({
    ts: start + i * DAY,
    label: dayMonthShort(start + i * DAY),
    revenue: Math.round(c.revenue),
    orders: c.orders,
    prevRevenue: Math.round(prev[i].revenue),
    prevOrders: prev[i].orders,
  }))
}

/** Haftalık toplulaştırma — 90 gün ve üstü grafiklerde okunaklılık için */
export function weekly(series) {
  const out = []
  for (let i = 0; i < series.length; i += 7) {
    const chunk = series.slice(i, i + 7)
    out.push({
      ts: chunk[0].ts,
      label: chunk[0].label,
      revenue: chunk.reduce((s, x) => s + x.revenue, 0),
      orders: chunk.reduce((s, x) => s + x.orders, 0),
      prevRevenue: chunk.reduce((s, x) => s + x.prevRevenue, 0),
      prevOrders: chunk.reduce((s, x) => s + x.prevOrders, 0),
    })
  }
  return out
}

export function monthlySeries(orders, months = 12, now = Date.now()) {
  const d = new Date(now)
  const buckets = []
  for (let i = months - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
    buckets.push({ key: `${m.getFullYear()}-${m.getMonth()}`, label: `${monthShort(m.getMonth())} ${String(m.getFullYear()).slice(2)}`, revenue: 0, orders: 0, cost: 0 })
  }
  const idx = Object.fromEntries(buckets.map((b, i) => [b.key, i]))
  for (const o of orders) {
    if (!countable(o)) continue
    const dt = new Date(o.ts)
    const i = idx[`${dt.getFullYear()}-${dt.getMonth()}`]
    if (i == null) continue
    buckets[i].revenue += o.total
    buckets[i].orders++
    for (const it of o.items) buckets[i].cost += (it.cost ?? it.unit * 0.6) * it.qty
  }
  return buckets.map((b) => ({ ...b, revenue: Math.round(b.revenue) }))
}

/** Satır bazında gruplama (kategori, marka, ürün) */
export function groupItems(orders, keyFn) {
  const map = {}
  for (const o of orders) {
    if (!countable(o)) continue
    for (const i of o.items) {
      const k = keyFn(i)
      const g = (map[k] ??= { key: k, revenue: 0, units: 0, cost: 0, orders: 0 })
      g.revenue += i.total
      g.units += i.qty
      g.cost += (i.cost ?? i.unit * 0.6) * i.qty
      g.orders++
    }
  }
  return Object.values(map).sort((a, b) => b.revenue - a.revenue)
}

/** Sipariş bazında gruplama (şehir, ödeme, kanal) */
export function groupOrders(orders, keyFn) {
  const map = {}
  for (const o of orders) {
    if (!countable(o)) continue
    const k = keyFn(o)
    const g = (map[k] ??= { key: k, revenue: 0, count: 0 })
    g.revenue += o.total
    g.count++
  }
  return Object.values(map).sort((a, b) => b.revenue - a.revenue)
}

export function hourlyHeat(orders) {
  // [gün][saat] — Pazartesi başlangıçlı
  const grid = Array.from({ length: 7 }, () => new Array(24).fill(0))
  for (const o of orders) {
    if (!countable(o)) continue
    const d = new Date(o.ts)
    grid[(d.getDay() + 6) % 7][d.getHours()]++
  }
  return grid
}
