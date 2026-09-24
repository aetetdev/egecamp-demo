import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="shell flex flex-col items-center py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-ember-700 ring-1 ring-line">
        <Compass size={34} />
      </div>
      <p className="display mt-6 text-7xl text-char-200">404</p>
      <h1 className="display mt-1 text-4xl">Rotadan çıktınız</h1>
      <p className="mt-2 max-w-sm text-char-500">Aradığınız sayfa kaldırılmış ya da hiç var olmamış olabilir. Pusulayı ana sayfaya çevirelim.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="btn btn-dark">
          Ana sayfa
        </Link>
        <Link to="/urunler" className="btn btn-outline">
          Tüm ürünler
        </Link>
      </div>
    </div>
  )
}
