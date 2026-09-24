import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from './ProductCard'

/** Yatay kaydırmalı ürün şeridi — mobilde parmakla, masaüstünde oklarla */
export default function Rail({ products }) {
  const ref = useRef(null)
  const scroll = (dir) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }
  return (
    <div className="relative">
      <div ref={ref} className="no-scrollbar snap-x-mandatory -mx-4 flex gap-2.5 overflow-x-auto scroll-px-4 px-4 pb-2 sm:gap-4 md:-mx-8 md:scroll-px-8 md:px-8">
        {products.map((p) => (
          <div key={p.handle} className="snap-start w-[46%] shrink-0 sm:w-[31%] lg:w-[23.2%] xl:w-[18.8%]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Önceki"
        onClick={() => scroll(-1)}
        className="absolute top-[38%] -left-3 hidden h-10 w-10 items-center justify-center rounded-full bg-white text-char-700 ring-1 ring-line card-lift hover:text-char-950 lg:flex"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        aria-label="Sonraki"
        onClick={() => scroll(1)}
        className="absolute top-[38%] -right-3 hidden h-10 w-10 items-center justify-center rounded-full bg-white text-char-700 ring-1 ring-line card-lift hover:text-char-950 lg:flex"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
