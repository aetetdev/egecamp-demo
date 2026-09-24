/**
 * Tohumlu rastgele sayı üreteci.
 *
 * Demo verisi her açılışta aynı çıkmalı: sunum sırasında değişen rakam güven
 * kırar. Günlük veriler gün numarasıyla tohumlanır; geçmiş gün hiç değişmez,
 * yalnızca bugün saat ilerledikçe yeni sipariş eklenir.
 */

export function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function rng(seed) {
  const r = mulberry32(typeof seed === 'string' ? hashString(seed) : seed)
  const api = {
    next: r,
    float: (min = 0, max = 1) => min + r() * (max - min),
    int: (min, max) => Math.floor(min + r() * (max - min + 1)),
    chance: (p) => r() < p,
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    /** [[değer, ağırlık], ...] */
    weighted(pairs) {
      let total = 0
      for (const [, w] of pairs) total += w
      let x = r() * total
      for (const [v, w] of pairs) {
        x -= w
        if (x <= 0) return v
      }
      return pairs[pairs.length - 1][0]
    },
    /** Poisson dağılımı — günlük sipariş sayısı için */
    poisson(lambda) {
      const L = Math.exp(-lambda)
      let k = 0
      let p = 1
      do {
        k++
        p *= r()
      } while (p > L)
      return k - 1
    },
    shuffle(arr) {
      const a = [...arr]
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
      }
      return a
    },
  }
  return api
}

/** Önceden hesaplanmış ağırlık tablosundan hızlı seçim (ikili arama) */
export function makeSampler(items, weightOf) {
  const cum = []
  let total = 0
  for (const it of items) {
    total += weightOf(it)
    cum.push(total)
  }
  return (u) => {
    const x = u * total
    let lo = 0
    let hi = cum.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cum[mid] < x) lo = mid + 1
      else hi = mid
    }
    return items[lo]
  }
}
