/**
 * Kategori ağacı.
 *
 * Mağazanın bugünkü menüsünden (egecamp.com) türetildi. Her alt kategori bir
 * ya da birkaç Shopify koleksiyonuna karşılık gelir; `scripts/build-catalog.mjs`
 * ürünleri bu eşlemeye göre yerleştirir. Sıra, vitrindeki menü sırasıdır.
 */

export const CATEGORIES = [
  {
    slug: 'kamp-ekipmanlari',
    name: 'Kamp Ekipmanları',
    blurb: 'Çadırdan uyku tulumuna, kampın omurgası.',
    children: [
      { slug: 'cadir', name: 'Çadır', collections: ['cadir'] },
      { slug: 'uyku-tulumu', name: 'Uyku Tulumu', collections: ['uyku-tulumu'] },
      { slug: 'mat-yatak-kampet', name: 'Mat, Yatak ve Kampetler', collections: ['mat-yatak-ve-kampetler'] },
      { slug: 'masa-sandalye', name: 'Kamp Masası ve Sandalyeleri', collections: ['kamp-masa-sandalye'] },
      { slug: 'aydinlatma', name: 'Aydınlatma ve Fenerler', collections: ['aydinlatma-fenerler'] },
      { slug: 'cadir-aksesuarlari', name: 'Çadır Aksesuarları', collections: ['aksesuar', 'karabinalar', 'testereler'] },
    ],
  },
  {
    slug: 'kamp-mutfagi',
    name: 'Kamp Mutfağı',
    blurb: 'Ocak, tencere, mangal — doğada tam bir mutfak.',
    children: [
      { slug: 'kamp-ocaklari', name: 'Kamp Ocakları', collections: ['kamp-ocaklari'] },
      { slug: 'kartus-purmuz', name: 'Kartuş, Tüp ve Pürmüz', collections: ['kartus-tup-purmuz'] },
      { slug: 'pisirme-setleri', name: 'Pişirme Setleri ve Çaydanlık', collections: ['pisirme-setleri'] },
      { slug: 'bardaklar', name: 'Bardaklar', collections: ['bardaklar'] },
      { slug: 'mutfak-ekipmanlari', name: 'Kamp Mutfak Ekipmanları', collections: ['catal-kasik-ve-bicaklar'] },
      { slug: 'mangal-izgara', name: 'Mangal, Izgara ve Barbekü', collections: ['mangal-izgara-ve-barbekuler'] },
      { slug: 'sogutucu-buzluk', name: 'Soğutucu ve Buzluklar', collections: ['sogutucu-ve-buzluklar'] },
      { slug: 'yuk-arabalari', name: 'Vagon Yük Arabaları', collections: ['vagoon-yuk-arabalari'] },
    ],
  },
  {
    slug: 'isitma-enerji',
    name: 'Isıtma & Enerji',
    blurb: 'Soba, dizel ısıtıcı, güç istasyonu ve güneş paneli.',
    children: [
      { slug: 'isitici-soba', name: 'Isıtıcı ve Kamp Sobaları', collections: ['isitici-ve-kamp-sobalari'] },
      { slug: 'guc-kaynaklari', name: 'Taşınabilir Güç Kaynakları', collections: ['tasinabilir-guc-kaynaklar', 'enerji-sistemleri'] },
      { slug: 'gunes-panelleri', name: 'Güneş Panelleri', collections: ['gunes-panelleri'] },
    ],
  },
  {
    slug: 'giyim',
    name: 'Giyim',
    blurb: 'Rüzgârı, yağmuru ve soğuğu dışarıda bırakın.',
    children: [
      { slug: 'mont-ceket', name: 'Mont & Ceket', collections: ['mont-ceket'] },
      { slug: 'tshirt-sweatshirt', name: 'T-Shirt & Sweatshirt', collections: ['tshirt-sweatshirt'] },
      { slug: 'pantolon-sort', name: 'Pantolon & Şort', collections: ['pantolon-sort-2'] },
      { slug: 'polar', name: 'Polar', collections: ['polar'] },
      { slug: 'gomlek', name: 'Gömlek', collections: ['gomlek'] },
      { slug: 'yagmurluk-yelek', name: 'Yağmurluk & Yelek', collections: ['yagmurluk-yelek'] },
      { slug: 'sapka-eldiven', name: 'Şapka, Eldiven, Çorap', collections: ['pantolon-sort'] },
      { slug: 'bandana-boyunluk', name: 'Bandana & Boyunluk', collections: ['bandana-boyunluk'] },
      { slug: 'kemer', name: 'Kemer', collections: ['kemer'] },
      { slug: 'tozluk-aksesuar', name: 'Tozluk & Aksesuar', collections: ['giyim-aksesuar'] },
    ],
  },
  {
    slug: 'ayakkabi-bot',
    name: 'Ayakkabı & Bot',
    blurb: 'Patikada kavrayan, çamurda kuru tutan.',
    children: [
      { slug: 'ayakkabi', name: 'Ayakkabı & Bot', collections: ['ayakkabi'] },
      { slug: 'bot-aksesuari', name: 'Bakım ve Aksesuar', collections: ['ayakkabi-bot-aksesuari'] },
    ],
  },
  {
    slug: 'termos-matara',
    name: 'Termos & Matara',
    blurb: 'Stanley’den Evolite’e, sıcağı sıcak tutan.',
    children: [{ slug: 'termos', name: 'Termos ve Mataralar', collections: ['termos'] }],
  },
  {
    slug: 'canta',
    name: 'Çantalar',
    blurb: 'Günübirlikten uzun rotaya sırt çantaları.',
    children: [{ slug: 'cantalar', name: 'Sırt ve Kamp Çantaları', collections: ['canta'] }],
  },
  {
    slug: 'caki-bicak-balta',
    name: 'Çakı, Bıçak & Balta',
    blurb: 'Opinel, Mudwill ve kampın vazgeçilmez aletleri.',
    children: [
      { slug: 'caki-bicak', name: 'Çakı, Bıçak & Balta', collections: ['caki-bicak-balta'] },
      { slug: 'balikcilik', name: 'Balıkçılık', collections: ['balikcilik-ekipmanlari'] },
    ],
  },
]

/** EgeCamp® kendi markalı serileri — vitrinde ayrı öne çıkar */
export const SERIES = [
  { slug: 'pro', name: 'EgeCamp® PRO Serisi', collection: 'egecamp-proserisi', blurb: 'Yüksek irtifa için hafif ve dayanıklı pişirme sistemleri.' },
  { slug: 'comfort', name: 'EgeCamp® Comfort Serisi', collection: 'egecamp-comfort-serisi', blurb: 'Kamp alanında ev konforu.' },
  { slug: 'vesta', name: 'EgeCamp® Vesta Serisi', collection: 'egecamp-vesta-serisi', blurb: 'Ocak başı için sobalar ve ısıtma.' },
  { slug: 'cargo', name: 'EgeCamp® Cargo Serisi', collection: 'egecamp-cargo-serisi', blurb: 'Taşıma ve organizasyon.' },
]
