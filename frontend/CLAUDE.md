# CLAUDE.md - Divisely Frontend Yönergeleri

## Proje Hakkında
**Divisely**, web tabanlı bir harcama bölüşme uygulamasıdır (Splitwise benzeri).
- **Amaç:** Kullanıcıların grupları yönetmesine, harcama eklemesine, masrafları bölmesine (eşit/özel) ve bakiyeleri takip etmesine ("kim kime ne kadar borçlu") olanak sağlar.
- **Teknoloji:** Next.js (App Router), React, Tailwind CSS, Context API.
- **Backend:** Node.js/Express (REST API).

## Mimari & Dosya Yapısı
`src/` içinde özellik bazlı dizin yapısı kullanıyoruz:

- `src/app/` → Next.js App Router sayfaları (burada mantığı minimal tutun).
- `src/components/ui/` → Yeniden kullanılabilir atomik bileşenler (Button, Input, Card, Modal).
- `src/components/features/` → Özelliğe özel bileşenler (örn: `expenses/ExpenseForm`, `groups/GroupCard`).
- `src/lib/` → Yardımcı araçlar, formatlama yardımcıları (para birimi) ve API istemcisi (Axios instance).
- `src/context/` → Global durum (AuthContext, ToastContext).
- `src/hooks/` → Özel React hook'ları (örn: `useCalculateSplit`).

## Kodlama Standartları

### 1. İsimlendirme Kuralları
- **Bileşenler:** PascalCase (örn: `ExpenseCard.tsx`).
- **Fonksiyonlar/Değişkenler:** camelCase (örn: `calculateBalance`).
- **Dosyalar:** Yardımcı araçlar için kebab-case (örn: `format-date.ts`), bileşenler için PascalCase.
- **Interface'ler:** 'I' öneki GEREKLİ DEĞİL. Açıklayıcı isimler kullanın (örn: `Expense`, `User`).

### 2. API & Veri İşleme
- **Backend Formatı:** Backend **snake_case** kullanır (örn: `group_id`, `created_at`).
- **Frontend Formatı:** Dahili olarak **camelCase** kullanın. Veri alırken/gönderirken dönüşüm yapmalısınız.
- **Para:** Para birimi, kayan nokta hatalarından kaçınmak için veritabanında **tam sayı (kuruş)** olarak saklanır.
  - *Frontend Görünüm:* 100'e bölün (örn: 1500 kuruş → ₺15,00).
  - *Frontend Girdi:* API'ye göndermeden önce kuruşa çevirin.
- **Tarihler:** Backend ISO 8601 gönderir (`YYYY-MM-DDTHH:MM:SSZ`). Yerel saatte gösterin.

### 3. Stil (Tailwind CSS)
- Mobil öncelikli yaklaşım kullanın (örn: `w-full md:w-1/2`).
- İsteğe bağlı değerlerden kaçının (örn: `w-[350px]`). Standart boşluk ölçeklerini kullanın.
- Koşullu sınıf isimleri için `clsx` veya `tailwind-merge` kullanın.

### 4. Durum Yönetimi
- Global veriler için (Kullanıcı Oturumu) **Context API** kullanın.
- Form girişleri için **Yerel Durum** (`useState`) kullanın.
- **İyimser UI:** Harcama eklerken, API yanıtını beklemeden önce UI'yi hemen güncelleyin.

## Kritik İş Mantığı (UYDURMAYINIZ)

### Harcama Bölme
1. **Eşit Bölme:**
   - Toplam Tutar / Kullanıcı Sayısı.
   - **Kuruş Tahsis Kuralı:** 100 / 3 = 33,33 ise, kalan (0,01) ödeyene veya rastgele bir katılımcıya gider. Kuruş kaybetmeyin.
2. **Özel Bölme:**
   - Bireysel payların toplamı MUTLAKA toplam tutara tam olarak eşit olmalıdır.
   - Eğer `sum(shares) !== total` ise gönderimi devre dışı bırakın.

### "Kim Kime Ne Kadar Borçlu" (Bakiye Görselleştirme)
- Backend basitleştirilmiş borçları hesaplar.
- Frontend sadece bu veriyi görselleştirir (örn: "Ayşe, Mehmet'e ₺15,00 borçlu").
- Açıkça istenmediği sürece frontend'de basitleştirme algoritmasını yeniden hesaplamayı denemeyin.

## Komut Referansı
- **Geliştirme Sunucusunu Çalıştır:** `npm run dev`
- **Lint:** `npm run lint`
- **Build:** `npm run build`
