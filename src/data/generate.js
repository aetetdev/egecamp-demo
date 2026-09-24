/**
 * Tohumlu demo verisi.
 *
 * Siparişler gün gün üretilir ve her gün kendi tarihiyle tohumlanır: geçmiş
 * günler sayfa yenilense de değişmez, bugün ise saat ilerledikçe yeni sipariş
 * düşer (canlı mağaza hissi). Ürünler katalogdaki gerçek ürünlerdir; fiyatlar
 * geçmişe doğru enflasyonla aşağı çekilir.
 *
 * Ölçek: Bilecik merkezli, Türkiye geneline satan orta ölçekli bir outdoor
 * mağazası — günde ortalama 5-8 sipariş, kampta yaz, ısıtıcıda kış zirvesi.
 */

import { BASE_PRODUCTS, SUBCATS } from './catalog'
import { BRAND, CARGO_COMPANIES } from '../config/brand'
import { rng, makeSampler, hashString, mulberry32 } from '../lib/rand'

const DAY = 86400000
export const NOW = new Date()
const today0 = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate()).getTime()
// Geçmiş sabit bir tarihten başlar; böylece sipariş numaraları günden güne kaymaz
const START = new Date(2025, 7, 20).getTime()
export const HISTORY_DAYS = Math.round((today0 - START) / DAY)

const iso = (t) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ------------------------------------------------------------ isimler */

const FIRST = [
  'Mehmet', 'Ahmet', 'Mustafa', 'Emre', 'Burak', 'Can', 'Murat', 'Oğuz', 'Serkan', 'Kerem', 'Yusuf', 'Hakan',
  'Onur', 'Barış', 'Cem', 'Deniz', 'Eren', 'Furkan', 'Gökhan', 'Halil', 'İbrahim', 'Kaan', 'Levent', 'Mert',
  'Okan', 'Selim', 'Tolga', 'Uğur', 'Volkan', 'Yiğit', 'Ali', 'Batuhan', 'Caner', 'Doğan', 'Erkan', 'Fatih',
  'Ayşe', 'Elif', 'Zeynep', 'Merve', 'Esra', 'Selin', 'Gizem', 'Büşra', 'Ece', 'Derya', 'Pınar', 'Seda',
  'Tuğba', 'Özge', 'Nazlı', 'İrem', 'Melis', 'Aslı', 'Burcu', 'Ceren', 'Damla', 'Ebru', 'Gamze', 'Hande',
]
const LAST = [
  'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan',
  'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Polat', 'Korkmaz', 'Karataş',
  'Erdoğan', 'Güneş', 'Aksoy', 'Tekin', 'Bulut', 'Taş', 'Keskin', 'Ünal', 'Güler', 'Turan', 'Acar', 'Uçar',
  'Kaplan', 'Bozkurt', 'Tunç', 'Erdem', 'Sarı', 'Akın', 'Ekinci', 'Karaca', 'Toprak', 'Tuna', 'Balcı', 'Ateş',
  'Özer', 'Uysal', 'Kocabaş', 'Altun', 'Duman', 'Sönmez', 'Işık', 'Avcı', 'Gündoğdu', 'Başaran', 'Coşkun',
]
const DISTRICTS = {
  İstanbul: ['Kadıköy', 'Beşiktaş', 'Üsküdar', 'Ataşehir', 'Maltepe', 'Kartal', 'Pendik', 'Bakırköy', 'Beylikdüzü', 'Sarıyer', 'Esenyurt', 'Başakşehir'],
  Ankara: ['Çankaya', 'Keçiören', 'Yenimahalle', 'Etimesgut', 'Mamak', 'Gölbaşı', 'Sincan'],
  Bilecik: ['Merkez', 'Bozüyük', 'Söğüt', 'Osmaneli', 'Pazaryeri', 'Gölpazarı'],
  Bursa: ['Nilüfer', 'Osmangazi', 'Yıldırım', 'Mudanya', 'İnegöl', 'Gemlik'],
  İzmir: ['Karşıyaka', 'Bornova', 'Buca', 'Konak', 'Çiğli', 'Urla', 'Bayraklı'],
  Eskişehir: ['Tepebaşı', 'Odunpazarı'],
  Kocaeli: ['İzmit', 'Gebze', 'Gölcük', 'Kartepe', 'Başiskele'],
  Antalya: ['Muratpaşa', 'Konyaaltı', 'Kepez', 'Alanya', 'Manavgat'],
  Sakarya: ['Adapazarı', 'Serdivan', 'Erenler', 'Sapanca'],
}
const districtOf = (city, r) => r.pick(DISTRICTS[city] ?? ['Merkez'])

