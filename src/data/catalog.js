/**
 * Katalog — egecamp.com'dan çekilmiş gerçek ürünler (`npm run catalog`).
 *
 * Bu dosya ham JSON'u zenginleştirir (üst kategori, SKU, maliyet, popülerlik)
 * ve arama/filtre için dizinler kurar. Panelde yapılan fiyat/stok/yayın
 * değişiklikleri `StoreContext` içinde bunun üstüne bindirilir.
 */

import raw from './catalog.json'
import { CATEGORIES, SERIES } from './categories'
import { fold, slugify } from '../lib/format'
import { hashString, mulberry32 } from '../lib/rand'

export const IMG_BASE = 'https://cdn.shopify.com/s/files/1/0666/6708/5992/'

/** Shopify CDN görseli — genişlik parametresiyle yeniden boyutlanır */
export function img(path, w = 600) {
  if (!path) return ''
  const url = path.startsWith('http') ? path : IMG_BASE + path
  return `${url}${url.includes('?') ? '&' : '?'}width=${w}`
}
export const srcSet = (path, widths = [360, 540, 720]) => widths.map((w) => `${img(path, w)} ${w}w`).join(', ')

/* ------------------------------------------------------------ kategoriler */

export const SUBCATS = {}
export const TOPCATS = {}
CATEGORIES.forEach((top) => {
  TOPCATS[top.slug] = top
  top.children.forEach((c) => {
    SUBCATS[c.slug] = { ...c, parent: top.slug }
  })
})

export const categoryBySlug = (slug) => TOPCATS[slug] ?? SUBCATS[slug] ?? null
export const seriesBySlug = (slug) => SERIES.find((s) => s.slug === slug) ?? null

/* ------------------------------------------------------------ ürünler */

const BRAND_CODES = {}
function brandCode(brand) {
  if (!BRAND_CODES[brand]) {
    const letters = fold(brand).replace(/[^a-z]/g, '').toUpperCase()
    BRAND_CODES[brand] = (letters.slice(0, 3) || 'GEN').padEnd(3, 'X')
  }
  return BRAND_CODES[brand]
}

// Kategoriye göre tahmini maliyet oranı (kâr marjı raporları için)
const COST_RATIO = {
  'termos-matara': 0.66, giyim: 0.52, 'ayakkabi-bot': 0.6, 'kamp-ekipmanlari': 0.63,
  'kamp-mutfagi': 0.58, 'isitma-enerji': 0.7, canta: 0.57, 'caki-bicak-balta': 0.6,
}

export const BASE_PRODUCTS = raw.map((p, i) => {
  const r = mulberry32(hashString(p.handle))
  const top = SUBCATS[p.cats[0]].parent
  const own = p.brand === 'EgeCamp'
  // Popülerlik: birkaç yıldız ürün, uzun kuyruk. Kendi markası ve çok satanlar öne çıkar
  let pop = Math.pow(r(), 2.4) * 10 + 0.2
  if (p.best) pop += 7
  if (own) pop += 2.5
  // Pahalı ürün daha seyrek satılır — ortalama sepet 2.500–3.000 TL bandında kalsın
  if (p.price < 400) pop *= 1.8
  else if (p.price < 1500) pop *= 1.25
  else if (p.price > 15000) pop *= 0.22
  else if (p.price > 8000) pop *= 0.38
  else if (p.price > 4000) pop *= 0.65
  const variants = p.variants?.map((v, vi) => ({
    id: `${p.handle}::${vi}`,
    options: v.o,
    title: v.o.join(' / '),
    price: v.p,
    compare: v.c,
    available: v.a,
  })) ?? [{ id: `${p.handle}::0`, options: [], title: '', price: p.price, compare: p.compare, available: p.available }]

  return {
    ...p,
    id: p.handle,
    index: i,
    top,
    sku: `${brandCode(p.brand)}-${String(10000 + ((hashString(p.handle) % 89999) | 0)).slice(0, 5)}`,
    own,
    popularity: pop,
    costRatio: (COST_RATIO[top] ?? 0.6) + (r() - 0.5) * 0.08,
    variants,
    hasVariants: !!p.variants,
    brandSlug: slugify(p.brand),
    rating: Math.round((4.3 + r() * 0.65) * 10) / 10,
    reviewCount: Math.round(pop * (2 + r() * 5)),
    search: fold(`${p.title} ${p.brand} ${p.type ?? ''} ${p.cats.map((c) => SUBCATS[c].name).join(' ')}`),
  }
})

