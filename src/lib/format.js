/** Biçimlendirme yardımcıları — tamamı tr-TR */

const tl2 = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const tl0 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })
const n1 = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 })

/** 4815 → "4.815,00 TL" */
export const tl = (n) => `${tl2.format(n ?? 0)} TL`

/** Kuruşsuz: 4815.4 → "4.815 TL" */
export const tlRound = (n) => `${tl0.format(Math.round(n ?? 0))} TL`

/** Panel için kısa: 1.250.000 → "1,25 Mn ₺", 84.200 → "84,2 B ₺" */
export function tlShort(n) {
  const v = Math.abs(n)
  if (v >= 1e6) return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n / 1e6)} Mn ₺`
  if (v >= 1e4) return `${n1.format(n / 1e3)} B ₺`
  return `${tl0.format(Math.round(n))} ₺`
}

export const num = (n) => tl0.format(n ?? 0)
export const num1 = (n) => n1.format(n ?? 0)
export const pct = (n, d = 1) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: d }).format(n)}`

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
const MONTHS_LONG = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

export const monthShort = (i) => MONTHS[i]
export const monthLong = (i) => MONTHS_LONG[i]
export const dayName = (i) => DAYS[i]

const toDate = (d) => (d instanceof Date ? d : new Date(d))
const pad = (n) => String(n).padStart(2, '0')

/** "24 Eyl 2026" */
export const dateShort = (d) => {
  const x = toDate(d)
  return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`
}
/** "24 Eylül" */
export const dayMonth = (d) => {
  const x = toDate(d)
  return `${x.getDate()} ${MONTHS_LONG[x.getMonth()]}`
}
/** "24 Eyl" */
export const dayMonthShort = (d) => {
  const x = toDate(d)
  return `${x.getDate()} ${MONTHS[x.getMonth()]}`
}
/** "14:05" */
export const hm = (d) => {
  const x = toDate(d)
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`
}
/** "24 Eyl 2026, 14:05" */
export const dateTime = (d) => `${dateShort(d)}, ${hm(d)}`
/** "24.09.2026" */
export const dateNum = (d) => {
  const x = toDate(d)
  return `${pad(x.getDate())}.${pad(x.getMonth() + 1)}.${x.getFullYear()}`
}

/** "3 dk önce", "2 sa önce", "dün", "5 gün önce" */
export function ago(d, now = Date.now()) {
  const s = Math.max(0, (now - toDate(d).getTime()) / 1000)
  if (s < 60) return 'az önce'
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`
  const days = Math.floor(s / 86400)
  if (days === 1) return 'dün'
  if (days < 30) return `${days} gün önce`
  if (days < 365) return `${Math.floor(days / 30)} ay önce`
  return `${Math.floor(days / 365)} yıl önce`
}

/** Süre: 8040 sn → "2 sa 14 dk" */
export function duration(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h <= 0) return `${m} dk`
  return `${h} sa ${m} dk`
}

/** Türkçe duyarlı küçük harf + aksan sadeleştirme (arama için) */
export function fold(s) {
  return (s || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
    .replace(/[®™]/g, '')
}

export const slugify = (s) =>
  fold(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Telefonu maskeler: 0532 123 45 67 → 0532 *** ** 67 */
export const maskPhone = (p) => p.replace(/^(\d{4}) (\d{3}) (\d{2}) (\d{2})$/, '$1 *** ** $4')

export const plural = (n, word) => `${num(n)} ${word}`