/* ------------------------------------------------------------ mevsimsellik */

// Ay çarpanı (Oca → Ara): kamp yazın, Kasım indirim dönemi
const MONTH_MULT = [0.85, 0.7, 0.8, 1.0, 1.25, 1.4, 1.45, 1.36, 1.3, 1.22, 1.32, 1.12]
// Haftanın günü (Paz → Cmt): Pazar ve Pazartesi akşamı yüksek
const WEEKDAY_MULT = [1.22, 1.12, 0.98, 0.95, 0.97, 0.88, 0.92]
const HOURS = [
  [7, 1], [8, 2], [9, 3], [10, 5], [11, 6], [12, 6], [13, 6], [14, 6], [15, 5], [16, 5], [17, 5],
  [18, 6], [19, 7], [20, 8], [21, 9], [22, 8], [23, 5], [0, 2],
]

const WINTER = new Set([0, 1, 9, 10, 11])
const SUMMER = new Set([4, 5, 6, 7])
function seasonal(p, m) {
  const c = p.cats[0]
  if (c === 'isitici-soba') return WINTER.has(m) ? 3.2 : SUMMER.has(m) ? 0.25 : 1
  if (['mont-ceket', 'polar', 'sapka-eldiven', 'bandana-boyunluk'].includes(c)) return WINTER.has(m) ? 1.9 : SUMMER.has(m) ? 0.45 : 1
  if (['cadir', 'uyku-tulumu', 'masa-sandalye', 'mangal-izgara', 'sogutucu-buzluk', 'mat-yatak-kampet', 'kamp-ocaklari', 'kartus-purmuz'].includes(c))
    return SUMMER.has(m) ? 1.7 : WINTER.has(m) ? 0.55 : 1
  if (c === 'guc-kaynaklari' || c === 'gunes-panelleri') return 1.2
  return 1
}

const samplers = Array.from({ length: 12 }, (_, m) => makeSampler(BASE_PRODUCTS, (p) => p.popularity * seasonal(p, m)))

/* ------------------------------------------------------------ müşteriler */

const CUSTOMER_COUNT = 1650
const cityPairs = BRAND.cityWeights

export const CUSTOMERS = (() => {
  const r = rng('customers-v1')
  const list = []
  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const first = r.pick(FIRST)
    const last = r.pick(LAST)
    const city = r.weighted(cityPairs)
    const phone = `05${r.pick(['32', '33', '35', '36', '38', '42', '43', '44', '46', '52', '53', '54', '55', '05', '06', '07'])} ${r.int(100, 999)} ${r.int(10, 99)} ${r.int(10, 99)}`
    const mail = `${first}.${last}`
      .toLocaleLowerCase('tr-TR')
      .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    list.push({
      id: `M${10480 + i}`,
      name: `${first} ${last}`,
      first,
      last,
      city,
      district: districtOf(city, r),
      phone,
      email: `${mail}${r.chance(0.4) ? r.int(1, 99) : ''}@${r.weighted([['gmail.com', 70], ['hotmail.com', 18], ['outlook.com', 7], ['icloud.com', 5]])}`,
      optIn: r.chance(0.62),
      orders: [],
    })
  }
  return list
})()

// Müşteri seçimi çarpık: düşük indeksler tekrar tekrar alışveriş yapar
const pickCustomer = (r) => CUSTOMERS[Math.floor(Math.pow(r.next(), 1.7) * CUSTOMERS.length)]

