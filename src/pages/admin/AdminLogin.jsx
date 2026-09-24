import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, LogIn, Sparkles } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { BRAND } from '../../config/brand'
import { img } from '../../data/catalog'

export default function AdminLogin() {
  const { setAuthed } = useStore()
  const navigate = useNavigate()
  const loc = useLocation()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const go = () => {
    setAuthed(true)
    navigate(loc.state?.from ?? '/yonetim', { replace: true })
  }
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-char-900 lg:block">
        <img src={img(BRAND.hero[0].image, 1400)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" style={{ objectPosition: 'center 75%' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-char-950 via-char-950/40 to-char-950/10" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="display text-5xl">
            Mağazanız,
            <br />
            <span className="text-ember">tek panelde.</span>
          </p>
          <p className="mt-4 max-w-md text-[15px] leading-7 text-white/70">Sipariş, stok, kampanya, bayi ve pazaryeri — Bilecik’teki dükkândan da, telefondan da.</p>
        </div>
      </div>
      <div className="flex flex-col bg-bone px-6 py-8 md:px-12">
        <Link to="/" className="flex items-center gap-1.5 text-sm text-char-500 hover:text-char-900">
          <ArrowLeft size={16} /> Mağazaya dön
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <img src={BRAND.logo} alt={BRAND.name} className="h-10 w-auto self-start" />
          <h1 className="mt-8 font-sans text-2xl font-bold tracking-tight normal-case">Yönetim paneline giriş</h1>
          <p className="mt-1 text-sm text-char-500">Demo sürüm — örnek verilerle çalışır.</p>
          <button onClick={go} className="btn btn-primary btn-lg mt-8 w-full">
            <Sparkles size={17} /> Demo hesabıyla gir
          </button>
          <div className="my-6 flex items-center gap-3 text-xs text-char-400">
            <span className="h-px flex-1 bg-line" /> veya <span className="h-px flex-1 bg-line" />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (email.trim().toLowerCase() === BRAND.demoEmail && pass === BRAND.demoPassword) go()
              else setErr('E-posta veya şifre hatalı.')
            }}
            className="space-y-3"
          >
            <div>
              <label className="label">E-posta</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={BRAND.demoEmail} className="field" autoComplete="username" />
            </div>
            <div>
              <label className="label">Şifre</label>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" className="field" autoComplete="current-password" />
            </div>
            {err && <p className="text-sm text-flame">{err}</p>}
            <button className="btn btn-dark w-full">
              <LogIn size={16} /> Giriş yap
            </button>
          </form>
          <p className="mt-6 flex items-center gap-1.5 text-xs text-char-400">
            <Lock size={12} /> Canlı sistemde iki adımlı doğrulama ve personel rolleri vardır.
          </p>
        </div>
      </div>
    </div>
  )
}
