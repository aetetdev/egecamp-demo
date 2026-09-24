/**
 * Mağaza kimliği.
 *
 * İşletmeye özgü her şey — ad, adres, telefon, vitrin metinleri, kampanya
 * duyuruları — burada durur. Bileşenler bu dosyayı okur, marka metni gömmez.
 * Bilgiler egecamp.com'un bugünkü içeriğinden alınmıştır.
 */

export const BRAND = {
  name: 'Ege Camp Outdoor',
  short: 'EgeCamp',
  orderPrefix: 'EC',
  domain: 'egecamp.com',
  logo: '/logo.png',
  city: 'Bilecik',

  address: 'İsmetpaşa Mah. Muavenati İçtimai Sok. No:5/B Merkez / Bilecik',
  addressLines: ['İsmetpaşa Mah. Muavenati İçtimai Sok.', 'No:5/B Merkez / Bilecik'],
  mapQuery: 'Ege Camp Outdoor, İsmetpaşa Mahallesi, Bilecik',
  phone: '0540 363 01 11',
  phoneHref: '+905403630111',
  whatsapp: '905403630111',
  instagram: '@egecampoutdoor',
  instagramUrl: 'https://instagram.com/egecampoutdoor',
  facebookUrl: 'https://facebook.com/egecamp',
  youtubeUrl: 'https://www.youtube.com/@egecampoutdoor',

  hours: [
    ['Pazartesi — Cumartesi', '10:00 — 20:00'],
    ['Pazar', '10:00 — 16:00'],
  ],

  demoEmail: 'yonetici@egecamp.com',
  demoPassword: 'demo2026',
  ownerShort: 'Mağaza Yöneticisi',

  // Sipariş coğrafyası — Bilecik'te dükkân, İstanbul/Ankara/Bursa ağırlıklı
  cityWeights: [
    ['İstanbul', 27], ['Ankara', 11], ['Bilecik', 9], ['Bursa', 9], ['İzmir', 7],
    ['Eskişehir', 6], ['Kocaeli', 5], ['Antalya', 4], ['Sakarya', 4], ['Konya', 3],
    ['Kütahya', 2], ['Balıkesir', 2], ['Muğla', 2], ['Kayseri', 2], ['Tekirdağ', 1],
    ['Trabzon', 1], ['Samsun', 1], ['Denizli', 1], ['Erzurum', 1], ['Rize', 1],
    ['Bolu', 1], ['Artvin', 1],
  ],

  // Vitrin
  announcements: [
    '2.500 ₺ ve üzeri siparişlerde kargo ücretsiz',
    "Saat 15:00'e kadar verilen siparişler aynı gün kargoda",
    'FreeCamp sandalyelerde 2 adete %5, 4 adete %10 indirim',
    'Husky çadırlarda sepette net %10 indirim',
  ],

  hero: [
    {
      id: 'kis',
      eyebrow: 'Kış sezonu açıldı',
      title: ['Soğuğu unutturacak,', 'içinizi ısıtacak.'],
      blurb: 'Çadır sobaları, dizel ısıtıcılar ve kuzineli setler. Kamp sezonunu kasımda kapatmayın.',
      cta: { label: 'Isıtıcı ve sobalar', to: '/kategori/isitici-soba' },
      image: 'collections/Hearth_Serisi.png?v=1766763072',
      product: 'egecamp-bunker-cadir-ve-kamp-sobasi',
      tint: 'from-char-950/85 via-char-950/45',
      position: 'center 80%',
      // Görselin üstünde marka yazısı var; telefonda alt kısma yakınlaşıp gizlenir
      zoomMobile: true,
    },
    {
      id: 'mangal',
      eyebrow: 'EgeCamp® Flipfire',
      title: ['Doğanın kalbinde', 'profesyonel mutfak.'],
      blurb: 'Katlanabilir kompakt tasarım, ömürlük sac kalitesiyle buluştu. Çantaya girer, ateşi bir hamlede yakar.',
      cta: { label: 'Mangal ve ızgaralar', to: '/kategori/mangal-izgara' },
      image: 'files/Adsiz_tasarim_0fdf4830-e1bd-40b4-af18-0d19a8c68397.png?v=1776521056',
      tint: 'from-char-950/85 via-char-950/40',
    },
    {
      id: 'buzdolabi',
      eyebrow: 'Kompresörlü buzdolapları',
      title: ['Çadırda bile', 'buz gibi.'],
      blurb: 'TecnoPoint kompresörlü buzdolapları 12/24 V ile araçta, güç istasyonuyla kamp alanında çalışır. Eksi 20 dereceye kadar.',
      cta: { label: 'Soğutucuları gör', to: '/kategori/sogutucu-buzluk' },
      image: 'files/Gemini_Generated_Image_wjh2cowjh2cowjh2.png?v=1780562697',
      tint: 'from-char-950/85 via-char-950/40',
      position: 'center 55%',
    },
  ],

  usps: [
    ['Truck', 'Ücretsiz kargo', '2.500 ₺ ve üzeri'],
    ['Timer', 'Aynı gün kargo', "15:00'e kadar siparişte"],
    ['CreditCard', '12 aya varan taksit', 'Tüm kredi kartlarına'],
    ['Store', 'Mağazadan teslim al', 'Bilecik merkez, ücretsiz'],
    ['RotateCcw', '14 gün iade', 'Koşulsuz ve kolay'],
  ],

  categoryImages: {
    'kamp-ekipmanlari': 'collections/outdoor-tent-bizam-2-plus-w570-h640-e-b5727cc0e566486667a2d50de195cd96.jpg?v=1726742121',
    'kamp-mutfagi': 'collections/5-li-tencere-seti1.jpg?v=1729248600',
    'isitma-enerji': 'collections/sb-606-hota-portatif-soba-7-min_59e1bf30-88bd-489d-b540-5611f2ceec9e.jpg?v=1735893124',
    giyim: 'collections/06464623-9e13-4005-886b-b63c5ba2a75b.png?v=1728471568',
    'ayakkabi-bot': 'collections/c5a8a242-3c38-4c7a-80f0-84a3a26d7191.png?v=1729248765',
    'termos-matara': 'collections/out-5051-celik-termos-1000ml-min.jpg?v=1735898709',
    canta: 'collections/1713a763-9d92-4273-b9e1-c2a5150eb601.png?v=1743422913',
    'caki-bicak-balta': 'collections/out-4080-kamp-bicagi-3-min.jpg?v=1735896110',
    'uyku-tulumu': 'collections/evolite-dreamer-red-32-uyku-tulumu-2-1.jpg?v=1743513080',
    'masa-sandalye': 'collections/WhatsAppImage2026-04-01at16.12.04_1.jpg?v=1777062356',
    'mangal-izgara': 'collections/0733f22e-bc60-47a8-916d-b41373891ffc.png?v=1776517270',
    'sogutucu-buzluk': 'collections/Gemini_Generated_Image_wpyl0hwpyl0hwpyl.png?v=1781677887',
    'mat-yatak-kampet': 'collections/evolite-xlite-foam-mat.jpg?v=1750511765',
    'kamp-ocaklari': 'collections/13df6b56-1bcd-409a-916a-602c81ba17b8.png?v=1729248636',
    aydinlatma: 'collections/kafalamb-min.jpg?v=1735899394',
    'mont-ceket': 'collections/06464623-9e13-4005-886b-b63c5ba2a75b.png?v=1728471568',
  },

  seriesImages: {
    pro: 'collections/Adsiz_tasarim_9.png?v=1766763115',
    comfort: 'collections/Gemini_Generated_Image_v5j7lxv5j7lxv5j7.png?v=1766763197',
    vesta: 'collections/Hearth_Serisi.png?v=1766763072',
    cargo: 'collections/TREK_Serisi.png?v=1766763161',
  },

  storeImage: 'files/b0ebfd5b-965e-4ae5-9028-0490a17b0235.png?v=1776153178',

  story: {
    eyebrow: 'Bilecik’ten Türkiye’ye',
    title: 'Kampçının kampçıya açtığı dükkân',
    paragraphs: [
      'Ege Camp Outdoor, Bilecik merkezde bir mağaza olarak başladı. Bugün Husky, Stanley, Lowa, Opinel gibi 40’tan fazla markayı ve kendi tasarımımız EgeCamp® serilerini tek çatı altında topluyoruz.',
      'Rafa koyduğumuz her ürünü önce kendimiz kullanıyoruz. Soru sormak isteyen herkese mağazada ya da WhatsApp’tan, satın alsın almasın, aynı özenle cevap veriyoruz.',
    ],
  },
}