/* ------------------------------------------------------------ siparişler */

const inflation = (ageDays) => 1 / (1 + 0.3 * (ageDays / 365))
const psych = (x) => (x < 100 ? Math.round(x * 10) / 10 : Math.max(9.9, Math.round(x / 10) * 10 - 0.1))

function statusFor(ageHours, r) {
  if (ageHours > 3 && r.chance(0.014)) return 'iptal'
  if (ageHours < 3) return 'yeni'
  if (ageHours < 20) return 'hazirlaniyor'
  if (ageHours < 70) return 'kargoda'
  if (ageHours > 24 * 6 && r.chance(0.028)) return 'iade'
  return 'teslim'
}

function buildOrders() {
  const orders = []
  let seq = 20417
  for (let d = HISTORY_DAYS; d >= 0; d--) {
    const t0 = today0 - d * DAY
    const date = new Date(t0)
    const m = date.getMonth()
    const r = rng(`day:${iso(t0)}`)
    const growth = 0.62 + 0.38 * Math.min(1, (t0 - START) / (400 * DAY))
    const lambda = 5.6 * MONTH_MULT[m] * WEEKDAY_MULT[date.getDay()] * growth
    const n = r.poisson(lambda)
    const dayOrders = []
    for (let k = 0; k < n; k++) {
      const hour = r.weighted(HOURS)
      const ts = t0 + (hour === 0 ? 24 : hour) * 3600000 - (hour === 0 ? 3600000 * 0.5 : 0) + r.int(0, 59) * 60000 + r.int(0, 59) * 1000
      dayOrders.push({ ts, r: rng(`o:${iso(t0)}:${k}`) })
    }
    dayOrders.sort((a, b) => a.ts - b.ts)
    for (const { ts, r: or } of dayOrders) {
      if (ts > NOW.getTime()) continue
      seq++
      orders.push(makeOrder(seq, ts, or, m))
    }
  }
  return orders
}

