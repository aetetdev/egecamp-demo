/**
 * Modül ve paket tanımları.
 *
 * Her yetenek bağımsız açılıp kapanabilen bir modüldür; paketler bu modüllerin
 * hazır demetleridir. Kapalı modül menüden kaybolmaz: asma kilitle görünür ve
 * tıklanınca yükseltme ekranı açılır. Müşterinin neyi almadığını görmesi satışa
 * yarar. Demoda fiyat gösterilmez.
 */

export const MODULES = {
  storefront: {
    id: 'storefront',
    name: 'Online Mağaza',
    short: 'Vitrin, sepet, ödeme',
    desc: 'Mobil öncelikli vitrin, akıllı arama, filtreler, sepet ve tek sayfada ödeme. iyzico veya PayTR ile taksitli tahsilat.',
    routes: [],
    core: true,
  },
  orders: {
    id: 'orders',
    name: 'Sipariş Yönetimi',
    short: 'Hazırlık, kargo, fatura',
    desc: 'Siparişi hazırlığa al, kargo etiketini bas, takip numarasını müşteriye otomatik gönder. Toplu işlem ve durum akışı.',
    routes: ['/yonetim/siparisler'],
    core: true,
  },
  catalog: {
    id: 'catalog',
    name: 'Ürün Yönetimi',
    short: 'Ürün, varyant, fiyat',
    desc: 'Ürün ve varyant düzenleme, toplu fiyat güncelleme, SEO önizleme, taslak ve yayın durumu.',
    routes: ['/yonetim/urunler'],
    core: true,
  },
  inventory: {
    id: 'inventory',
    name: 'Stok Takibi',
    short: 'Kritik stok ve hız',
    desc: 'Varyant bazında stok, satış hızına göre “kaç gün yeter” tahmini, tükenen ürünü bekleyen müşteri sayısı ve stok hareketleri.',
    routes: ['/yonetim/stok'],
  },
  campaigns: {
    id: 'campaigns',
    name: 'Kampanya Motoru',
    short: 'Kademeli indirim, kupon',
    desc: '“2 al %5, 4 al %10”, markaya sepette indirim, kupon kodları, ücretsiz kargo eşiği. Açıp kapattığınız an vitrine yansır.',
    routes: ['/yonetim/kampanyalar'],
  },
  customers: {
    id: 'customers',
    name: 'Müşteri Yönetimi',
    short: 'Segment ve sadakat',
    desc: 'Müşteri geçmişi, yaşam boyu değer, VIP / riskli / kayıp segmentleri ve segmente toplu mesaj.',
    routes: ['/yonetim/musteriler'],
  },
  returns: {
    id: 'returns',
    name: 'İade Yönetimi',
    short: 'Talep, onay, geri ödeme',
    desc: 'Müşteri iade talebini siteden açar; ürün gelince incelenir, onaylanır, ödeme otomatik iade edilir.',
    routes: ['/yonetim/iadeler'],
  },
  reports: {
    id: 'reports',
    name: 'Raporlar ve Analitik',
    short: 'Satış, ziyaretçi, arama',
    desc: 'Kategori ve marka kârlılığı, şehir dağılımı, dönüşüm hunisi, trafik kaynağı ve “aranıp bulunamayan” ürünler.',
    routes: ['/yonetim/raporlar'],
  },
  dealers: {
    id: 'dealers',
    name: 'Bayi ve Toptan (B2B)',
    short: 'Bayi fiyatı ve cari',
    desc: 'Bayilik başvurularını onaylayın, bayiye özel fiyat grubu atayın, toptan siparişi ve cari bakiyeyi aynı panelden izleyin.',
    routes: ['/yonetim/bayiler'],
  },
  marketplace: {
    id: 'marketplace',
    name: 'Pazaryeri Entegrasyonu',
    short: 'Trendyol, Hepsiburada, N11',
    desc: 'Tek stok, tüm kanallar: pazaryerinde satılan ürün sitede de düşer. Kanal bazında fiyat kuralı ve sipariş aktarımı.',
    routes: ['/yonetim/pazaryerleri'],
  },
}

export const MODULE_LIST = Object.values(MODULES)

const CORE = ['storefront', 'orders', 'catalog']
const START = [...CORE, 'customers']
const PLUS = [...START, 'inventory', 'campaigns', 'returns', 'reports']
const PRO = [...PLUS, 'dealers', 'marketplace']

export const PLANS = [
  {
    id: 'magaza',
    name: 'Mağaza',
    tagline: 'Satışa başlayın',
    modules: START,
    best: 'Ürünlerini kendi sitesinde, kendi markasıyla satmak isteyen işletmeler.',
  },
  {
    id: 'magaza-plus',
    name: 'Mağaza Plus',
    tagline: 'Stok ve kampanya',
    modules: PLUS,
    best: 'Yüzlerce ürünü, kampanyayı ve iadeyi tek elden yönetmek isteyenler.',
    popular: true,
  },
  {
    id: 'magaza-pro',
    name: 'Mağaza Pro',
    tagline: 'Bayi + pazaryeri',
    modules: PRO,
    best: 'Bayi ağı kuran, Trendyol ve Hepsiburada’da da satan markalar.',
  },
]

export const DEFAULT_PLAN = 'magaza-plus'
export const planById = (id) => PLANS.find((p) => p.id === id) ?? PLANS[1]

/** Bir yolun hangi modüle ait olduğunu bulur (en uzun eşleşme kazanır) */
export function moduleForPath(pathname) {
  let found = null
  let len = -1
  MODULE_LIST.forEach((m) => {
    m.routes.forEach((r) => {
      if ((pathname === r || pathname.startsWith(`${r}/`)) && r.length > len) {
        found = m
        len = r.length
      }
    })
  })
  return found
}
