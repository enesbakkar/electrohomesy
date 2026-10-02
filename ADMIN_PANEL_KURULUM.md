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
