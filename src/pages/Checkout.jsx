import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Banknote,
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  Landmark,
  Lock,
  MapPin,
  ShieldCheck,
  Store,
  Truck,
  Wand2,
} from 'lucide-react'
import { BRAND, CARGO_COMPANIES, INSTALLMENT_PLANS } from '../config/brand'
import { PROVINCES } from '../data/tr'
import { useCart } from '../store/CartContext'
import { useStore } from '../store/StoreContext'
import { computeCart, installment } from '../lib/pricing'
import { dayMonth, tl } from '../lib/format'
import { Modal, ProductImg } from '../components/ui/Bits'
import { CouponBox, Summary } from './Cart'

const DEMO = {
  email: 'ornek.musteri@gmail.com',
  phone: '0532 418 27 60',
  name: 'Deniz Yılmaz',
  city: 'İstanbul',
  district: 'Kadıköy',
  address: 'Caferağa Mah. Moda Cad. No:18 D:4',
}

function Section({ n, title, children, done }) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-line md:p-6">
      <h2 className="mb-4 flex items-center gap-3 font-sans text-[17px] font-semibold tracking-normal normal-case">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold ${done ? 'bg-moss-600 text-white' : 'bg-char-900 text-white'}`}>
          {done ? <Check size={15} /> : n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Choice({ checked, onChange, icon: Icon, title, sub, right, children }) {
  return (
    <label className={`block cursor-pointer rounded-xl p-4 ring-1 transition ${checked ? 'bg-ember-50/60 ring-2 ring-ember' : 'ring-stone hover:ring-char-300'}`}>
      <div className="flex items-center gap-3">
        <input type="radio" checked={checked} onChange={onChange} className="h-4 w-4 accent-[var(--color-char-900)]" />
        {Icon && <Icon size={19} className="text-char-500" />}
        <div className="min-w-0 flex-1">
          <p className="text-[14.5px] font-semibold">{title}</p>
          {sub && <p className="text-[12.5px] text-char-500">{sub}</p>}
        </div>
        {right}
      </div>
      {checked && children && <div className="mt-4 animate-fade border-t border-ember-100 pt-4">{children}</div>}
    </label>
  )
}

export default function Checkout() {
  const { lines, couponCode, clear } = useCart()
  const { campaigns, coupons, settings, placeOrder } = useStore()
  const navigate = useNavigate()
  const [f, setF] = useState({ email: '', phone: '', name: '', city: '', district: '', address: '', invoiceType: 'bireysel', company: '', taxNo: '', taxOffice: '', sameInvoice: true })
  const [delivery, setDelivery] = useState('kargo')
  const [cargo, setCargo] = useState(CARGO_COMPANIES[0])
  const [payment, setPayment] = useState('kart')
  const [inst, setInst] = useState(1)
  const [agree, setAgree] = useState(false)
  const [sms, setSms] = useState(true)
  const [errors, setErrors] = useState({})
  const [secure, setSecure] = useState(false)
  const [contract, setContract] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [placing, setPlacing] = useState(false)

  const totals = useMemo(
    () => computeCart(lines, { campaigns, coupons, settings, couponCode, payment, delivery }),
    [lines, campaigns, coupons, settings, couponCode, payment, delivery],
  )
  const plan = INSTALLMENT_PLANS[0]
  const installOptions = [1, 2, 3, 6, 9, 12].filter((n) => n === 1 || totals.total >= 500)
  const chosen = installment(totals.total, inst, plan.rates[inst] ?? 0)

  if (!lines.length && !placing) return <Navigate to="/sepet" replace />

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const eta = new Date(Date.now() + 2 * 86400000)

  const validate = () => {
    const e = {}
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Geçerli bir e-posta girin'
    if (f.phone.replace(/\D/g, '').length < 10) e.phone = 'Telefon numarası eksik'
    if (!f.name.trim()) e.name = 'Ad soyad gerekli'
    if (delivery === 'kargo') {
      if (!f.city) e.city = 'İl seçin'
      if (!f.district.trim()) e.district = 'İlçe gerekli'
      if (f.address.trim().length < 8) e.address = 'Açık adresi yazın'
    }
    if (f.invoiceType === 'kurumsal' && (!f.company || !f.taxNo)) e.company = 'Firma adı ve vergi numarası gerekli'
    if (!agree) e.agree = 'Devam etmek için sözleşmeleri onaylayın'
    setErrors(e)
    if (Object.keys(e).length) {
      document.getElementById(`f-${Object.keys(e)[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return false
    }
    return true
  }

  const finish = () => {
    const order = placeOrder({
      customer: { name: f.name, city: delivery === 'magaza' ? BRAND.city : f.city, district: delivery === 'magaza' ? 'Mağazadan teslim' : f.district, phone: f.phone, email: f.email, address: f.address },
      items: totals.lines.map((l) => ({
        handle: l.product.handle,
        title: l.product.title,
        brand: l.product.brand,
        image: l.product.images[0],
        variant: l.variant.title,
        variantId: l.variant.id,
        qty: l.qty,
        unit: l.unit,
        total: Math.round((l.total - l.discount) * 100) / 100,
        cat: l.product.cats[0],
        top: l.product.top,
        cost: Math.round(l.unit * l.product.costRatio * 100) / 100,
      })),
      subtotal: totals.subtotal,
      discount: Math.round((totals.campaignDiscount + (totals.coupon?.amount ?? 0)) * 100) / 100,
      coupon: totals.coupon?.code ?? null,
      shipping: totals.shipping,
      payment,
      payAdj: totals.paymentAdj,
      installments: payment === 'kart' ? inst : 1,
      total: payment === 'kart' ? chosen.grand : totals.total,
      delivery,
      cargo: delivery === 'kargo' ? cargo : null,
      tracking: null,
      invoice: null,
      channel: window.innerWidth < 768 ? 'mobil' : 'masaustu',
      invoiceInfo: f.invoiceType === 'kurumsal' ? { company: f.company, taxNo: f.taxNo, taxOffice: f.taxOffice } : null,
      smsOptIn: sms,
    })
    setPlacing(true)
    navigate(`/siparis/${order.no}`, { replace: true })
    clear()
  }

  const submit = (e) => {
    e.preventDefault()
    if (!validate()) return
    if (payment === 'kart') setSecure(true)
    else finish()
  }

  const err = (k) => errors[k] && <p className="mt-1 text-xs text-flame">{errors[k]}</p>
  const fieldCls = (k) => `field ${errors[k] ? 'border-flame' : ''}`

  return (
    <div className="min-h-screen bg-bone">
      <header className="border-b border-line bg-white">
        <div className="shell flex h-16 items-center justify-between">
          <Link to="/sepet" className="flex items-center gap-1.5 text-sm text-char-500 hover:text-char-900">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Sepete dön</span>
          </Link>
          <Link to="/">
            <img src={BRAND.logo} alt={BRAND.name} className="h-8 w-auto" />
          </Link>
          <span className="flex items-center gap-1.5 text-xs font-medium text-moss-600">
            <Lock size={14} /> <span className="hidden sm:inline">Güvenli ödeme</span>
          </span>
        </div>
      </header>

      {/* Mobil sipariş özeti */}
      <div className="border-b border-line bg-white lg:hidden">
        <button onClick={() => setSummaryOpen((x) => !x)} className="shell flex w-full items-center justify-between py-3.5 text-sm">
          <span className="flex items-center gap-1.5 font-medium text-char-700">
            Sipariş özeti ({totals.itemCount} ürün) <ChevronDown size={15} className={summaryOpen ? 'rotate-180' : ''} />
          </span>
          <span className="tnum font-bold">{tl(payment === 'kart' ? chosen.grand : totals.total)}</span>
        </button>
        {summaryOpen && (
          <div className="shell animate-fade space-y-4 pb-5">
            <CouponBox />
            <Summary totals={totals} />
          </div>
        )}
      </div>

      <form onSubmit={submit} className="shell grid gap-6 py-6 md:py-10 lg:grid-cols-[1fr_25rem] lg:gap-10" noValidate>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-char-900 px-4 py-3 text-white">
            <p className="text-[13px] text-white/80">Sunum için formu tek tıkla doldurabilirsiniz.</p>
            <button type="button" onClick={() => setF((x) => ({ ...x, ...DEMO }))} className="btn btn-primary btn-sm">
              <Wand2 size={15} /> Demo bilgileriyle doldur
            </button>
          </div>

          <Section n={1} title="İletişim bilgileri" done={f.email && f.phone}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div id="f-email">
                <label className="label" htmlFor="email">E-posta</label>
                <input id="email" type="email" value={f.email} onChange={set('email')} placeholder="ornek@mail.com" className={fieldCls('email')} autoComplete="email" />
                {err('email')}
              </div>
              <div id="f-phone">
                <label className="label" htmlFor="phone">Cep telefonu</label>
                <input id="phone" type="tel" inputMode="tel" value={f.phone} onChange={set('phone')} placeholder="05xx xxx xx xx" className={fieldCls('phone')} autoComplete="tel" />
                {err('phone')}
              </div>
            </div>
            <p className="mt-3 text-xs text-char-400">Üye olmadan devam ediyorsunuz. Sipariş ve kargo bilgisi bu numaraya SMS ile gelir.</p>
          </Section>

          <Section n={2} title="Teslimat" done={f.name && (delivery === 'magaza' || f.address)}>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Choice checked={delivery === 'kargo'} onChange={() => setDelivery('kargo')} icon={Truck} title="Adrese teslim" sub={`Tahmini ${dayMonth(eta)}`} />
              {settings.pickupEnabled && (
                <Choice checked={delivery === 'magaza'} onChange={() => setDelivery('magaza')} icon={Store} title="Mağazadan teslim al" sub="Bilecik merkez · ücretsiz" />
              )}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div id="f-name" className="sm:col-span-2">
                <label className="label" htmlFor="name">Ad soyad</label>
                <input id="name" value={f.name} onChange={set('name')} className={fieldCls('name')} autoComplete="name" />
                {err('name')}
              </div>
              {delivery === 'kargo' ? (
                <>
                  <div id="f-city">
                    <label className="label" htmlFor="city">İl</label>
                    <select id="city" value={f.city} onChange={set('city')} className={fieldCls('city')}>
                      <option value="">Seçin</option>
                      {PROVINCES.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                    {err('city')}
                  </div>
                  <div id="f-district">
                    <label className="label" htmlFor="district">İlçe</label>
                    <input id="district" value={f.district} onChange={set('district')} className={fieldCls('district')} />
                    {err('district')}
                  </div>
                  <div id="f-address" className="sm:col-span-2">
                    <label className="label" htmlFor="address">Açık adres</label>
                    <textarea id="address" rows={2} value={f.address} onChange={set('address')} placeholder="Mahalle, cadde/sokak, bina ve daire no" className={fieldCls('address')} autoComplete="street-address" />
                    {err('address')}
                  </div>
                </>
              ) : (
                <div className="flex gap-3 rounded-xl bg-bone p-4 text-[13.5px] sm:col-span-2">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-ember-700" />
                  <div>
                    <p className="font-semibold">{BRAND.name}</p>
                    <p className="text-char-600">{BRAND.address}</p>
                    <p className="mt-1 text-char-500">Siparişiniz hazır olunca SMS gelir (genelde 2 saat içinde). Teslim alırken sipariş numaranızı söylemeniz yeterli.</p>
                  </div>
                </div>
              )}
            </div>

            {delivery === 'kargo' && (
              <div className="mt-5">
                <p className="label">Kargo firması</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {CARGO_COMPANIES.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setCargo(c)}
                      className={`rounded-lg px-3 py-2.5 text-left text-[13px] ring-1 ${cargo === c ? 'bg-char-900 text-white ring-char-900' : 'bg-white ring-stone hover:ring-char-300'}`}
                    >
                      <span className="block font-semibold">{c}</span>
                      <span className={`text-[11.5px] ${cargo === c ? 'text-white/70' : 'text-char-400'}`}>{totals.shipping ? tl(totals.shipping) : 'Ücretsiz'} · 1–3 iş günü</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 border-t border-line pt-4">
              <p className="label">Fatura</p>
              <div className="flex gap-2">
                {[
                  ['bireysel', 'Bireysel'],
                  ['kurumsal', 'Kurumsal'],
                ].map(([v, l]) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setF((x) => ({ ...x, invoiceType: v }))}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-[13px] font-medium ring-1 ${f.invoiceType === v ? 'bg-char-900 text-white ring-char-900' : 'ring-stone'}`}
                  >
                    {v === 'kurumsal' && <Building2 size={14} />}
                    {l}
                  </button>
                ))}
              </div>
              {f.invoiceType === 'kurumsal' && (
                <div id="f-company" className="mt-3 grid animate-fade gap-3 sm:grid-cols-3">
                  <input placeholder="Firma unvanı" value={f.company} onChange={set('company')} className={`${fieldCls('company')} sm:col-span-3`} />
                  <input placeholder="Vergi / TC no" value={f.taxNo} onChange={set('taxNo')} inputMode="numeric" className={fieldCls('company')} />
                  <input placeholder="Vergi dairesi" value={f.taxOffice} onChange={set('taxOffice')} className="field sm:col-span-2" />
                  <div className="sm:col-span-3">{err('company')}</div>
                </div>
              )}
              <p className="mt-2 text-xs text-char-400">e-Arşiv faturanız sipariş kargoya verildiğinde e-postanıza gönderilir.</p>
            </div>
          </Section>

          <Section n={3} title="Ödeme">
            <div className="space-y-2.5">
              <Choice checked={payment === 'kart'} onChange={() => setPayment('kart')} icon={CreditCard} title="Kredi / banka kartı" sub="12 aya varan taksit · 3D Secure" right={<span className="text-[11px] font-bold tracking-wide text-char-400">iyzico</span>}>
                <p className="mb-2 text-[13px] font-medium text-char-700">Taksit seçimi</p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {installOptions.map((n) => {
                    const r = plan.rates[n]
                    const x = installment(totals.total, n, r)
                    return (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setInst(n)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] ring-1 ${inst === n ? 'bg-white ring-2 ring-char-900' : 'bg-white ring-stone'}`}
                      >
                        <span className="font-medium">{n === 1 ? 'Tek çekim' : `${n} × ${tl(x.monthly)}`}</span>
                        <span className={`tnum text-xs ${r === 0 && n > 1 ? 'font-semibold text-moss-600' : 'text-char-400'}`}>{r === 0 && n > 1 ? 'Vade farksız' : tl(x.grand)}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed border-stone bg-white p-4 text-[12.5px] text-char-500">
                  <ShieldCheck size={20} className="shrink-0 text-moss-600" />
                  <p>
                    <b className="text-char-800">Demo:</b> Kart bilgisi istenmez. Canlı sistemde bu alanda ödeme kuruluşunun (iyzico / PayTR) güvenli kart formu açılır; kart numarası mağazanın sunucusuna hiç uğramaz. Tablo Bonus kart oranlarını gösterir, diğer kartlarda oran kart numarasıyla güncellenir.
                  </p>
                </div>
              </Choice>
              <Choice
                checked={payment === 'havale'}
                onChange={() => setPayment('havale')}
                icon={Landmark}
                title="Havale / EFT"
                sub={`%${settings.transferDiscountPct} ek indirim`}
                right={<span className="rounded bg-moss-50 px-1.5 py-0.5 text-[11px] font-bold text-moss-700">−{tl(Math.abs(computeCart(lines, { campaigns, coupons, settings, couponCode, payment: 'havale', delivery }).paymentAdj))}</span>}
              >
                <p className="text-[13px] text-char-600">IBAN bilgileri sipariş onayından sonra gösterilir ve SMS ile gönderilir. Ödemeniz 24 saat içinde ulaşmazsa sipariş iptal edilir.</p>
              </Choice>
              <Choice checked={payment === 'kapida'} onChange={() => setPayment('kapida')} icon={Banknote} title="Kapıda ödeme" sub="Nakit veya kart" right={<span className="tnum text-[12px] text-char-500">+{tl(settings.codFee)}</span>} />
            </div>
          </Section>

          <div id="f-agree" className="space-y-2.5 rounded-2xl bg-white p-5 ring-1 ring-line">
            <label className="flex cursor-pointer items-start gap-3 text-[13.5px] text-char-700">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-char-900)]" />
              <span>
                <button type="button" onClick={() => setContract(true)} className="font-semibold underline">
                  Ön bilgilendirme formunu
                </button>{' '}
                ve{' '}
                <button type="button" onClick={() => setContract(true)} className="font-semibold underline">
                  mesafeli satış sözleşmesini
                </button>{' '}
                okudum, onaylıyorum.
              </span>
            </label>
            {err('agree')}
            <label className="flex cursor-pointer items-start gap-3 text-[13.5px] text-char-700">
              <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-char-900)]" />
              <span>Kampanya ve yeni ürün duyurularını SMS / e-posta ile almak istiyorum.</span>
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full text-base lg:hidden">
            <Lock size={17} /> Siparişi onayla · {tl(payment === 'kart' ? chosen.grand : totals.total)}
          </button>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-4 rounded-2xl bg-white p-5 ring-1 ring-line">
            <p className="font-semibold">Sipariş özeti</p>
            <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {totals.lines.map((l) => (
                <li key={l.key} className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 rounded-lg bg-white ring-1 ring-line">
                    <ProductImg path={l.product.images[0]} widths={[120, 120]} sizes="56px" alt="" className="absolute inset-0 h-full w-full rounded-lg p-1" />
                    <span className="tnum absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-char-700 px-1 text-[10.5px] font-bold text-white">{l.qty}</span>
                  </div>
                  <div className="min-w-0 flex-1 text-[13px]">
                    <p className="line-clamp-2 leading-5">{l.product.title}</p>
                    {l.variant.title && <p className="text-xs text-char-400">{l.variant.title}</p>}
                  </div>
                  <p className="tnum text-[13px] font-medium">{tl(l.total - l.discount)}</p>
                </li>
              ))}
            </ul>
            <CouponBox />
            <Summary totals={totals}>
              {payment === 'kart' && inst > 1 && chosen.grand !== totals.total && (
                <div className="flex justify-between text-[13px] text-char-500">
                  <span>Vade farkı ({inst} taksit)</span>
                  <span className="tnum">+{tl(chosen.grand - totals.total)}</span>
                </div>
              )}
            </Summary>
            {payment === 'kart' && inst > 1 && (
              <p className="tnum -mt-1 text-right text-xs text-char-500">
                {inst} × {tl(chosen.monthly)} · toplam {tl(chosen.grand)}
              </p>
            )}
            <button type="submit" className="btn btn-primary btn-lg w-full">
              <Lock size={17} /> Siparişi onayla
            </button>
            <p className="text-center text-[11.5px] leading-5 text-char-400">Bu bir demodur. Gerçek ödeme alınmaz, kart bilgisi istenmez.</p>
          </div>
        </aside>
      </form>

      <Modal open={secure} onClose={() => setSecure(false)} title="Banka doğrulama (simülasyon)">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-moss-50 text-moss-600">
            <ShieldCheck size={28} />
          </div>
          <p className="mt-4 text-[15px]">
            <b className="tnum">{tl(chosen.grand)}</b> tutarındaki {inst > 1 ? `${inst} taksitli ` : ''}ödeme için 3D Secure doğrulaması
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13px] text-char-500">
            Canlı sistemde bu adımda müşterinin bankasının SMS doğrulama sayfası açılır. Demoda onaylamanız yeterli.
          </p>
          <button onClick={finish} className="btn btn-primary btn-lg mt-6 w-full">
            Ödemeyi onayla (demo)
          </button>
          <button onClick={() => setSecure(false)} className="btn btn-ghost mt-2 w-full">
            Vazgeç
          </button>
        </div>
      </Modal>

      <Modal open={contract} onClose={() => setContract(false)} title="Ön bilgilendirme ve mesafeli satış">
        <div className="space-y-3 text-[13.5px] leading-6 text-char-600">
          <p>
            <b className="text-char-900">Satıcı:</b> {BRAND.name}, {BRAND.address}. Tel: {BRAND.phone}
          </p>
          <p>Sözleşme konusu ürünlerin nitelikleri, satış fiyatı, ödeme şekli ve teslimat bilgileri sipariş özetinde yer almaktadır. Fiyatlara KDV dahildir.</p>
          <p>Alıcı, ürünü teslim aldığı tarihten itibaren 14 gün içinde hiçbir gerekçe göstermeksizin cayma hakkını kullanabilir. Cayma bildiriminin ardından bedel 14 gün içinde iade edilir.</p>
          <p className="rounded-lg bg-bone p-3 text-xs">Canlı sistemde bu metinler 6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği’ne uygun şablonlardan, siparişe özel bilgilerle otomatik üretilir ve müşteriye e-postayla gönderilir.</p>
        </div>
      </Modal>
    </div>
  )
}
