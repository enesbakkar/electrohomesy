# ElectroHomeSY Admin Paneli – Kurulum

Panel adresi: **https://electrohomesy.com/admin.html**

Site GitHub Pages'te statik olarak yayınlandığı için ürünler ve siparişler ücretsiz bir
**Supabase** veritabanında tutulur. Kurulum bir kere yapılır, yaklaşık 10 dakika sürer.

Kurulum bitene kadar site eskisi gibi `js/products.json` dosyasındaki ürünlerle çalışmaya devam eder.

---

## 1. Supabase projesi oluştur

1. https://supabase.com adresinde ücretsiz hesap aç → **New project**.
2. Proje adı: `electrohomesy`, bir veritabanı şifresi belirle (bir yere not et), bölge olarak
   **Frankfurt (eu-central-1)** seç.
3. Proje hazır olunca (1-2 dk).

## 2. Tabloları oluştur

1. Soldaki menüden **SQL Editor** → **New query**.
2. Bu depodaki `supabase/schema.sql` dosyasının **tamamını** yapıştır → **Run**.
3. Yeni bir query aç, `supabase/seed.sql` dosyasının tamamını yapıştır → **Run**.
   Bu, sitedeki mevcut 53 ürünü (fiyatlar, görseller, Google Sheets'teki stok adetleriyle) aktarır.
   Sheets'te artık bulunmayan 5 ürün gizli olarak eklenir.

## 3. Admin hesabını oluştur

1. **Authentication → Users → Add user → Create new user**.
   E-posta ve şifre gir, **Auto Confirm User** kutusunu işaretle.
2. **SQL Editor**'da şunu çalıştır (e-postayı kendi adresinle değiştir):

   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'senin@epostan.com';
   ```

3. **Authentication → Sign In / Providers** sayfasında **Allow new users to sign up** seçeneğini **kapat**.
   (Admin olmayan biri kayıt olsa bile hiçbir şey göremez, ama kapatmak daha temiz.)

Birden fazla kişi yönetecekse her biri için 1. ve 2. adımı tekrarla.

## 4. Siteyi veritabanına bağla

1. Supabase'de **Project Settings → API** sayfasını aç.
2. `js/db-config.js` **ve** `public/js/db-config.js` dosyalarında şu iki satırı doldur:

   ```js
   SUPABASE_URL: 'https://xxxxxxxx.supabase.co',
   SUPABASE_ANON_KEY: 'eyJhbGciOi...',
   ```

   - `SUPABASE_URL` = **Project URL**
   - `SUPABASE_ANON_KEY` = **anon public** anahtarı (veya yeni panelde **Publishable key**)

   > ⚠️ **service_role / secret** anahtarını asla buraya koyma. anon anahtarı herkese açık olabilir;
   > güvenliği veritabanı kuralları sağlar.

3. Değişikliği GitHub'a gönder (commit + push). 1-2 dakika içinde site güncellenir.

## 5. Kullanım

`https://electrohomesy.com/admin.html` → e-posta ve şifrenle giriş yap.

| Sekme | Ne yapabilirsin |
| --- | --- |
| **Özet** | Yeni sipariş sayısı, bu ayın cirosu, stokta olmayan ürünler, stok değeri, son siparişler |
| **Ürünler** | Tüm ürünleri listele/ara/filtrele. Satış fiyatı, indirimli fiyat, maliyet ve stok tabloda doğrudan değiştirilir (kutudan çıkınca kaydedilir). Öne çıkan / sitede görünsün anahtarları. **Düzenle** ile ad, açıklama, kategori, video, görseller (link yapıştır veya dosya yükle, sırala). **Yeni ürün** ekleme, silme. |
| **Siparişler** | Gelen tüm siparişler; müşteri, telefon, adres, ürünler, toplam. Durum: Yeni → Onaylandı → Yolda → Teslim edildi / İptal. Sipariş onaylanınca ürünleri stoktan düşmeyi önerir. WhatsApp/arama kısayolu, özel not. Fiyatı sonradan değişen ürünler uyarıyla gösterilir. |
| **Talepler** | Müşterilerin "özel cihaz talebi" formları |
| **Ayarlar** | `products.json`'dan içe aktarma (seed.sql çalıştırmadıysan buradan da yapılabilir), ürün ve sipariş yedeğini CSV (Excel) olarak indirme |

- Maliyet bilgisi **sadece panelde** görünür, sitede hiçbir şekilde okunamaz.
- Sitede yaptığın değişiklikler anında yansır (sayfayı yenilemek yeterli).
- Sipariş geldiğinde e-posta bildirimi eskisi gibi Google Apps Script üzerinden gelmeye devam eder.
  İstemiyorsan `db-config.js` içindeki `ORDER_EMAIL_WEBHOOK` değerini `''` yap.

## Notlar

- Google Sheets artık ürün kaynağı değil. GitHub Actions'taki günlük Sheets senkronu kapatıldı
  (gerekirse Actions sekmesinden elle çalıştırılabilir; sadece yedek `products.json` dosyasını günceller).
- Supabase ücretsiz planında, projeye **7 gün boyunca hiç istek gelmezse** proje duraklatılır.
  Sitenin ziyaretçisi oldukça bu olmaz; olursa Supabase panelinden tek tıkla tekrar açılır.
  O sürede site yedek `products.json` ile çalışmaya devam eder.
- Ürün görsellerini **Dosya yükle** ile yüklersen Supabase Storage'daki `product-images` alanına kaydedilir.
