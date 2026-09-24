/**
 * Ürün kataloğunu egecamp.com'un herkese açık Shopify uç noktalarından çeker
 * ve `src/data/catalog.json` dosyasını üretir.
 *
 *   npm run catalog
 *
 * İndirilen ham yanıtlar `scripts/.cache/` altında saklanır; yeniden çalıştırmada
 * ağa çıkmaz. Taze veri için klasörü silin.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CATEGORIES, SERIES } from '../src/data/categories.js'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
const CACHE = path.join(ROOT, '.cache')
const OUT = path.join(ROOT, '..', 'src', 'data', 'catalog.json')
// Açıklamalar ayrı parça: yalnızca ürün sayfası açıldığında yüklenir
const OUT_DETAILS = path.join(ROOT, '..', 'src', 'data', 'details.json')
const BASE = 'https://egecamp.com'
const CDN_PREFIX = 'https://cdn.shopify.com/s/files/1/0666/6708/5992/'

fs.mkdirSync(CACHE, { recursive: true })

async function getJson(url, file) {
  const f = path.join(CACHE, file)
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'))
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  const json = await res.json()
  fs.writeFileSync(f, JSON.stringify(json))
  return json
}

/* ------------------------------------------------------------ indir */

let products = []
for (let page = 1; page < 10; page++) {
  const j = await getJson(`${BASE}/products.json?limit=250&page=${page}`, `products-${page}.json`)
  if (!j.products.length) break
  products = products.concat(j.products)
}

const collectionHandles = new Set([
  ...CATEGORIES.flatMap((c) => c.children.flatMap((s) => s.collections)),
  ...SERIES.map((s) => s.collection),
  'cok-satanlar',
])
const membership = {}
for (const handle of collectionHandles) {
  const j = await getJson(`${BASE}/collections/${encodeURIComponent(handle)}/products.json?limit=250`, `c-${handle}.json`)
  membership[handle] = new Set(j.products.map((p) => p.handle))
}

/* ------------------------------------------------------------ dönüştür */

const VENDOR_FIX = {
  'Ege Camp Outdoor': 'EgeCamp',
  'Gold Sılver': 'Gold Silver',
  'Gold Orıon': 'Gold Orion',
}

// Koleksiyona girmemiş ürünler için ürün tipinden yedek eşleme
const TYPE_FALLBACK = {
  Termos: 'termos', Çadır: 'cadir', Boyunluk: 'bandana-boyunluk', 'Uyku Tulumu': 'uyku-tulumu',
  Pantolon: 'pantolon-sort', Bot: 'ayakkabi', 'Outdoor Bot': 'ayakkabi', 'Kamp Ocağı': 'kamp-ocaklari',
  'Kamp Sandalyesi': 'masa-sandalye', 'Kamp Masası': 'masa-sandalye', Çakı: 'caki-bicak',
  'Kamp Sobası': 'isitici-soba', 'Dizel Isıtıcı': 'isitici-soba', 'Soba Aksesuarı': 'isitici-soba',
  Bardak: 'bardaklar', 'Polo T-Shirt': 'tshirt-sweatshirt', 'T-Shirt': 'tshirt-sweatshirt',
  'Sporcu T-Shirt': 'tshirt-sweatshirt', Kemer: 'kemer', Mont: 'mont-ceket', 'Polar Ceket': 'polar',
  'Kompresörlü Buzdolabı': 'sogutucu-buzluk', 'Soğutucu Buzluk': 'sogutucu-buzluk', Aydınlatma: 'aydinlatma',
  'Kamp Lambası': 'aydinlatma', Feneri: 'aydinlatma', 'El Feneri': 'aydinlatma', 'Yemek Seti': 'mutfak-ekipmanlari',
  'Olta Seti': 'balikcilik', 'Bakım Ürünü': 'bot-aksesuari', Yelek: 'yagmurluk-yelek', Yağmurluk: 'yagmurluk-yelek',
  Rüzgarlık: 'yagmurluk-yelek', 'Taşınabilir Güç Kaynağı': 'guc-kaynaklari', 'Esnek Güneş Paneli': 'gunes-panelleri',
  'Sırt Çantası': 'cantalar', İnox: 'termos', Kampet: 'mat-yatak-kampet', 'Şişme Yatak': 'mat-yatak-kampet',
  'Elektrikli Pompa': 'mat-yatak-kampet', Çaydanlık: 'pisirme-setleri', 'Kamp Tencere Seti': 'pisirme-setleri',
  'Katlanabilir Mangal': 'mangal-izgara', Mangal: 'mangal-izgara', Şapka: 'sapka-eldiven', Eldiven: 'sapka-eldiven',
  Balaklava: 'bandana-boyunluk', Kartuş: 'kartus-purmuz', Pürmüz: 'kartus-purmuz', 'Çadır Kazığı': 'cadir-aksesuarlari',
  Karabinalar: 'cadir-aksesuarlari', Perlon: 'cadir-aksesuarlari', Gömlek: 'gomlek', Tozluk: 'tozluk-aksesuar',
  Şort: 'pantolon-sort', Bıçak: 'caki-bicak', Balta: 'caki-bicak', 'Fonksiyonlu Çakı': 'caki-bicak',
  'Su Bidonu': 'termos', 'Kamp Arabası': 'yuk-arabalari',
}

