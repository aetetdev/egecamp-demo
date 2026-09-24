/** Sipariş durumları — vitrin ve panel aynı etiketleri kullanır */

export const STATUS = {
  yeni: { label: 'Yeni', pill: 'bg-sky-50 text-sky-600', dot: 'bg-sky-600' },
  hazirlaniyor: { label: 'Hazırlanıyor', pill: 'bg-ember-50 text-ember-800', dot: 'bg-ember' },
  kargoda: { label: 'Kargoda', pill: 'bg-[#f1ecfb] text-[#5b3fa6]', dot: 'bg-[#6d4fc2]' },
  teslim: { label: 'Teslim edildi', pill: 'bg-moss-50 text-moss-700', dot: 'bg-moss-500' },
  iade: { label: 'İade edildi', pill: 'bg-mist text-char-600', dot: 'bg-char-400' },
  iptal: { label: 'İptal', pill: 'bg-flame-50 text-flame', dot: 'bg-flame' },
}

export const NEXT_STATUS = {
  yeni: ['hazirlaniyor', 'Hazırlığa al'],
  hazirlaniyor: ['kargoda', 'Kargoya ver'],
  kargoda: ['teslim', 'Teslim edildi işaretle'],
}

export const PAYMENT_LABEL = { kart: 'Kredi kartı', havale: 'Havale / EFT', kapida: 'Kapıda ödeme' }
export const CHANNEL_LABEL = { mobil: 'Mobil web', masaustu: 'Masaüstü', instagram: 'Instagram', whatsapp: 'WhatsApp' }
