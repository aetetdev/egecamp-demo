import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Clock,
  CreditCard,
  Instagram,
  MapPin,
  RotateCcw,
  Store,
  Timer,
  Truck,
} from 'lucide-react'
import { BRAND } from '../config/brand'
import { CATEGORIES, SERIES } from '../data/categories'
import { BRANDS, img, inCategory } from '../data/catalog'
import { useStore } from '../store/StoreContext'
import { useCart } from '../store/CartContext'
import Rail from '../components/site/Rail'
import { ProductImg, SectionTitle, useNow } from '../components/ui/Bits'
import { tl } from '../lib/format'

const USP_ICONS = { Truck, Timer, CreditCard, Store, RotateCcw }

function Hero() {
  const { byHandle } = useStore()
  const slides = BRAND.hero
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 7000)
    return () => clearInterval(t)
  }, [paused, slides.length])
  const s = slides[i]
  const featured = s.product ? byHandle[s.product] : null

  return (
    <section className="relative isolate overflow-hidden bg-char-950" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {slides.map((sl, k) => (
        <img
          key={sl.id}
          src={img(sl.image, 1800)}
          srcSet={`${img(sl.image, 900)} 900w, ${img(sl.image, 1400)} 1400w, ${img(sl.image, 2000)} 2000w`}
          sizes="100vw"
          alt=""
          fetchpriority={k === 0 ? 'high' : 'auto'}
          loading={k === 0 ? 'eager' : 'lazy'}
          style={{ objectPosition: sl.position ?? 'center' }}
          className={`absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-1000 ${sl.zoomMobile ? 'max-md:origin-bottom max-md:scale-150' : ''} ${k === i ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      <div className={`absolute inset-0 -z-10 bg-gradient-to-r ${s.tint} to-transparent transition-colors duration-700`} />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-char-950/70 to-transparent" />

      <div className="shell flex min-h-[540px] flex-col justify-end pt-20 pb-14 md:min-h-[640px] md:justify-center md:pb-20 lg:min-h-[min(78vh,760px)]">
        <div key={s.id} className="max-w-2xl animate-rise">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-ember-300 uppercase ring-1 ring-white/15 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-ember" />
            {s.eyebrow}
          </p>
          <h1 className="display text-[3.1rem] text-white sm:text-[4.2rem] lg:text-[5.4rem]">
            {s.title[0]}
            <br />
            <span className="text-ember">{s.title[1]}</span>
          </h1>
          <p className="mt-5 max-w-lg text-[15px] leading-7 text-white/80 md:text-base">{s.blurb}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={s.cta.to} className="btn btn-primary btn-lg">
              {s.cta.label} <ArrowRight size={17} />
            </Link>
            <Link to="/urunler" className="btn btn-lg bg-white/10 text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/20">
              Tüm ürünler
            </Link>
          </div>
        </div>

        {featured && (
          <Link
            to={`/urun/${featured.handle}`}
            key={`f-${s.id}`}
            className="absolute right-8 bottom-16 hidden w-72 animate-rise items-center gap-3 rounded-2xl bg-white/95 p-3 pr-4 card-lift-lg backdrop-blur hover:bg-white xl:flex"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
              <ProductImg path={featured.images[0]} widths={[160, 160]} sizes="80px" alt="" className="absolute inset-0 h-full w-full" />
            </div>
            <div className="min-w-0">
              <p className="text-[10.5px] font-bold tracking-wider text-ember-700 uppercase">Sezonun yıldızı</p>
              <p className="line-clamp-2 text-[13px] leading-5 font-semibold text-char-900">{featured.title}</p>
              <p className="tnum mt-0.5 text-sm font-bold">
                {tl(featured.price)}
                {featured.compare && <span className="ml-1.5 text-xs font-normal text-char-400 line-through">{tl(featured.compare)}</span>}
              </p>
            </div>
          </Link>
        )}

        <div className="mt-10 flex items-center gap-2 md:absolute md:bottom-8 md:left-1/2 md:mt-0 md:-translate-x-1/2">
          {slides.map((sl, k) => (
            <button
              key={sl.id}
              onClick={() => setI(k)}
              aria-label={`${k + 1}. görsel`}
              className={`h-1.5 rounded-full transition-all ${k === i ? 'w-10 bg-ember' : 'w-4 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function Usps() {
  return (
    <section className="border-b border-line bg-white">
      <div className="shell no-scrollbar flex gap-6 overflow-x-auto py-4 md:grid md:grid-cols-5 md:gap-4 md:py-5">
        {BRAND.usps.map(([icon, title, sub]) => {
          const Icon = USP_ICONS[icon]
          return (
            <div key={title} className="flex shrink-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ember-50 text-ember-700">
                <Icon size={19} />
              </span>
              <div className="leading-tight">
                <p className="text-[13.5px] font-semibold text-char-900">{title}</p>
                <p className="text-xs text-char-500">{sub}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function CategoryGrid() {
  const { shopProducts } = useStore()
  const counts = useMemo(() => {
    const c = {}
    CATEGORIES.forEach((cat) => (c[cat.slug] = shopProducts.filter((p) => inCategory(p, cat.slug)).length))
    return c
  }, [shopProducts])
  return (
    <section className="shell pt-14 md:pt-20">
      <SectionTitle
        eyebrow="Ne arıyorsunuz?"
        title="Kategoriler"
        action={
          <Link to="/urunler" className="hidden items-center gap-1 text-sm font-semibold text-char-800 hover:text-ember-700 sm:flex">
            Tüm ürünler <ArrowRight size={15} />
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-4 md:grid-rows-[repeat(3,minmax(0,13rem))]">
        {CATEGORIES.map((c, i) => (
          <Link
            key={c.slug}
            to={`/kategori/${c.slug}`}
            className={`group relative isolate flex min-h-40 overflow-hidden rounded-2xl bg-white ring-1 ring-line ${i === 0 ? 'col-span-2 min-h-60 md:row-span-2' : ''} ${i === 1 ? 'md:row-span-2' : ''} ${i === CATEGORIES.length - 1 ? 'col-span-2 md:col-span-1' : ''}`}
          >
            <img
              src={img(BRAND.categoryImages[c.slug], i < 2 ? 900 : 500)}
              alt=""
              loading="lazy"
              className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-char-950/80 via-char-950/15 to-transparent" />
            <div className="mt-auto w-full p-4 md:p-5">
              <h3 className={`display text-white ${i === 0 ? 'text-4xl md:text-5xl' : 'text-2xl md:text-[1.7rem]'}`}>{c.name}</h3>
              {i < 2 && <p className="mt-1 hidden max-w-xs text-sm text-white/75 sm:block">{c.blurb}</p>}
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-white/70">
                <span className="tnum">{counts[c.slug]}</span> ürün
                <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function weekEnd(now) {
  const d = new Date(now)
  const add = (7 - d.getDay()) % 7
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + add, 23, 59, 59).getTime()
}

function Countdown() {
  const now = useNow()
  const left = Math.max(0, Math.floor((weekEnd(now) - now) / 1000))
  const parts = [
    [Math.floor(left / 86400), 'gün'],
    [Math.floor((left % 86400) / 3600), 'sa'],
    [Math.floor((left % 3600) / 60), 'dk'],
    [left % 60, 'sn'],
  ]
  return (
    <div className="flex items-center gap-1.5" aria-label="Kampanyanın bitmesine kalan süre">
      <Clock size={16} className="mr-1 text-flame" />
      {parts.map(([v, l]) => (
        <span key={l} className="tnum flex min-w-11 flex-col items-center rounded-lg bg-char-900 px-2 py-1 leading-none text-white">
          <span className="text-[15px] font-bold">{String(v).padStart(2, '0')}</span>
          <span className="mt-0.5 text-[9.5px] text-white/60">{l}</span>
        </span>
      ))}
    </div>
  )
}

function Deals() {
  const { shopProducts } = useStore()
  const deals = useMemo(
    () =>
      shopProducts
        .filter((p) => p.available && p.compare && p.compare > p.price)
        .map((p) => ({ p, off: 1 - p.price / p.compare }))
        .filter((x) => x.off >= 0.07 && x.p.price >= 700)
        .sort((a, b) => b.p.popularity * b.off * Math.sqrt(b.p.price) - a.p.popularity * a.off * Math.sqrt(a.p.price))
        .reduce(
          (acc, x) => {
            // Aynı alt kategoriden en fazla 2, aynı markadan en fazla 3 ürün — şerit tek düze görünmesin
            const c = acc.cats[x.p.cats[0]] ?? 0
            const b = acc.brands[x.p.brandSlug] ?? 0
            if (c < 2 && b < 3) {
              acc.list.push(x.p)
              acc.cats[x.p.cats[0]] = c + 1
              acc.brands[x.p.brandSlug] = b + 1
            }
            return acc
          },
          { list: [], cats: {}, brands: {} },
        )
        .list.slice(0, 14),
    [shopProducts],
  )
  return (
    <section className="shell pt-16 md:pt-24">
      <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-1.5">Pazar gece yarısına kadar</p>
          <h2 className="display text-[2rem] md:text-[2.6rem]">Haftanın fırsatları</h2>
        </div>
        <div className="flex items-center justify-between gap-4">
          <Countdown />
          <Link to="/firsatlar" className="hidden items-center gap-1 text-sm font-semibold text-char-800 hover:text-ember-700 md:flex">
            Tümü <ArrowRight size={15} />
          </Link>
        </div>
      </div>
      <Rail products={deals} />
    </section>
  )
}

function WinterBlock() {
  const { shopProducts, byHandle } = useStore()
  const heaters = useMemo(
    () => shopProducts.filter((p) => p.available && inCategory(p, 'isitici-soba')).sort((a, b) => b.popularity - a.popularity).slice(0, 12),
    [shopProducts],
  )
  const stars = ['egecamp-bunker-cadir-ve-kamp-sobasi', 'egecamp-cozy-kuzineli-cadir-ve-kamp-sobasi'].map((h) => byHandle[h]).filter(Boolean)
  return (
    <section className="topo relative mt-16 bg-char-900 py-14 text-white md:mt-24 md:py-20">
      <div className="shell">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-3 text-ember-300">Kış kampı</p>
            <h2 className="display text-[2.6rem] text-white md:text-[3.4rem]">
              Dışarısı kar,
              <br />
              <span className="text-ember">çadırın içi yaz.</span>
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-7 text-white/70">
              EgeCamp® Vesta serisi çadır sobaları ve Webesten dizel ısıtıcılar. Kurulum ve baca bağlantısı için mağazamız her zaman bir telefon uzağınızda.
            </p>
            <Link to="/kategori/isitici-soba" className="btn btn-primary mt-6">
              Tüm ısıtıcılar <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            {stars.map((p) => (
              <Link key={p.handle} to={`/urun/${p.handle}`} className="group flex flex-col overflow-hidden rounded-2xl bg-white text-char-900">
                <div className="relative aspect-[5/4] bg-white">
                  <ProductImg path={p.images[0]} alt={p.title} widths={[480, 720]} sizes="(min-width:1024px) 30vw, 90vw" className="absolute inset-0 h-full w-full p-4 transition-transform duration-500 group-hover:scale-[1.03]" />
                  <span className="absolute top-3 left-3 rounded-md bg-moss-600 px-2 py-1 text-[11px] font-bold text-white">ÜCRETSİZ KARGO</span>
                </div>
                <div className="flex items-end justify-between gap-3 border-t border-line p-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold tracking-wider text-ember-700 uppercase">EgeCamp® Vesta</p>
                    <p className="mt-0.5 line-clamp-2 text-[15px] leading-5 font-semibold">{p.title}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {p.compare && <p className="tnum text-xs text-char-400 line-through">{tl(p.compare)}</p>}
                    <p className="tnum text-lg font-bold">{tl(p.price)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-12 [&_a.group]:ring-0">
          <Rail products={heaters} />
        </div>
      </div>
    </section>
  )
}

function Series() {
  return (
    <section className="shell pt-16 md:pt-24">
      <SectionTitle eyebrow="Kendi markamız" title="EgeCamp® serileri" />
      <div className="no-scrollbar snap-x-mandatory -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:px-0">
        {SERIES.map((s) => (
          <Link key={s.slug} to={`/seri/${s.slug}`} className="group snap-start relative isolate aspect-[4/5] w-[72%] shrink-0 overflow-hidden rounded-2xl bg-char-900 md:w-auto">
            <img src={img(BRAND.seriesImages[s.slug], 700)} alt={s.name} loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-char-950/90 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="display text-2xl text-white">{s.name.replace('EgeCamp® ', '')}</p>
              <p className="mt-1 text-[13px] text-white/75">{s.blurb}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function FreeCampBlock() {
  const { shopProducts, campaigns } = useStore()
  const { totals } = useCart()
  const camp = campaigns.find((c) => c.id === 'freecamp-kademeli')
  const chairs = useMemo(
    () => shopProducts.filter((p) => p.brandSlug === 'freecamp' && inCategory(p, 'masa-sandalye') && p.available).sort((a, b) => b.popularity - a.popularity),
    [shopProducts],
  )
  if (!camp?.active || !chairs.length) return null
  const inCart = totals.lines.filter((l) => l.product.brandSlug === 'freecamp' && inCategory(l.product, 'masa-sandalye')).reduce((s, l) => s + l.qty, 0)
  return (
    <section className="shell pt-16 md:pt-24">
      <div className="topo-dark overflow-hidden rounded-3xl bg-ember-50 ring-1 ring-ember-100">
        <div className="grid gap-6 p-5 md:p-8 lg:grid-cols-12 lg:gap-10 lg:p-10">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-2">FreeCamp sandalyeler</p>
            <h2 className="display text-[2.4rem] md:text-[3rem]">Ne kadar çok, o kadar ucuz</h2>
            <p className="mt-3 text-[15px] leading-7 text-char-600">Farklı modelleri karıştırabilirsiniz. İndirim sepette kendiliğinden uygulanır.</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {camp.tiers.map((t) => (
                <div key={t.min} className={`rounded-2xl p-4 ${inCart >= t.min ? 'bg-moss-600 text-white' : 'bg-white ring-1 ring-ember-100'}`}>
                  <p className="display text-4xl">%{t.pct}</p>
                  <p className={`mt-1 text-sm ${inCart >= t.min ? 'text-white/85' : 'text-char-500'}`}>{t.min} adet ve üzeri</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[13px] text-char-500">
              Sepetinizde <b className="tnum text-char-900">{inCart}</b> FreeCamp sandalye var.
            </p>
          </div>
          <div className="min-w-0 lg:col-span-8">
            <Rail products={chairs} />
          </div>
        </div>
      </div>
    </section>
  )
}

function Tents() {
  const { shopProducts } = useStore()
  const tents = useMemo(
    () =>
      shopProducts
        .filter((p) => p.available && p.cats.includes('cadir') && /çadır/i.test(p.title) && !/kazı|halat|gerdirme|tente|branda|aksesuar/i.test(p.title))
        .sort((a, b) => b.popularity * (b.brandSlug === 'husky' ? 3 : 1) - a.popularity * (a.brandSlug === 'husky' ? 3 : 1))
        .slice(0, 14),
    [shopProducts],
  )
  return (
    <section className="shell pt-16 md:pt-24">
      <SectionTitle
        eyebrow="Husky çadırlarda sepette %10"
        title="Popüler kamp çadırları"
        action={
          <Link to="/kategori/cadir" className="hidden items-center gap-1 text-sm font-semibold text-char-800 hover:text-ember-700 sm:flex">
            Tüm çadırlar <ArrowRight size={15} />
          </Link>
        }
      />
      <Rail products={tents} />
    </section>
  )
}

function BestSellers() {
  const { shopProducts } = useStore()
  const list = useMemo(() => {
    const pool = shopProducts.filter((p) => p.available)
    const best = pool.filter((p) => p.best)
    const rest = pool.filter((p) => !p.best && p.price >= 400).sort((a, b) => b.popularity - a.popularity)
    return [...best, ...rest].slice(0, 14)
  }, [shopProducts])
  return (
    <section className="shell pt-16 md:pt-24">
      <SectionTitle eyebrow="Kampçıların seçimi" title="Çok satanlar" />
      <Rail products={list} />
    </section>
  )
}

function BrandMarquee() {
  const list = BRANDS.filter((b) => b.count >= 5).slice(0, 18)
  const loop = [...list, ...list]
  return (
    <section className="mt-16 overflow-hidden border-y border-line bg-white py-6 md:mt-24">
      <div className="flex w-max animate-marquee gap-12 hover:[animation-play-state:paused]">
        {loop.map((b, i) => (
          <Link key={`${b.slug}-${i}`} to={`/marka/${b.slug}`} className="display shrink-0 text-3xl text-char-300 transition-colors hover:text-char-900">
            {b.name}
          </Link>
        ))}
      </div>
    </section>
  )
}

function StoreStory() {
  return (
    <section className="shell pt-16 md:pt-24">
      <div className="grid overflow-hidden rounded-3xl bg-white ring-1 ring-line lg:grid-cols-2">
        <div className="relative min-h-72 lg:min-h-full">
          <img src={img(BRAND.storeImage, 1100)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        </div>
        <div className="p-6 md:p-10 lg:p-14">
          <p className="eyebrow mb-2">{BRAND.story.eyebrow}</p>
          <h2 className="display text-[2.4rem] md:text-[3rem]">{BRAND.story.title}</h2>
          {BRAND.story.paragraphs.map((t) => (
            <p key={t.slice(0, 20)} className="mt-4 text-[15px] leading-7 text-char-600">
              {t}
            </p>
          ))}
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-bone p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <MapPin size={16} className="text-ember-700" /> Mağazamız
              </p>
              <p className="mt-1.5 text-[13px] leading-5 text-char-600">
                {BRAND.addressLines[0]}
                <br />
                {BRAND.addressLines[1]}
              </p>
            </div>
            <div className="rounded-2xl bg-bone p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Store size={16} className="text-ember-700" /> Mağazadan teslim al
              </p>
              <p className="mt-1.5 text-[13px] leading-5 text-char-600">Siparişini online ver, aynı gün Bilecik mağazamızdan ücretsiz teslim al.</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/magaza" className="btn btn-dark">
              Yol tarifi al
            </Link>
            <a href={BRAND.instagramUrl} target="_blank" rel="noreferrer" className="btn btn-outline">
              <Instagram size={16} /> {BRAND.instagram}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function RecentlyViewed() {
  const { recent } = useCart()
  const { byHandle } = useStore()
  const list = recent.map((h) => byHandle[h]).filter(Boolean)
  if (list.length < 2) return null
  return (
    <section className="shell pt-16 md:pt-24">
      <SectionTitle eyebrow="Kaldığınız yerden" title="Son baktıklarınız" />
      <Rail products={list} />
    </section>
  )
}

export default function Home() {
  return (
    <>
      <Hero />
      <Usps />
      <CategoryGrid />
      <Deals />
      <WinterBlock />
      <Series />
      <FreeCampBlock />
      <Tents />
      <BrandMarquee />
      <BestSellers />
      <RecentlyViewed />
      <StoreStory />
    </>
  )
}
