import { useState } from 'react'
import { Check, Clock, Instagram, MapPin, Navigation, Phone, Send } from 'lucide-react'
import { BRAND } from '../config/brand'
import { WhatsAppIcon } from '../components/site/SiteLayout'

export default function StorePage() {
  const [sent, setSent] = useState(false)
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(BRAND.mapQuery)}&z=16&output=embed`
  return (
    <div className="shell py-10 md:py-14">
      <p className="eyebrow mb-2">Mağazamız & iletişim</p>
      <h1 className="display text-[2.8rem] md:text-[3.6rem]">Bilecik’te bir kamp dükkânı</h1>
      <p className="mt-2 max-w-xl text-char-500">Ürünleri elinizle görmek, soba kurulumu için danışmak ya da sadece kamp sohbeti için uğrayın.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
          <iframe title="Mağaza konumu" src={mapSrc} className="h-80 w-full md:h-[28rem]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
            <p className="flex gap-3 text-[14.5px]">
              <MapPin size={19} className="mt-0.5 shrink-0 text-ember-700" />
              <span>
                <b>{BRAND.name}</b>
                <br />
                {BRAND.addressLines[0]}
                <br />
                {BRAND.addressLines[1]}
              </span>
            </p>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(BRAND.mapQuery)}`} target="_blank" rel="noreferrer" className="btn btn-dark mt-4 w-full">
              <Navigation size={16} /> Yol tarifi al
            </a>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
            <p className="mb-2 flex items-center gap-2 font-semibold">
              <Clock size={17} className="text-ember-700" /> Çalışma saatleri
            </p>
            {BRAND.hours.map(([d, h]) => (
              <p key={d} className="flex justify-between border-b border-line py-2 text-sm last:border-0">
                <span className="text-char-600">{d}</span>
                <span className="tnum font-medium">{h}</span>
              </p>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <a href={`tel:${BRAND.phoneHref}`} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-4 text-center text-sm ring-1 ring-line hover:ring-char-300">
              <Phone size={20} className="text-ember-700" />
              <span className="font-semibold">{BRAND.phone}</span>
            </a>
            <a href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-4 text-center text-sm ring-1 ring-line hover:ring-char-300">
              <span className="text-[#1ea952]">
                <WhatsAppIcon size={20} />
              </span>
              <span className="font-semibold">WhatsApp</span>
            </a>
            <a href={BRAND.instagramUrl} target="_blank" rel="noreferrer" className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-white p-4 text-sm font-semibold ring-1 ring-line hover:ring-char-300">
              <Instagram size={18} className="text-ember-700" /> {BRAND.instagram}
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 rounded-2xl bg-white p-6 ring-1 ring-line md:grid-cols-[1fr_1.4fr] md:p-8">
        <div>
          <p className="display text-3xl">Bize yazın</p>
          <p className="mt-2 text-sm text-char-500">Ürün, kargo ya da kurumsal alım… Mesai saatlerinde genelde bir saat içinde dönüyoruz.</p>
        </div>
        {sent ? (
          <p className="flex items-center gap-2 self-center font-semibold text-moss-700">
            <Check size={18} /> Mesajınız iletildi. Teşekkürler!
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSent(true)
            }}
            className="grid gap-3 sm:grid-cols-2"
          >
            <input required placeholder="Adınız" className="field" />
            <input required placeholder="Telefon veya e-posta" className="field" />
            <textarea required rows={3} placeholder="Mesajınız" className="field sm:col-span-2" />
            <button className="btn btn-dark sm:col-span-2 sm:justify-self-start">
              <Send size={15} /> Gönder
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
