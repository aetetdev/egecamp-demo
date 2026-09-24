# Ege Camp Outdoor — proje bağlamı

## Bu ne

Bilecik'teki **Ege Camp Outdoor** (egecamp.com) mağazasına gösterilecek
**e-ticaret satış demosu**. Amaç işletmenin sitesini ve yönetim panelini almak.
Mevcut siteleri **Shopify** (Refresh teması) üzerinde; demo onun yerine geçecek
kendi sistemimizi gösterir. Kafe demolarından (Kuruluş Kahvesi, T74) farkı:
QR menü/kasa yok, tamamen e-ticaret odaklı.

## Değişmez kurallar

- **Katalog gerçek:** `src/data/catalog.json` + `details.json`, egecamp.com'un
  herkese açık Shopify uç noktalarından `npm run catalog` ile üretilir
  (684 ürün). Görseller Shopify CDN'den çekilir; dosya olarak depoda tutulmaz.
- **Markaya özgü metin bileşene gömülmez** — `src/config/brand.js`.
- **Demo verisi tohumludur** (`src/data/generate.js`). Geçmiş 20 Ağustos 2025'ten
  başlar ve her gün kendi tarihiyle tohumlanır: sayfa yenilense de rakam
  oynamaz; bugün saat ilerledikçe yeni sipariş düşer. Sabit başlangıç tarihi
  sipariş numaralarının günden güne kaymasını önler — değiştirme.
- **Vitrinden verilen sipariş** `EC-30001`'den başlar (üretilen siparişlerle
  çakışmasın diye ayrı aralık), panele "Demo" etiketiyle düşer, stoktan düşer.
- **Ödeme sahtedir** ve arayüzde öyle etiketlidir; kart bilgisi hiç istenmez.
  3D Secure adımı "simülasyon" yazılı bir onay penceresidir.
- **Demoda fiyat (paket ücreti) gösterilmez.** Modüller sayfası paketleri
  fiyatsız listeler.
- **Rastgele üretilmiş müşteri numaralarına gerçek WhatsApp bağlantısı açılmaz**
  (gerçek bir kişiye denk gelebilir) — panelde mesaj önizlemesi + bildirim.
  Vitrindeki WhatsApp düğmesi yalnızca mağazanın kendi numarasına gider.
- **Site `noindex`tir** (`index.html` + `vercel.json`) — gerçek siteyle SEO'da yarışmasın.

## Yapı

- Vitrin: `src/pages/*` + `src/components/site/*`
- Panel: `src/pages/admin/*` + `src/components/admin/*` (tembel yüklenir; recharts yalnızca panelde)
- Ortak durum: `src/store/StoreContext.jsx` (ürün/fiyat/stok düzenlemeleri, kampanya,
  sipariş, bayi, paket) ve `CartContext.jsx` (sepet, favori). Hepsi localStorage'da,
  `egecamp-demo-v1:` önekiyle. Panel → Modüller → "Demo verisini sıfırla".
- Kampanya motoru: `src/lib/pricing.js` — vitrin, sepet, ödeme ve panel aynı fonksiyonu kullanır.
- Paketler: `src/config/modules.js` — Mağaza → Mağaza Plus (varsayılan) → Mağaza Pro.
  Kilitli modül menüde asma kilitle görünür, tıklanınca yükseltme ekranı açılır.

## Renk ve tipografi

`src/index.css` `@theme`: `char-*` (kömür, logo yazısı), `ember-*` (logo turuncusu;
açık zeminde yazı için `ember-700`), `moss-*` (stok/onay), `bone`/`mist`/`stone` yüzeyler.
Başlık: Barlow Condensed (büyük harf), metin: Inter.
Grafik sırası `#e58a00 · #2a78d6 · #1baf7a · #4a3aa7 · #e87ba4 · #008300` —
dataviz doğrulayıcısından geçti; yeni renk eklemeden önce yeniden ölç.

## Çalıştırma ve yayınlama

```bash
npm install
```

```bash
npm run dev
```

```bash
npx vercel deploy --prod --yes
```

Panel girişi: **"Demo hesabıyla gir"** ya da `yonetici@egecamp.com` / `demo2026`.
