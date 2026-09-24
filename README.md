# Ege Camp Outdoor — e-ticaret ve yönetim paneli demosu

egecamp.com'un 684 gerçek ürünüyle çalışan vitrin + yönetim paneli. Veriler
örnektir, ödeme alınmaz.

## Sunum akışı (10 dakika)

1. **Vitrin, telefondan.** Ana sayfa → kış sezonu, EgeCamp® serileri, FreeCamp
   kampanyası. Arama kutusuna “stanley” yazın: anlık sonuç.
2. **Ürün sayfası.** “15:00’e X dk içinde sipariş verirseniz bugün kargoda”,
   taksit tablosu, mağazadan teslim al, WhatsApp’tan sor.
3. **Kampanya canlı.** İki FreeCamp sandalye sepete → %5 otomatik; dördüncüde %10.
   Kupon: `KAMP10`, `HOSGELDIN`, `BILECIK`.
4. **Ödeme.** “Demo bilgileriyle doldur” → havale seçince %2 indirim, kapıda ödeme
   bedeli, taksit seçimi → sipariş.
5. **Panel.** Sipariş “Demo” etiketiyle listenin başında; stoktan düşmüş.
   Hazırlığa al → Kargoya ver → kargo etiketi yazdır → WhatsApp mesajı.
6. **Toplu fiyat.** Ürünler → Toplu fiyat güncelle → Husky’ye %8 zam, ,90 yuvarlama → vitrinde anında.
7. **Kampanyalar.** “Kış hazırlığı %7” kampanyasını aç → ısıtıcı kartlarında rozet belirir.
8. **Stok.** Kaç gün yeter tahmini, “gelince haber ver” bekleyenleri, tedarik listesi.
9. **Raporlar.** Kategori kârlılığı, saat ısı haritası, “aranıp bulunamayanlar” (hamak, kamp duşu).
10. **Modüller.** Bayiler ve Pazaryerleri kilitli → Mağaza Pro’ya geç → bayilik
    başvurusu onayla, Trendyol/Hepsiburada tek stok.

## Geliştirme

```bash
npm install
```

```bash
npm run dev
```

Kataloğu mağazadan yeniden çekmek için (önbellek: `scripts/.cache`):

```bash
npm run catalog
```
