import { useState } from 'react'
import { BadgePercent, Boxes, CheckCircle2, Handshake, LineChart, Truck } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { PROVINCES } from '../data/tr'
import { BRAND } from '../config/brand'
import { img } from '../data/catalog'

const BENEFITS = [
  [BadgePercent, 'Bayiye özel fiyat', 'Alım hacminize göre %15 – %25 arası liste fiyatı indirimi. Fiyatlarınızı bayi panelinden görürsünüz.'],
  [Boxes, 'EgeCamp® serileri', 'PRO, Comfort, Vesta ve Cargo serilerinin bölgesel satış hakkı.'],
  [Truck, 'Hızlı sevkiyat', 'Bilecik depodan 24 saatte çıkış. Koli ve palet gönderimleri anlaşmalı nakliyeyle.'],
  [LineChart, 'Cari hesap', 'Siparişlerinizi, faturalarınızı ve bakiyenizi bayi panelinden takip edin.'],
]

export default function Dealer() {
  const { submitDealerApp } = useStore()
  const [done, setDone] = useState(null)
  const [f, setF] = useState({ company: '', person: '', phone: '', city: '', type: 'Fiziki mağaza', volume: '25.000 – 50.000 TL', note: '' })
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  return (
    <div>
      <section className="topo relative isolate overflow-hidden bg-char-900 text-white">
        <img src={img(BRAND.seriesImages.cargo, 1600)} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-25" />
        <div className="shell py-14 md:py-20">
          <p className="eyebrow mb-3 text-ember-300">Bayilik & toptan satış</p>
          <h1 className="display max-w-3xl text-[3rem] text-white md:text-[4.4rem]">
            Bölgenizde <span className="text-ember">Ege Camp</span> olun
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/75">
            Outdoor mağazası, av bayisi ya da online satıcıysanız; 40’tan fazla markayı ve kendi serilerimizi bayi fiyatıyla sunuyoruz.
          </p>
        </div>
      </section>

      <div className="shell grid gap-10 py-12 md:py-16 lg:grid-cols-[1fr_28rem]">
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            {BENEFITS.map(([Icon, t, d]) => (
              <div key={t} className="rounded-2xl bg-white p-5 ring-1 ring-line">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ember-50 text-ember-700">
                  <Icon size={20} />
                </span>
                <p className="mt-3 font-semibold">{t}</p>
                <p className="mt-1 text-sm leading-6 text-char-600">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-line">
            <p className="flex items-center gap-2 font-semibold">
              <Handshake size={18} className="text-ember-700" /> Süreç nasıl işliyor?
            </p>
            <ol className="mt-4 space-y-3 text-[14px] text-char-700">
              {['Formu doldurursunuz, başvurunuz panelimize düşer.', 'Aynı gün içinde sizi arar, ihtiyacınızı dinleriz.', 'Onaylanan bayiye fiyat grubu atanır ve bayi paneli açılır.', 'Siparişinizi panelden verir, cari hesabınızdan takip edersiniz.'].map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-char-900 text-xs font-bold text-white">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div>
          {done ? (
            <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-line">
              <CheckCircle2 size={44} className="mx-auto text-moss-600" />
              <p className="display mt-4 text-3xl">Başvurunuz alındı</p>
              <p className="mt-2 text-sm text-char-500">
                Başvuru no <b className="tnum text-char-900">{done}</b>. En geç bir iş günü içinde sizi arayacağız.
              </p>
              <p className="mt-5 rounded-xl bg-bone p-3 text-xs text-char-500">Sunum notu: başvuru, yönetim panelinde Bayiler → Başvurular sekmesine düştü.</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setDone(submitDealerApp(f))
              }}
              className="space-y-3 rounded-2xl bg-white p-6 ring-1 ring-line lg:sticky lg:top-36"
            >
              <p className="display text-3xl">Bayilik başvurusu</p>
              <div>
                <label className="label">Firma adı</label>
                <input required value={f.company} onChange={set('company')} className="field" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Yetkili</label>
                  <input required value={f.person} onChange={set('person')} className="field" />
                </div>
                <div>
                  <label className="label">Telefon</label>
                  <input required value={f.phone} onChange={set('phone')} inputMode="tel" className="field" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">İl</label>
                  <select required value={f.city} onChange={set('city')} className="field">
                    <option value="">Seçin</option>
                    {PROVINCES.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Satış kanalı</label>
                  <select value={f.type} onChange={set('type')} className="field">
                    <option>Fiziki mağaza</option>
                    <option>Online mağaza</option>
                    <option>Online + fiziki</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Tahmini aylık alım</label>
                <select value={f.volume} onChange={set('volume')} className="field">
                  <option>25.000 TL altı</option>
                  <option>25.000 – 50.000 TL</option>
                  <option>50.000 – 100.000 TL</option>
                  <option>100.000 TL üzeri</option>
                </select>
              </div>
              <div>
                <label className="label">Not (isteğe bağlı)</label>
                <textarea rows={3} value={f.note} onChange={set('note')} placeholder="İlgilendiğiniz ürün grupları, mağaza bilgisi…" className="field" />
              </div>
              <button className="btn btn-primary btn-lg w-full">Başvuruyu gönder</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
