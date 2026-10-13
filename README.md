# Crohnic

Crohn için yemek koçu. Neyin dokunduğunu takip eder; tabağın ya da menünün fotoğrafından "bu bana iyi gelir mi?" sorusuna cevap verir. Maskotu Kıvırcık, bir marul.

- **Uygulama:** Expo SDK 57, Expo Router, iOS 26 liquid glass (native tab bar + `expo-glass-effect`). Veriler sadece telefonda (SQLite).
- **Yemek veritabanı:** 600+ yemek, 14 kategori. Hüküm etiketlerden ve döneme (remisyon/atak) göre hesaplanır, kişisel kayıtlar geldikçe senin verin öne geçer. Liste: `src/lib/food-data.ts`.
- **AI:** `server/` klasöründeki Vercel fonksiyonu fotoğrafı Claude'a gönderir. API anahtarı telefonda değil, sunucuda durur.

---

## 1. Geliştirme (Expo Go)

```bash
npm install
npx expo start
```

QR kodu iPhone kamerasıyla okut. Liquid glass efektleri Expo Go'da da görünür, ama asıl görünümü TestFlight sürümünde görürsün.

## 2. TestFlight ile kalıcı kurulum

Apple Developer hesabın onaylandıktan sonra bir kez:

```bash
npx eas-cli@latest login            # expo.dev hesabın (yoksa ücretsiz aç)
npx eas-cli@latest init             # projeyi expo.dev'e bağlar
npx eas-cli@latest update:configure # uzaktan güncellemeyi açar
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest submit -p ios --latest
```

`build` sırasında Apple hesabınla giriş ister ve sertifikaları kendisi oluşturur. Mac'te Xcode gerekmez. `submit` bittikten 10-20 dakika sonra build App Store Connect → TestFlight'ta görünür. iPhone'a **TestFlight** uygulamasını kur, oradan Crohnic'i yükle.

### Güncellemeler (otomatik)

`master`'a her push'ta GitHub Actions (`.github/workflows/eas-update.yml`) şunu yapar:

1. Uygulamanın native parmak izini (fingerprint) hesaplar.
2. Bu parmak izine ait iOS build yoksa (yeni native paket, ikon, izin değişikliği vb.) EAS'te build alır ve TestFlight'a otomatik gönderir. TestFlight'tan **Update** demek yeterli.
3. Her durumda uzaktan güncelleme yayınlar. Ekran, metin, renk, yemek listesi gibi değişiklikler build'siz, uygulamayı kapatıp açınca gelir.

Bir kerelik kurulum: https://expo.dev/settings/access-tokens → token oluştur → GitHub repo → Settings → Secrets and variables → Actions → **New repository secret**, adı `EXPO_TOKEN`.

Elle tetiklemek için: GitHub → Actions → **deploy** → **Run workflow**.

TestFlight build'leri 90 gün geçerli; süre dolmadan Actions'tan bir kez çalıştırıp build almak yeterli (gerekirse `eas.json`'a dokunmak yeni build tetikler).

## 3. AI sunucusu (Vercel)

1. Vercel'de **Add New → Project** ile GitHub'daki `crohnic` reposunu seç.
2. **Root Directory:** `server`
3. **Environment Variables:**
   - `ANTHROPIC_API_KEY`: console.anthropic.com → API Keys
   - `APP_TOKEN`: kendin uydur, uzun rastgele bir şifre (ör. `openssl rand -hex 24`)
   - `CLAUDE_MODEL` (isteğe bağlı): varsayılan `claude-sonnet-5-5`. Daha ucuzu için `claude-haiku-5-5`.
4. Deploy et. `https://<proje>.vercel.app/api/analyze` adresini açınca `{"ok":true,...}` görmelisin.
5. Uygulamada Ayarlar → Fotoğraf analizi bölümüne adresi ve `APP_TOKEN`'ı gir, **Bağlantıyı test et**.

### Maliyet

Claude API kullandığın kadar öder, aylık abonelik yok. console.anthropic.com'da kredi yükleyip harcama limiti koyabilirsin.

| İşlem | Sonnet 5.5 | Haiku 5.5 |
|---|---|---|
| Tabak fotoğrafı | ~0,01 $ | ~0,001 $ |
| Menü fotoğrafı | ~0,03 $ | ~0,002 $ |
| Günde 10 soru, 1 ay | ~3-5 $ | ~0,3 $ |

Fotoğraflar gönderilmeden önce 1024 px'e (menüde 1500 px) küçültülür, bu da maliyeti düşük tutar.

---

## Yapı

| Ne | Nerede |
|---|---|
| Sekmeler (native, liquid glass) | `src/app/(tabs)/_layout.tsx` |
| Tasarım bileşenleri, Glass | `src/components/ui.tsx` |
| Renkler | `src/lib/theme.ts` |
| Kıvırcık | `src/components/Mascot.tsx` |
| Yemek listesi | `src/lib/food-data.ts` |
| Etiket ağırlıkları ve hüküm | `src/lib/foods.ts`, `src/lib/tolerance.ts` |
| Saat seçici | `src/components/WhenField.tsx` |
| AI isteği ve sistem promptu | `server/api/analyze.ts` |

Yemek eklemek için `food-data.ts`'e bir satır yazman yeterli: `Ad|emoji|etiketler`.

> Crohnic bir takip aracıdır, tıbbi tavsiye vermez. Diyet ve tedavi kararlarını gastroenteroloğun ve diyetisyeninle birlikte al.