/** Taksit tablosu — örnek oranlar. Gerçek oranlar ödeme kuruluşundan gelir */
export const INSTALLMENT_PLANS = [
  { bank: 'Bonus', color: '#2f8f4e', rates: { 1: 0, 2: 0, 3: 0, 6: 0.0899, 9: 0.1299, 12: 0.1649 } },
  { bank: 'World', color: '#7b3fb0', rates: { 1: 0, 2: 0, 3: 0, 6: 0.0899, 9: 0.1299, 12: 0.1649 } },
  { bank: 'Maximum', color: '#c0267b', rates: { 1: 0, 2: 0.0349, 3: 0.0499, 6: 0.0899, 9: 0.1299, 12: 0.1649 } },
  { bank: 'Axess', color: '#b8860b', rates: { 1: 0, 2: 0.0349, 3: 0.0499, 6: 0.0899, 9: 0.1299, 12: 0.1649 } },
  { bank: 'CardFinans', color: '#1d4f9c', rates: { 1: 0, 2: 0.0349, 3: 0.0499, 6: 0.0949, 9: 0.1349, 12: 0.1699 } },
  { bank: 'Paraf', color: '#0f7c8c', rates: { 1: 0, 2: 0.0349, 3: 0.0499, 6: 0.0949, 9: 0.1349, 12: 0.1699 } },
  { bank: 'Bankkart', color: '#c8102e', rates: { 1: 0, 2: 0.0349, 3: 0.0499, 6: 0.0949, 9: 0.1349, 12: 0.1699 } },
]
export const INSTALLMENT_COUNTS = [1, 2, 3, 6, 9, 12]

export const CARGO_COMPANIES = ['Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo']
