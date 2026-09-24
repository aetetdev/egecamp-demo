import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { tl } from '../lib/format'

export default function Help() {
  const { settings } = useStore()
  const [open, setOpen] = useState(0)
  const faq = [
    ['Siparişim ne zaman kargoya verilir?', `Hafta içi ve Cumartesi saat ${settings.sameDayCutoff}:00’e kadar verilen siparişler aynı gün kargoya teslim edilir. Sonrasında verilen siparişler ertesi iş günü çıkar. Pazar günü kargo çıkışı yapılmaz.`],
    ['Kargo ücreti ne kadar?', `${tl(settings.freeShippingThreshold)} ve üzeri siparişlerde kargo ücretsizdir. Altındaki siparişlerde kargo ücreti ${tl(settings.shippingFee)}’dir. Bilecik mağazamızdan teslim almak her zaman ücretsizdir.`],
    ['İade ve değişim nasıl yapılır?', 'Ürünü teslim aldığınız tarihten itibaren 14 gün içinde, kullanılmamış ve ambalajı bozulmamış şekilde iade edebilirsiniz. Sipariş takip sayfasından iade talebi oluşturun; anlaşmalı kargo kodu SMS ile gelir, kargo ücreti bizden.'],
    ['Taksit seçenekleri neler?', 'Tüm kredi kartlarına 12 aya varan taksit yapılır. Bonus ve World kartlarda 3 taksit peşin fiyatına. Ürün sayfalarındaki “Taksit seçenekleri” sekmesinde bankaya göre tabloyu görebilirsiniz.'],
    ['Havale ile ödersem indirim var mı?', `Evet, havale/EFT ile ödemelerde sepete ek %${settings.transferDiscountPct} indirim uygulanır.`],
    ['Kapıda ödeme yapabilir miyim?', `Evet, nakit veya kartla kapıda ödeme seçeneği var. Hizmet bedeli ${tl(settings.codFee)}’dir.`],
    ['Çadır sobası kurulumunda destek veriyor musunuz?', 'Evet. Baca çıkışı, kıvılcım tutucu ve güvenli mesafe konusunda mağazamızda ya da WhatsApp’tan görüntülü destek veriyoruz.'],
  ]
  return (
    <div className="shell max-w-3xl py-10 md:py-16">
      <p className="eyebrow mb-2">Yardım</p>
      <h1 className="display text-[2.8rem] md:text-[3.4rem]">Kargo, iade ve sık sorulanlar</h1>
      <div className="mt-8 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
        {faq.map(([q, a], i) => (
          <div key={q}>
            <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-medium">
              {q}
              <ChevronDown size={18} className={`shrink-0 text-char-400 transition-transform ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && <p className="animate-fade px-5 pb-5 text-[14.5px] leading-7 text-char-600">{a}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