function makeOrder(seq, ts, r, month) {
  const ageDays = (NOW.getTime() - ts) / DAY
  const customer = pickCustomer(r)
  const itemCount = r.weighted([[1, 66], [2, 24], [3, 8], [4, 2]])
  const items = []
  const seen = new Set()
  const sampler = samplers[month]
  for (let i = 0; i < itemCount; i++) {
    const p = sampler(r.next())
    if (seen.has(p.handle)) continue
    seen.add(p.handle)
    const avail = p.variants.filter((v) => v.available)
    const v = r.pick(avail.length ? avail : p.variants)
    let qty = 1
    if (p.price < 400) qty = r.weighted([[1, 52], [2, 28], [3, 10], [4, 10]])
    else if (p.brandSlug === 'freecamp' && p.cats[0] === 'masa-sandalye') qty = r.weighted([[1, 60], [2, 30], [4, 10]])
    else if (r.chance(0.06)) qty = 2
    const unit = psych(v.price * inflation(ageDays))
    items.push({
      handle: p.handle,
      title: p.title,
      brand: p.brand,
      image: p.images[0],
      variant: v.title,
      variantId: v.id,
      qty,
      unit,
      total: Math.round(unit * qty * 100) / 100,
      cat: p.cats[0],
      top: p.top,
      cost: Math.round(unit * p.costRatio * 100) / 100,
    })
  }
  const subtotal = Math.round(items.reduce((s, i) => s + i.total, 0) * 100) / 100

  let discount = 0
  let coupon = null
  if (r.chance(0.13)) {
    coupon = r.weighted([['KAMP10', 45], ['HOSGELDIN', 35], ['BILECIK', 20]])
    discount = coupon === 'HOSGELDIN' ? (subtotal >= 1000 ? 150 : 0) : Math.round(subtotal * (coupon === 'KAMP10' ? 0.1 : 0.05) * 100) / 100
    if (!discount) coupon = null
  }
  const goods = subtotal - discount
  const delivery = customer.city === 'Bilecik' && r.chance(0.45) ? 'magaza' : 'kargo'
  const shipping = delivery === 'magaza' || goods >= 2500 ? 0 : 149.9
  const payment = r.weighted([['kart', 78], ['havale', 12], ['kapida', 10]])
  const payAdj = payment === 'havale' ? -Math.round(goods * 0.02 * 100) / 100 : payment === 'kapida' ? 49.9 : 0
  const total = Math.round((goods + shipping + payAdj) * 100) / 100
  const installments = payment === 'kart' && total > 1000 ? r.weighted([[1, 52], [2, 5], [3, 20], [6, 13], [9, 5], [12, 5]]) : 1

  const ageHours = ageDays * 24
  const status = statusFor(ageHours, r)
  const cargo = delivery === 'kargo' ? r.weighted(CARGO_COMPANIES.map((c, i) => [c, [60, 30, 10][i]])) : null
  const channel = r.weighted([['mobil', 63], ['masaustu', 19], ['instagram', 10], ['whatsapp', 8]])

  const order = {
    no: `${BRAND.orderPrefix}-${seq}`,
    seq,
    ts,
    date: new Date(ts),
    customerId: customer.id,
    customer: { name: customer.name, city: customer.city, district: customer.district, phone: customer.phone, email: customer.email },
    items,
    subtotal,
    discount,
    coupon,
    shipping,
    payment,
    payAdj,
    installments,
    total,
    delivery,
    cargo,
    tracking: cargo && status !== 'yeni' && status !== 'hazirlaniyor' && status !== 'iptal' ? `${r.int(1000, 9999)}${r.int(100000, 999999)}${r.int(10, 99)}` : null,
    invoice: status === 'yeni' ? null : `EGC2026${String(seq).padStart(9, '0')}`,
    status,
    channel,
    note: r.chance(0.07) ? r.pick(['Hediye paketi yapılabilir mi?', 'Kapıya bırakabilirsiniz.', 'Akşam 18:00 sonrası teslim lütfen.', 'Faturayı şirket adına kesin lütfen.', 'Kargo gelmeden arayın.']) : null,
  }
  customer.orders.push(order)
  return order
}

export const ORDERS = buildOrders() // eskiden yeniye
export const ORDERS_DESC = [...ORDERS].reverse()

/* ------------------------------------------------------------ müşteri özetleri */

CUSTOMERS.forEach((c) => {
  const valid = c.orders.filter((o) => o.status !== 'iptal')
  c.orderCount = valid.length
  c.spent = Math.round(valid.reduce((s, o) => s + o.total, 0))
  c.first = c.orders[0]?.date ?? null
  c.last = c.orders[c.orders.length - 1]?.date ?? null
  const cats = {}
  valid.forEach((o) => o.items.forEach((i) => (cats[i.top] = (cats[i.top] ?? 0) + i.total)))
  c.topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
})
export const ACTIVE_CUSTOMERS = CUSTOMERS.filter((c) => c.orderCount > 0)

/* ------------------------------------------------------------ ürün satış istatistikleri */

export const PRODUCT_STATS = (() => {
  const stats = {}
  const cut30 = NOW.getTime() - 30 * DAY
  const cut90 = NOW.getTime() - 90 * DAY
  for (const o of ORDERS) {
    if (o.status === 'iptal') continue
    for (const i of o.items) {
      const s = (stats[i.handle] ??= { units: 0, revenue: 0, units30: 0, revenue30: 0, units90: 0, last: 0 })
      s.units += i.qty
      s.revenue += i.total
      if (o.ts >= cut30) {
        s.units30 += i.qty
        s.revenue30 += i.total
      }
      if (o.ts >= cut90) s.units90 += i.qty
      s.last = Math.max(s.last, o.ts)
    }
  }
  return stats
})()

/* ------------------------------------------------------------ stok */