export const BASE_BY_HANDLE = Object.fromEntries(BASE_PRODUCTS.map((p) => [p.handle, p]))

/** Markalar — ürün sayısına göre */
export const BRANDS = Object.values(
  BASE_PRODUCTS.reduce((acc, p) => {
    acc[p.brandSlug] ??= { slug: p.brandSlug, name: p.brand, count: 0, inStock: 0 }
    acc[p.brandSlug].count++
    if (p.available) acc[p.brandSlug].inStock++
    return acc
  }, {}),
).sort((a, b) => b.count - a.count)

export const brandBySlug = (slug) => BRANDS.find((b) => b.slug === slug) ?? null

/** Ürün bir kategoriye (üst ya da alt) ait mi */
export function inCategory(p, slug) {
  if (TOPCATS[slug]) return p.cats.some((c) => SUBCATS[c].parent === slug)
  return p.cats.includes(slug)
}

/** Ürün açıklamaları ayrı parçada — ilk ürün sayfasında bir kez yüklenir */
let detailsPromise
export function loadDetails() {
  detailsPromise ??= import('./details.json').then((m) => m.default)
  return detailsPromise
}

/* ------------------------------------------------------------ arama */

const SYNONYMS = {
  sandalye: 'sandalye', koltuk: 'sandalye', tup: 'kartus', gaz: 'kartus', ocak: 'ocak',
  isitici: 'isitici', soba: 'soba', mont: 'mont', ceket: 'mont', bot: 'bot', ayakkabi: 'bot',
  cadir: 'cadir', tulum: 'tulum', termos: 'termos', matara: 'termos', bicak: 'bicak', caki: 'caki',
  fener: 'fener', lamba: 'lamba', kafa: 'kafa', buzdolabi: 'buzdolabi', dolap: 'buzdolabi',
}

/** Basit, Türkçe duyarlı arama — her kelime ürün metninde geçmeli; başlık eşleşmesi öne çıkar */
export function searchProducts(products, q, limit) {
  const words = fold(q).split(/\s+/).filter((w) => w.length > 1)
  if (!words.length) return []
  const scored = []
  for (const p of products) {
    let score = 0
    let ok = true
    const title = fold(p.title)
    for (const w of words) {
      const alt = SYNONYMS[w]
      if (p.search.includes(w) || (alt && p.search.includes(alt))) {
        score += title.includes(w) ? 3 : 1
        if (title.startsWith(w) || fold(p.brand) === w) score += 2
      } else {
        ok = false
        break
      }
    }
    if (ok) scored.push([p, score + (p.available ? 2 : 0) + p.popularity / 10])
  }
  scored.sort((a, b) => b[1] - a[1])
  const out = scored.map((s) => s[0])
  return limit ? out.slice(0, limit) : out
}

/* ------------------------------------------------------------ renkler */

const SWATCH = {
  siyah: '#1d1d1b', lacivert: '#1f2c4d', haki: '#6b6b3f', yesil: '#3d6b3f', 'haki siyah': '#4b4d36',
  lacivet: '#1f2c4d', turkuaz: '#1aa3a3', lila: '#b39ddb', kahverengi: '#6b4a2f', kahve: '#6b4a2f', bordo: '#6e1f2a', gri: '#8a8d8f', antrasit: '#3b3f42',
  mavi: '#2f6db5', kirmizi: '#c0342b', turuncu: '#e97a1f', bej: '#d6c6a5', beyaz: '#f4f4f2',
  sari: '#e5b823', mor: '#6b3f8f', pembe: '#e58fb0', 'acik gri': '#bfc2c3', 'koyu yesil': '#27472b',
  kamuflaj: '#5d5a3c', krem: '#efe6d2', 'petrol mavisi': '#1e5a66', 'petrol': '#1e5a66', lime: '#a6c53a',
  'polar blue': '#5aa8d6', 'hammertone green': '#3f6b52', 'matte black': '#1d1d1b', 'rose quartz': '#d7a3a6',
}

export function swatchFor(value) {
  const k = fold(value).trim()
  if (SWATCH[k]) return SWATCH[k]
  const first = Object.keys(SWATCH).find((s) => k.includes(s))
  return first ? SWATCH[first] : null
}

export const isColorOption = (name) => /renk|color/i.test(name)
