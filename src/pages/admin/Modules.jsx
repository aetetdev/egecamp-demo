import { Check, Lock, RotateCcw, Sparkles } from 'lucide-react'
import { MODULE_LIST, PLANS } from '../../config/modules'
import { useStore, clearAll } from '../../store/StoreContext'
import { Card, PageHeader, Pill, useToast } from '../../components/admin/AdminUI'

export default function Modules() {
  const { plan, setPlanId, hasModule } = useStore()
  const toast = useToast()
  return (
    <div>
      <PageHeader title="Modüller ve paket" sub="İhtiyacınız kadarını alın; büyüdükçe tek tıkla modül ekleyin" />

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => {
          const current = p.id === plan.id
          return (
            <div key={p.id} className={`relative flex flex-col rounded-2xl p-6 ${current ? 'bg-char-900 text-white ring-2 ring-ember' : 'bg-white ring-1 ring-line'}`}>
              {p.popular && <span className="absolute -top-3 left-6 rounded-full bg-ember px-3 py-1 text-[11px] font-bold text-char-950">En çok tercih edilen</span>}
              <p className={`text-[12px] font-bold tracking-[0.16em] uppercase ${current ? 'text-ember-300' : 'text-ember-700'}`}>{p.tagline}</p>
              <p className="mt-1 font-sans text-2xl font-bold tracking-tight normal-case">{p.name}</p>
              <p className={`mt-2 text-[13.5px] ${current ? 'text-white/65' : 'text-char-500'}`}>{p.best}</p>
              <ul className="mt-5 flex-1 space-y-2">
                {MODULE_LIST.map((m) => {
                  const on = p.modules.includes(m.id)
                  return (
                    <li key={m.id} className={`flex items-center gap-2 text-[13.5px] ${on ? '' : current ? 'text-white/30' : 'text-char-300'}`}>
                      {on ? <Check size={15} className={current ? 'text-ember' : 'text-moss-600'} /> : <Lock size={13} />}
                      {m.name}
                    </li>
                  )
                })}
              </ul>
              {current ? (
                <p className="mt-6 flex h-10 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold">Mevcut paketiniz</p>
              ) : (
                <button
                  onClick={() => {
                    setPlanId(p.id)
                    toast(`${p.name} paketine geçildi (demo)`)
                  }}
                  className="btn btn-dark mt-6"
                >
                  <Sparkles size={15} /> {p.name} paketine geç
                </button>
              )}
            </div>
          )
        })}
      </div>

      <Card title="Tüm modüller" className="mt-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {MODULE_LIST.map((m) => {
            const on = hasModule(m.id)
            return (
              <div key={m.id} className={`rounded-xl p-4 ring-1 ${on ? 'ring-line' : 'bg-bone ring-line'}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{m.name}</p>
                  {on ? <Pill tone="moss">Açık</Pill> : <Pill><Lock size={11} /> {PLANS.find((p) => p.modules.includes(m.id))?.name}</Pill>}
                </div>
                <p className="mt-1.5 text-[13px] leading-5 text-char-600">{m.desc}</p>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="mt-6 flex flex-col items-start gap-3 rounded-2xl bg-white p-5 ring-1 ring-line md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">Demo verisini sıfırla</p>
          <p className="text-[13px] text-char-500">Sunum sırasında verilen siparişler, fiyat değişiklikleri ve kampanya ayarları ilk hâline döner.</p>
        </div>
        <button
          onClick={() => {
            clearAll()
            window.location.href = '/yonetim/giris'
          }}
          className="btn btn-outline btn-sm"
        >
          <RotateCcw size={15} /> Sıfırla
        </button>
      </div>
    </div>
  )
}