export const BASE_STOCK = (() => {
  const stock = {}
  for (const p of BASE_PRODUCTS) {
    const r = mulberry32(hashString(`stock:${p.handle}`))
    const velocity = (PRODUCT_STATS[p.handle]?.units90 ?? 0) / 90
    p.variants.forEach((v) => {
      if (!v.available) return (stock[v.id] = 0)
      const perVariant = p.variants.length > 1 ? 0.6 : 1
      let s = Math.max(4, Math.round((8 + r() * 26 + velocity * 25) * perVariant))
      if (r() < 0.035) s = 1 + Math.floor(r() * 3)
      stock[v.id] = Math.max(1, s)
    })
  }
  return stock
})()

/** Tükenen ürünü "gelince haber ver" diyerek bekleyen müşteri sayısı */
export const waitlistFor = (p) => (p.available ? 0 : Math.round(p.popularity * 2.2 + (hashString(p.handle) % 5)))

/* ------------------------------------------------------------ terk edilen sepetler */

export const ABANDONED = (() => {
  const r = rng('abandoned-v1')
  const list = []
  for (let i = 0; i < 31; i++) {
    const ts = NOW.getTime() - r.float(0.05, 7) * DAY
    const c = pickCustomer(r)
    const n = r.weighted([[1, 55], [2, 30], [3, 15]])
    const items = Array.from({ length: n }, () => {
      const p = samplers[NOW.getMonth()](r.next())
      return { handle: p.handle, title: p.title, image: p.images[0], unit: p.price, qty: 1 }
    })
    list.push({
      id: `S${9000 + i}`,
      ts,
      customer: c,
      items,
      total: items.reduce((s, x) => s + x.unit * x.qty, 0),
      stage: r.weighted([['Sepette', 55], ['Ödeme adımında', 30], ['Adres girildi', 15]]),
      recovered: r.chance(0.17),
      reminded: r.chance(0.35),
    })
  }
  return list.sort((a, b) => b.ts - a.ts)
})()

/* ------------------------------------------------------------ iadeler */

const RETURN_REASONS = [
  ['Beden / numara uymadı', 34],
  ['Beklentimi karşılamadı', 18],
  ['Kusurlu / hasarlı geldi', 14],
  ['Yanlış ürün gönderildi', 6],
  ['Vazgeçtim', 20],
  ['Açıklamadaki özellikle uyuşmuyor', 8],
]
export const RETURNS = (() => {
  const r = rng('returns-v1')
  const done = ORDERS_DESC.filter((o) => o.status === 'iade').slice(0, 30)
  const pendingSource = ORDERS_DESC.filter((o) => o.status === 'teslim' && NOW.getTime() - o.ts < 14 * DAY)
  const list = done.map((o, i) => {
    const it = o.items[0]
    return {
      id: `IA-${3120 + i}`,
      orderNo: o.no,
      customer: o.customer.name,
      item: it,
      amount: it.total,
      reason: r.weighted(RETURN_REASONS),
      status: r.weighted([['iade-edildi', 85], ['reddedildi', 15]]),
      ts: o.ts + r.float(3, 9) * DAY,
    }
  })
  pendingSource.slice(0, 7).forEach((o, i) => {
    const it = o.items[0]
    list.push({
      id: `IA-${3200 + i}`,
      orderNo: o.no,
      customer: o.customer.name,
      item: it,
      amount: it.total,
      reason: r.weighted(RETURN_REASONS),
      status: r.weighted([['talep', 40], ['kargoda', 35], ['incelemede', 25]]),
      ts: Math.min(NOW.getTime() - 3600000, o.ts + r.float(2, 6) * DAY),
    })
  })
  return list.sort((a, b) => b.ts - a.ts)
})()

/* ------------------------------------------------------------ bayiler */

