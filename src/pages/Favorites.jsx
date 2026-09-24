import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useCart } from '../store/CartContext'
import { useStore } from '../store/StoreContext'
import { ProductGrid } from '../components/site/ProductCard'

export default function Favorites() {
  const { favorites } = useCart()
  const { byHandle } = useStore()
  const list = favorites.map((h) => byHandle[h]).filter(Boolean)
  return (
    <div className="shell py-8 md:py-12">
      <h1 className="display text-[2.6rem] md:text-[3.2rem]">Favorilerim</h1>
      <p className="mt-1 text-char-500">Beğendiklerinizi burada saklıyoruz. Fiyatı düşünce haber veririz.</p>
      {list.length ? (
        <ProductGrid products={list} className="mt-6" />
      ) : (
        <div className="mt-8 rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-line">
          <Heart size={30} className="mx-auto text-char-300" />
          <p className="mt-3 font-semibold">Henüz favori ürününüz yok</p>
          <p className="mt-1 text-sm text-char-500">Ürün kartlarındaki kalbe dokunarak ekleyebilirsiniz.</p>
          <Link to="/urunler" className="btn btn-dark mt-5">
            Ürünlere göz at
          </Link>
        </div>
      )}
    </div>
  )
}
