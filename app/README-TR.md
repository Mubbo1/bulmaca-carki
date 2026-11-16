# Bulmaca Çarkı – Mağazaya çıkış rehberi

Oyunun kendisi depo kökündeki `index.html` (GitHub Pages ile aynı dosya). Bu `app` klasörü telefon uygulaması projesidir (Capacitor).
Mac gerekmez: iPhone sürümünü **Codemagic** bulutta paketleyip App Store Connect'e (TestFlight) yükler. Ayarlar: kökteki `codemagic.yaml`.

## Sabit bilgiler
| | |
|---|---|
| Uygulama adı | Bulmaca Çarkı |
| Paket kimliği (Bundle ID / Package) | `com.bulmacacarki.game` |
| Destek e-postası | bulmacacarki.destek@gmail.com |
| Gizlilik politikası | https://mubbo1.github.io/bulmaca-carki/gizlilik.html |
| Destek / pazarlama sayfası | https://mubbo1.github.io/bulmaca-carki/ |
| Kategori | Oyunlar → Kelime (ikincil: Bulmaca) |

## Uygulama içi satın alma ürünleri (App Store Connect ve Google Play'de AYNI kimliklerle)
| Ürün kimliği | Tür | Ne | Fiyat (TR) |
|---|---|---|---|
| `bulmacacarki.gem10` | Tüketilebilir (Consumable) | 10 Elmas | 49,99 ₺ |
| `bulmacacarki.gem20` | Tüketilebilir (Consumable) | 20 Elmas | 89,99 ₺ |
| `bulmacacarki.gem50` | Tüketilebilir (Consumable) | 50 Elmas | 149,99 ₺ |
| `bulmacacarki.noads` | Tüketilmeyen (Non-Consumable) | Reklamları Kaldır | 199,99 ₺ |
| `bulmacacarki.unlimited` | Tüketilmeyen (Non-Consumable) | Sınırsız Can | 149,99 ₺ |

## 1) AdMob
admob.google.com → Uygulamalar → **Uygulama ekle** → iOS → "Bulmaca Çarkı" (henüz mağazada değil) → iki reklam birimi:
**Ödüllü** ve **Geçiş (Interstitial)**. Uygulama kimliği (`~` içeren) ve iki birim kimliği (`/` içeren) Claude'a verilir;
`index.html` içindeki `CFG` ve Codemagic'teki `ADMOB_IOS_APP_ID` güncellenir, `testAds:false` yapılır.

## 2) Apple
1. developer.apple.com → Identifiers → **+** → App IDs → Bundle ID: `com.bulmacacarki.game` (In-App Purchase ve Push açık).
2. appstoreconnect.apple.com → Uygulamalar → **+ Yeni Uygulama** → iOS · Bulmaca Çarkı · Türkçe · `com.bulmacacarki.game` · SKU `bulmacacarki1`.
3. Uygulama → **Uygulama İçi Satın Almalar** → yukarıdaki 5 ürün.

## 3) Codemagic
1. Uygulamalar → **Add application** → GitHub → `Mubbo1/bulmaca-carki` → codemagic.yaml.
2. App Store Connect entegrasyonu (`CubeTrafficASC`) ve sertifika Cube Traffic'teki ile aynı, yeniden eklenmez.
3. Environment variables: `ADMOB_IOS_APP_ID` (AdMob uygulama kimliği).
4. **Start new build → ios-release** → ~20 dk sonra TestFlight'ta.

## 4) Yayın
TestFlight'ta dene → ekran görüntüleri, açıklama, gizlilik URL'si, yaş derecelendirmesi → **İncelemeye gönder**.
Not: Düello modunda kullanıcılar ad ve fotoğraf paylaştığı için Apple'ın istediği şikâyet etme, uygunsuz içerik filtresi
ve **Hesabımı Sil** özellikleri oyunda mevcut.