export const DEALERS = [
  { id: 'B-101', name: 'Doruk Outdoor', city: 'Eskişehir', contact: 'Serkan Aydın', group: 'A', since: '2025-03-12', balance: 18450, total: 486300, lastOrder: 4 },
  { id: 'B-102', name: 'Patika Kamp Malzemeleri', city: 'Bursa', contact: 'Gökhan Kaplan', group: 'A', since: '2025-05-02', balance: 0, total: 402150, lastOrder: 9 },
  { id: 'B-103', name: 'Yayla Av & Kamp', city: 'Kütahya', contact: 'Halil Coşkun', group: 'B', since: '2025-06-18', balance: 7820, total: 214900, lastOrder: 12 },
  { id: 'B-104', name: 'Kuzey Rüzgârı Outdoor', city: 'Bolu', contact: 'Deniz Erdem', group: 'B', since: '2025-09-01', balance: 12300, total: 178400, lastOrder: 6 },
  { id: 'B-105', name: 'Sakarya Av Kamp', city: 'Sakarya', contact: 'Uğur Polat', group: 'B', since: '2025-11-20', balance: 0, total: 132750, lastOrder: 21 },
  { id: 'B-106', name: 'Kaçkar Doğa Sporları', city: 'Rize', contact: 'Yiğit Tuna', group: 'A', since: '2026-01-15', balance: 22980, total: 296100, lastOrder: 3 },
  { id: 'B-107', name: 'Ege Kamp Market', city: 'İzmir', contact: 'Melis Güneş', group: 'C', since: '2026-03-04', balance: 3400, total: 64200, lastOrder: 27 },
  { id: 'B-108', name: 'Toros Outdoor', city: 'Mersin', contact: 'Kaan Özkan', group: 'C', since: '2026-05-22', balance: 0, total: 41800, lastOrder: 38 },
]
export const DEALER_GROUPS = [
  { id: 'A', name: 'Bayi A', pct: 25, desc: 'Yıllık 250.000 TL üzeri alım' },
  { id: 'B', name: 'Bayi B', pct: 20, desc: 'Yıllık 100.000 TL üzeri alım' },
  { id: 'C', name: 'Bayi C', pct: 15, desc: 'Başlangıç grubu' },
]
export const DEALER_APPLICATIONS = [
  { id: 'BB-41', company: 'Zirve Kamp Evi', person: 'Onur Karaca', city: 'Afyonkarahisar', phone: '0532 418 22 90', type: 'Fiziki mağaza', volume: '50.000 – 100.000 TL', ts: NOW.getTime() - 0.4 * DAY, note: 'Soba ve ısıtıcı ağırlıklı çalışmak istiyoruz.' },
  { id: 'BB-40', company: 'Rota Outdoor', person: 'Ceren Akın', city: 'Ankara', phone: '0544 902 13 55', type: 'Online + fiziki', volume: '100.000 TL üzeri', ts: NOW.getTime() - 2.3 * DAY, note: 'Trendyol mağazamız var, EgeCamp® serisini listelemek istiyoruz.' },
  { id: 'BB-39', company: 'Göl Kıyısı Balıkçılık', person: 'Levent Taş', city: 'Isparta', phone: '0553 771 40 12', type: 'Fiziki mağaza', volume: '25.000 – 50.000 TL', ts: NOW.getTime() - 5.1 * DAY, note: '' },
]

/* ------------------------------------------------------------ ziyaretçi analitiği */

