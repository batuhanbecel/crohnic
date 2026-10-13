# Crohnic 🩷

Kıvırcık'la birlikte Crohn yemek koçu. Neyin dokunduğunu takip eder, yemek ya da menü fotoğrafından "bu bana iyi gelir mi?" diye cevap verir.

- **Uygulama:** Expo SDK 57 + Expo Router + TypeScript. Veriler sadece telefonda (SQLite) tutulur.
- **AI:** `server/` klasöründe Vercel'de çalışan küçük bir fonksiyon var. Fotoğrafı Claude vision ile analiz eder. API anahtarı telefonda değil, sunucuda durur.

---

## 1. iPhone'da çalıştır (Expo Go, ~5 dk)

Gerekenler: bilgisayarda Node 20+ ve iPhone'da App Store'dan **Expo Go**.

```bash
cd crohnic
npm install
npx expo start
```

Terminalde çıkan QR kodu iPhone kamerasıyla okut, uygulama Expo Go içinde açılır.

- Telefon ile bilgisayar aynı Wi-Fi'da olmalı. Değillerse `npx expo start --tunnel` kullan.
- Expo Go "SDK uyumsuz" derse App Store'dan Expo Go'yu güncelle.

Bu aşamada kayıt tutma, yemek listesi ve kişisel analiz zaten çalışır. Fotoğraf analizi için 2. adım gerekiyor.

## 2. AI sunucusunu Vercel'e kur (~5 dk)

```bash
cd server
npx vercel            # ilk seferde login + proje oluşturma
npx vercel env add ANTHROPIC_API_KEY     # console.anthropic.com'dan aldığın anahtar
npx vercel env add APP_TOKEN             # kendin uydur: uzun rastgele bir şifre
npx vercel --prod
```

GitHub'dan da kurabilirsin: Vercel'de "Import Project" deyip **Root Directory** olarak `server` seç, environment variables'a aynı iki değeri gir.

İsteğe bağlı: `CLAUDE_MODEL` (varsayılan `claude-sonnet-5-5`). Daha ucuz ve hızlı olsun dersen `claude-haiku-5-5` yaz.

Kontrol: tarayıcıda `https://<proje-adın>.vercel.app/api/analyze` adresini açınca `{"ok":true,...}` görmelisin.

## 3. Uygulamaya bağla

Uygulamada şu adımları izle:

1. Ana sayfada ⚙️ simgesine dokunup Ayarlar'ı aç.
2. Sunucu adresini (`https://<proje-adın>.vercel.app`) gir.
3. `APP_TOKEN` olarak belirlediğin şifreyi gir.
4. **Test et**'e bas.

"Bağlantı çalışıyor 🎉" yazısını görürsen kurulum tamam.

## 4. Kalıcı olarak telefona kur (opsiyonel, TestFlight)

Apple Developer hesabı ($99/yıl) gerekir. Mac veya Xcode gerekmez, build bulutta yapılır.

```bash
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest submit -p ios
```

Bundle ID `app.json` içinde `tr.com.f28.crohnic` olarak ayarlı.

---

## Nasıl çalışıyor?

| Özellik | Nerede |
|---|---|
| Tabağı veya menüyü çek → iyi / dikkat / riskli | `Sor` sekmesi → `server/api/analyze.ts` |
| 93 Türk yemeği, döneme ve senin geçmişine göre işaretli | `Yemekler` sekmesi, `src/lib/foods.ts` |
| "Nasıl geldi?" takibi (iyi / biraz / çok dokundu) | Ana sayfa kartları, öğün detayı |
| Semptom (ağrı, şişkinlik, gaz, yorgunluk) | `semptom.tsx` |
| Bristol skalası, kan ve aciliyet | `tuvalet.tsx` |
| Atak / remisyon modu | Ana sayfa. Atakta tüm öneriler daha temkinli olur |
| Tetikleyici analizi ve 14 günlük grafik | `Beni tanı` sekmesi, `src/lib/tolerance.ts` |
| Uyarı bayrağı | Kan, şiddetli ağrı ya da sık sulu dışkılamada "doktoruna haber ver" uyarısı çıkar |

**Kişiselleştirme:** Her "nasıl geldi" cevabı yemeğe ve etiketlerine (acı, yağlı, laktoz, lif…) işlenir.

- Aynı yemekte 2 veya daha fazla kayıt olduğunda senin verin genel bilgiyi geçer.
- AI'a her soruda iyi gelenler, dokunanlar ve olası tetikleyiciler listesi gönderilir.

**Veri:** Kayıtların sadece telefonda tutulur. Ayarlar → "Verilerimi dışa aktar" ile JSON olarak yedekleyebilir ya da doktoruna gönderebilirsin.

> Crohnic bir takip ve farkındalık aracıdır, tıbbi tavsiye vermez. Diyet ve tedavi kararlarını gastroenteroloğun ve diyetisyeninle birlikte al.
