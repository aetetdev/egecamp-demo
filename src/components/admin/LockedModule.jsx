import { Link } from 'react-router-dom'
import { Check, Lock, Sparkles } from 'lucide-react'
import { PLANS } from '../../config/modules'
import { useStore } from '../../store/StoreContext'

const PREVIEW = {
  dealers: ['Bayi başvurularını tek tıkla onaylama', 'Bayiye özel fiyat grubu (%15 – %25)', 'Cari bakiye ve vade takibi', 'Bayi paneli: bayi kendi siparişini verir'],
  marketplace: ['Trendyol, Hepsiburada, N11 tek stoktan', 'Kanal bazında fiyat kuralı (+%12 gibi)', 'Pazaryeri siparişleri bu panele düşer', 'Hatalı ilanlar için uyarı listesi'],
  reports: ['Kategori ve marka kârlılığı', 'Şehir dağılımı ve dönüşüm hunisi', 'Aranıp bulunamayan ürünler', 'Excel’e tek tıkla aktarım'],
  inventory: ['Varyant bazında kritik stok uyarısı', 'Satış hızına göre “kaç gün yeter”', 'Stoğa girince haber ver listesi', 'Stok hareket kaydı'],
  campaigns: ['“2 al %5, 4 al %10” kademeli indirim', 'Marka ve kategoriye sepette indirim', 'Kupon kodları ve kullanım limiti', 'Açıp kapatınca anında vitrine yansır'],
  returns: ['Müşteri iade talebini siteden açar', 'Anlaşmalı kargo kodu otomatik', 'Onaylanan iade ödemesi otomatik', 'İade sebebi raporu'],
  customers: ['Müşteri geçmişi ve yaşam boyu değer', 'VIP / riskli / kayıp segmentleri', 'Segmente toplu WhatsApp / SMS', 'Kupon gönderimi'],
}

export default function LockedModule({ module }) {
  const { plan, setPlanId } = useStore()
  const target = PLANS.find((p) => p.modules.includes(module.id))
  return (
    <div className="mx-auto max-w-3xl py-6 md:py-12">
      <div className="relative overflow-hidden rounded-3xl bg-white ring-1 ring-line">
        <div className="topo relative bg-char-900 px-6 py-10 text-white md:px-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ember text-char-950">
            <Lock size={22} />
          </span>
          <p className="mt-5 text-[12px] font-bold tracking-[0.16em] text-ember-300 uppercase">{target?.name} paketinde</p>
          <h1 className="mt-1 font-sans text-3xl font-bold tracking-tight text-white normal-case">{module.name}</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-7 text-white/70">{module.desc}</p>
        </div>
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-end md:p-10">
          <ul className="space-y-2.5">
            {(PREVIEW[module.id] ?? []).map((t) => (
              <li key={t} className="flex gap-2.5 text-[14.5px] text-char-700">
                <Check size={18} className="mt-0.5 shrink-0 text-moss-600" /> {t}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2">
            {target && (
              <button onClick={() => setPlanId(target.id)} className="btn btn-primary btn-lg">
                <Sparkles size={17} /> {target.name} paketine geç
              </button>
            )}
            <Link to="/yonetim/moduller" className="btn btn-outline">
              Paketleri karşılaştır
            </Link>
            <p className="text-center text-[11.5px] text-char-400">Şu an: {plan.name} · demo, anında geçer</p>
          </div>
        </div>
      </div>
    </div>
  )
}
