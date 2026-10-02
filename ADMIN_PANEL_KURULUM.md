# ElectroHomeSY Admin Paneli

Panel adresi: **https://electrohomesy.com/admin.html**

- Panel Arapça'dır, giriş sadece şifre ile yapılır (e-posta sorulmaz).
- Şifre panelde **الإعدادات → تغيير كلمة المرور** bölümünden değiştirilebilir.
- Ürünler ve siparişler Supabase'deki **electrohomesy** projesinde tutulur
  (`https://ynloqxqzmvypgnjqdgri.supabase.co`). Bağlantı ayarı `js/db-config.js` dosyasındadır.

## Veritabanı kurulumu (bir kere)

Supabase panelinde **electrohomesy → SQL Editor** içinde sırayla:

1. `supabase/schema.sql` dosyasının tamamını çalıştır (tablolar ve güvenlik kuralları).
2. `supabase/seed.sql` dosyasının tamamını çalıştır (mevcut 53 ürün).
3. Admin hesabı: girişte kullanılan sabit hesap `admin@electrohomesy.com`'dur.
   **Authentication → Users → Add user** ile bu e-postayı ve istediğin şifreyi gir,
   **Auto Confirm User** işaretle. Sonra SQL Editor'da:

   ```sql
   insert into public.admins (user_id, email)
   select id, email from auth.users where email = 'admin@electrohomesy.com';
   ```

## Notlar

- Kurulum tamamlanana kadar site yedek `js/products.json` ile çalışır; siparişler e-posta ile gelmeye devam eder.
- Maliyet bilgisi sadece panelde görünür, siteden okunamaz.
- Supabase ücretsiz planında projeye 7 gün hiç istek gelmezse proje duraklatılır; panelden tek tıkla açılır.
- Google Sheets artık ürün kaynağı değil; günlük Sheets senkronu kapatıldı.

## Google'da görünme (SEO)

- `scripts/build-seo.js` veritabanındaki ürünlerden şunları üretir: her ürün için `/p/<id>/` sayfası,
  her kategori için `/c/<kategori>/` sayfası, `sitemap.xml`, `robots.txt` ve ana sayfadaki hazır ürün listesi.
- Bu iş GitHub Actions'ta **"Build SEO pages"** ile otomatik çalışır: ana dala her gönderimde ve **3 saatte bir**.
  Panelde yaptığın değişiklik sitede anında görünür; Google'ın gördüğü sayfalar en geç 3 saat içinde güncellenir.
  Hemen güncellemek için: GitHub → Actions → Build SEO pages → **Run workflow**.
- Panelden yeni eklenen bir ürünün sayfası henüz üretilmediyse, `/p/<id>/` adresi ziyaretçiyi otomatik olarak ürün sayfasına yönlendirir.

### Google Search Console (bir kere yapılır)

1. https://search.google.com/search-console adresine Google hesabınla gir → **Mülk ekle** → **URL ön eki** →
   `https://electrohomesy.com/`.
2. Doğrulama yöntemi olarak **HTML etiketi**'ni seç; verdiği `<meta name="google-site-verification" ...>` satırını
   `index.html`'in `<head>` bölümüne ekle (veya Claude'a ver).
3. Doğrulandıktan sonra **Site haritaları** bölümüne `sitemap.xml` yaz → **Gönder**.
4. İstersen **URL denetimi**'nde bir ürün adresini (ör. `https://electrohomesy.com/p/38/`) yazıp **Dizine eklenmesini iste**.

Yerel aramalar ("ماكينة حلاقة دمشق" gibi) için ayrıca **Google İşletme Profili** (business.google.com) açıp
web sitesi olarak electrohomesy.com'u girmek çok fayda sağlar.