export const TRAFFIC = (() => {
  const byDay = {}
  ORDERS.forEach((o) => {
    const k = iso(o.ts)
    byDay[k] = (byDay[k] ?? 0) + 1
  })
  const days = []
  for (let d = 179; d >= 0; d--) {
    const t = today0 - d * DAY
    const r = rng(`traffic:${iso(t)}`)
    const orders = byDay[iso(t)] ?? 0
    const conv = r.float(0.012, 0.019)
    let sessions = Math.round((orders + r.float(1, 3)) / conv)
    if (d === 0) sessions = Math.round(sessions * Math.min(1, (NOW.getHours() + NOW.getMinutes() / 60) / 22))
    days.push({ date: iso(t), ts: t, sessions, orders })
  }
  return {
    days,
    sources: [
      ['Instagram', 34],
      ['Google (organik)', 27],
      ['Doğrudan', 15],
      ['Google Ads', 11],
      ['WhatsApp', 8],
      ['Diğer', 5],
    ],
    devices: [
      ['Mobil', 78],
      ['Masaüstü', 18],
      ['Tablet', 4],
    ],
    funnel: [
      ['Ziyaret', 100],
      ['Ürün görüntüleme', 58],
      ['Sepete ekleme', 9.4],
      ['Ödeme adımı', 3.6],
      ['Sipariş', 1.55],
    ],
    searches: [
      ['stanley termos', 412, 38], ['çadır sobası', 355, 21], ['dizel ısıtıcı', 301, 6], ['husky çadır', 287, 30],
      ['kamp sandalyesi', 264, 34], ['uyku tulumu', 240, 37], ['kartuş', 198, 10], ['kafa lambası', 176, 14],
      ['katlanır masa', 150, 18], ['opinel', 131, 10], ['mangal', 124, 24], ['bot', 118, 34],
      ['hamak', 97, 0], ['kamp duşu', 64, 0], ['olta makinesi', 52, 0], ['kano', 31, 0], ['portatif tuvalet', 28, 0], ['şişme bot', 22, 0],
    ],
  }
})()

/* ------------------------------------------------------------ pazaryeri */

export const CHANNELS = [
  { id: 'trendyol', name: 'Trendyol', connected: true, listed: 214, errors: 3, commission: 18, lastSync: 4, color: '#f27a1a', monthOrders: 46, monthRevenue: 131800 },
  { id: 'hepsiburada', name: 'Hepsiburada', connected: true, listed: 168, errors: 0, commission: 16, lastSync: 7, color: '#ff6000', monthOrders: 21, monthRevenue: 62400 },
  { id: 'n11', name: 'N11', connected: false, listed: 0, errors: 0, commission: 15, lastSync: null, color: '#5c2d91', monthOrders: 0, monthRevenue: 0 },
  { id: 'amazon', name: 'Amazon Türkiye', connected: false, listed: 0, errors: 0, commission: 15, lastSync: null, color: '#232f3e', monthOrders: 0, monthRevenue: 0 },
]

/* ------------------------------------------------------------ yorumlar */

const REVIEW_TEXTS = [
  'Kargo ertesi gün elimdeydi, ürün anlatıldığı gibi. Paketleme de özenliydi.',
  'Hafta sonu kampında denedim, beklediğimden sağlam çıktı. Tavsiye ederim.',
  'Mağazayı WhatsApp’tan aradım, sorularıma hemen cevap verdiler. Ürün çok kaliteli.',
  'Fiyat/performans olarak piyasadaki en iyi seçenek. İkinciyi de alacağım.',
  'Bilecik’ten aldım, mağazada da çok ilgilendiler. Eline sağlık Ege Camp.',
  'Malzeme kalitesi çok iyi, ağırlığı da tam kamp için ideal.',
  'Eşime hediye aldım, çok beğendi. Hızlı gönderim için teşekkürler.',
  'Bir kez kullandım, şimdilik hiçbir sorun yok. Ölçüler doğru.',
  'Kutudan çıktığı gibi kullanıma hazır, kurulumu çok kolay.',
  'Rengi fotoğraftakinden bir ton koyu ama genel olarak memnunum.',
  'Soğukta denedim, gayet başarılı. Kışın da gönül rahatlığıyla kullanılır.',
  'Aynı gün kargoya verildi, iki günde İzmir’e geldi.',
]
export function reviewsFor(p) {
  const r = rng(`reviews:${p.handle}`)
  const n = Math.min(p.reviewCount, 5)
  return Array.from({ length: n }, (_, i) => {
    const first = r.pick(FIRST)
    return {
      id: i,
      name: `${first} ${r.pick(LAST)[0]}.`,
      rating: r.weighted([[5, 70], [4, 24], [3, 6]]),
      text: r.pick(REVIEW_TEXTS),
      date: new Date(NOW.getTime() - r.float(3, 240) * DAY),
      verified: r.chance(0.85),
    }
  })
}

export const categoryName = (slug) => SUBCATS[slug]?.name ?? slug