const SUB_ORDER = CATEGORIES.flatMap((c) => c.children)
const seriesOf = (handle) => SERIES.find((s) => membership[s.collection]?.has(handle))?.slug ?? null

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, '’')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&[a-z]+;/g, ' ')

const clean = (s) => decode(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

function describe(html) {
  const blocks = []
  const features = []
  const re = /<(p|h[1-6]|li)[^>]*>([\s\S]*?)<\/\1>/gi
  let m
  while ((m = re.exec(html || ''))) {
    const text = clean(m[2])
    if (text.length < 3) continue
    if (m[1].toLowerCase() === 'li') {
      if (features.length < 8 && text.length < 220) features.push(text)
    } else {
      blocks.push(text)
    }
  }
  const paras = []
  let total = 0
  for (const b of blocks) {
    if (total > 900) break
    const cut = b.length > 420 ? `${b.slice(0, 400).replace(/\s\S*$/, '')}…` : b
    paras.push(cut)
    total += cut.length
  }
  return { paras, features }
}

const shortImg = (src) => (src.startsWith(CDN_PREFIX) ? src.slice(CDN_PREFIX.length) : src)
const num = (x) => (x == null ? null : Math.round(parseFloat(x) * 100) / 100)

const out = []
const unplaced = []

for (const p of products) {
  if (!p.images.length) continue

  let cats = SUB_ORDER.filter((s) => s.collections.some((c) => membership[c]?.has(p.handle))).map((s) => s.slug)
  if (!cats.length && TYPE_FALLBACK[p.product_type]) cats = [TYPE_FALLBACK[p.product_type]]
  // Mağazanın "Çadır" koleksiyonunda kazık, ip, perlon da var — onları aksesuara taşı
  if (cats.includes('cadir') && p.product_type !== 'Çadır') {
    cats = cats.filter((c) => c !== 'cadir')
    if (!cats.includes('cadir-aksesuarlari')) cats.unshift('cadir-aksesuarlari')
  }
  if (!cats.length && /termos/i.test(p.title)) cats = ['termos']
  if (!cats.length && /ateş çukuru|mangal/i.test(p.title)) cats = ['mangal-izgara']
  if (!cats.length) {
    unplaced.push(`${p.product_type || '—'} · ${p.title}`)
    continue
  }

  const variants = p.variants.map((v) => ({
    o: [v.option1, v.option2, v.option3].filter((x) => x != null),
    p: num(v.price),
    c: num(v.compare_at_price) > num(v.price) ? num(v.compare_at_price) : null,
    a: v.available,
  }))
  const cheapest = variants.reduce((a, b) => (b.p < a.p ? b : a), variants[0])
  const options = p.options
    .filter((o) => !(o.name === 'Title' && o.values.length === 1 && o.values[0] === 'Default Title'))
    .map((o) => ({ name: o.name, values: o.values }))
  const { paras, features } = describe(p.body_html)

  out.push({
    handle: p.handle,
    title: p.title.trim(),
    brand: VENDOR_FIX[p.vendor] ?? p.vendor,
    type: p.product_type || null,
    cats,
    series: seriesOf(p.handle),
    best: membership['cok-satanlar'].has(p.handle) || undefined,
    price: cheapest.p,
    compare: cheapest.c,
    images: p.images.slice(0, 6).map((i) => shortImg(i.src)),
    options,
    variants: options.length ? variants : undefined,
    available: variants.some((v) => v.a),
    desc: paras,
    features,
    created: p.created_at.slice(0, 10),
  })
}

out.sort((a, b) => (a.created < b.created ? 1 : -1))
const details = {}
const lite = out.map(({ desc, features, ...rest }) => {
  details[rest.handle] = { desc, features }
  return rest
})
fs.writeFileSync(OUT, JSON.stringify(lite))
fs.writeFileSync(OUT_DETAILS, JSON.stringify(details))

const size = ((fs.statSync(OUT).size + fs.statSync(OUT_DETAILS).size) / 1024).toFixed(0)
console.log(`${out.length} ürün yazıldı (${size} KB) → ${path.relative(process.cwd(), OUT)}`)
console.log(`Stokta: ${out.filter((p) => p.available).length} · varyantlı: ${out.filter((p) => p.variants).length}`)
if (unplaced.length) console.log(`Yerleşmeyen ${unplaced.length} ürün:\n  ${unplaced.join('\n  ')}`)
