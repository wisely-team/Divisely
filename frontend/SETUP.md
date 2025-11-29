# Divisely Frontend Kurulum Kılavuzu

Bu kılavuz, Divisely frontend uygulamasını yerel makinenizde kurmak ve çalıştırmak için adım adım talimatlar sağlar.

## Proje Hakkında
- **Framework:** React + Vite
- **Dil:** TypeScript
- **Stil:** Tailwind CSS (CDN üzerinden)
- **Yönlendirme:** React Router DOM v7
- **Durum Yönetimi:** Context API
- **UI Bileşenleri:** Özel bileşenler (lucide-react ikonları)
- **Grafikler:** Recharts
- **AI Entegrasyonu:** Google Gemini API

---

## Gereksinimler

Başlamadan önce sisteminizde aşağıdakilerin yüklü olduğundan emin olun:

- **Node.js:** v20.0.0 veya üzeri (önerilen: v20.19.6)
- **npm:** v10.0.0 veya üzeri (Node.js ile birlikte gelir)
- **Git:** Versiyon kontrolü için

---

## Kurulum Adımları

### 1. Node.js Kurulumu (henüz kurulu değilse)

#### Seçenek A: NVM Kullanarak (Node Version Manager) - Önerilen

NVM, birden fazla Node.js sürümünü kolayca yönetmenizi sağlar.

```bash
# NVM'i kur
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# NVM'i mevcut shell oturumunuza yükleyin
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Node.js v20'yi kurun
nvm install 20

# Node.js v20'yi kullanın
nvm use 20

# Node.js v20'yi varsayılan olarak ayarlayın
nvm alias default 20

# Kurulumu doğrulayın
node --version  # Çıktı: v20.19.6 veya benzeri olmalı
npm --version   # Çıktı: v10.8.2 veya benzeri olmalı
```

#### Seçenek B: Doğrudan Kurulum (Ubuntu/Debian)

```bash
# Paket dizinini güncelleyin
sudo apt update

# Node.js 20.x'i kurun
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kurulumu doğrulayın
node --version
npm --version
```

---

### 2. Projeyi Klonlama (henüz yapılmadıysa)

```bash
cd ~/Documents
git clone <repository-url> Divisely
cd Divisely/frontend
```

---

### 3. Proje Bağımlılıklarını Kurma

Frontend dizinine gidin ve gerekli tüm npm paketlerini kurun:

```bash
cd /path/to/Divisely/frontend

# Bağımlılıkları kur
npm install
```

**Kurulan Paketler (Toplam 178):**
- `react@^19.2.0` - React kütüphanesi
- `react-dom@^19.2.0` - React DOM render
- `react-router-dom@^7.9.6` - İstemci tarafı yönlendirme
- `@google/genai@^1.30.0` - Google Gemini AI SDK
- `lucide-react@^0.555.0` - İkon kütüphanesi
- `recharts@^3.5.1` - Grafik kütüphanesi
- `vite@^6.2.0` - Build aracı ve geliştirme sunucusu
- `@vitejs/plugin-react@^5.0.0` - Vite React eklentisi
- `typescript@~5.8.2` - TypeScript derleyici
- `@types/node@^22.14.0` - Node.js tip tanımlamaları

---

### 4. Ortam Kurulumu (İsteğe Bağlı - AI Özellikleri için)

AI Akıllı Asistan özelliğini kullanmak istiyorsanız, bir `.env` dosyası oluşturun:

```bash
# Frontend dizininde .env dosyası oluşturun
touch .env

# Gemini API anahtarınızı ekleyin
echo "GEMINI_API_KEY=your_api_key_here" > .env
```

**Gemini API Anahtarı Nasıl Alınır:**
1. https://aistudio.google.com/ adresini ziyaret edin
2. Google hesabınızla giriş yapın
3. Yeni bir API anahtarı oluşturun
4. Anahtarı kopyalayıp `.env` dosyasına yapıştırın

---

### 5. Geliştirme Sunucusunu Başlatma

Vite geliştirme sunucusunu çalıştırın:

```bash
npm run dev
```

**Beklenen Çıktı:**
```
  VITE v6.4.1  ready in 174 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

---

### 6. Uygulamaya Erişim

Tarayıcınızı açın ve şu adrese gidin:

```
http://localhost:3000/
```

**Demo Giriş Bilgileri:**
- **E-posta:** `kevin@divisely.com`
- **Şifre:** `password123` (Giriş Yap'a tıklamanız yeterli - şifre sadece demo için)

---

## Proje Yapısı

```
frontend/
├── App.tsx                      # Ana uygulama bileşeni
├── index.tsx                    # React giriş noktası
├── index.html                   # HTML şablonu
├── index.css                    # Temel stiller
├── types.ts                     # TypeScript tip tanımlamaları
├── vite.config.ts               # Vite yapılandırması
├── package.json                 # Bağımlılıklar ve scriptler
├── tsconfig.json                # TypeScript yapılandırması
├── components/
│   └── UIComponents.tsx         # Yeniden kullanılabilir UI bileşenleri (Button, Card, Input, Modal, Select)
├── context/
│   └── AppContext.tsx           # Global durum yönetimi (kullanıcılar, gruplar, harcamalar)
└── services/
    └── geminiService.ts         # AI entegrasyon servisi
```

---

## Kullanılabilir Scriptler

### Geliştirme
```bash
npm run dev        # Vite geliştirme sunucusunu başlat (port 3000)
```

### Üretim
```bash
npm run build      # Üretim için derle
npm run preview    # Üretim derlemesini yerel olarak önizle
```

---

## Sorun Giderme

### Sorun: .tsx dosyaları için MIME Type Hatası
**Hata:** `Loading module from "http://localhost:3000/index.tsx" was blocked because of a disallowed MIME type ("application/octet-stream").`

**Çözüm:** Python'un http.server gibi basit bir HTTP sunucusu yerine Vite geliştirme sunucusunu (`npm run dev`) kullandığınızdan emin olun.

---

### Sorun: Node.js sürüm uyumsuzluğu
**Hata:** `EBADENGINE Unsupported engine`

**Çözüm:** Node.js v20 veya üzerine yükseltin:
```bash
nvm install 20
nvm use 20
```

---

### Sorun: Port 3000 zaten kullanımda
**Hata:** `Port 3000 is already in use`

**Çözüm:** 3000 portunu kullanan işlemi sonlandırın veya [vite.config.ts](vite.config.ts) dosyasında portu değiştirin:
```bash
# 3000 portundaki işlemi bulup sonlandırın
lsof -ti:3000 | xargs kill -9

# Veya vite.config.ts içinde portu değiştirin
# Değiştirin: port: 3000 -> port: 3001
```

---

### Sorun: Bağımlılıklar yüklenmiyor
**Hata:** Çeşitli npm install hataları

**Çözüm:**
```bash
# npm önbelleğini temizle
npm cache clean --force

# node_modules ve package-lock.json'u sil
rm -rf node_modules package-lock.json

# Yeniden yükle
npm install
```

---

## Özellikler

### 🔐 Kimlik Doğrulama
- Demo kimlik bilgileri ile giriş sayfası
- Context API ile kullanıcı oturum yönetimi

### 📊 Gösterge Paneli
- Tüm grupların genel görünümü
- Toplam harcama istatistikleri
- Aktif grup sayısı

### 👥 Grup Yönetimi
- Yeni grup oluşturma
- Grup detaylarını düzenleme (sadece grup sahibi)
- Link ile üye davet etme
- Üyeleri çıkarma (sadece grup sahibi)
- Grup silme (sadece grup sahibi)

### 💰 Harcama Takibi
- Açıklama, tutar, tarih, kategori ile harcama ekleme
- Grup üyeleri arasından ödeyeni seçme
- Harcamaları eşit veya özel tutarlarla bölme
- Eşit bölmeler için otomatik kuruş tahsisi
- Özel bölmeler için gerçek zamanlı doğrulama

### 📈 Bakiye Görselleştirme
- Etkileşimli borç grafiği (düğümleri sürükle, Ctrl+Scroll ile yakınlaştır)
- "Kim kime ne kadar borçlu" özeti
- Kategoriye göre harcama (pasta grafiği)

### 🤖 AI Akıllı Asistan
- Grup finansmanı hakkında sorular sorun
- Google Gemini API ile güçlendirilmiş
- Doğal dil sorguları (örn: "Yemeklere en çok kim harcadı?")

---

## Geliştirme Yönergeleri

Lütfen [CLAUDE.md](CLAUDE.md) dosyasına bakın:
- Kodlama standartları ve isimlendirme kuralları
- API veri formatı dönüşümleri (snake_case ↔ camelCase)
- Para birimi işleme (kuruş - lira)
- İş mantığı kuralları (harcama bölme, bakiye hesaplama)
- Bileşen mimarisi

---

## Teknoloji Yığını Detayları

| Teknoloji | Versiyon | Amaç |
|-----------|----------|------|
| React | 19.2.0 | UI kütüphanesi |
| Vite | 6.2.0 | Build aracı ve geliştirme sunucusu |
| TypeScript | 5.8.2 | Tip güvenliği |
| React Router | 7.9.6 | İstemci tarafı yönlendirme |
| Tailwind CSS | 3.x (CDN) | Stil framework'ü |
| Lucide React | 0.555.0 | İkon kütüphanesi |
| Recharts | 3.5.1 | Veri görselleştirme |
| Google Gemini | 1.30.0 | AI entegrasyonu |

---

## Destek & İletişim

Sorunlar veya sorular için:
1. Yukarıdaki sorun giderme bölümünü kontrol edin
2. Geliştirme yönergeleri için [CLAUDE.md](CLAUDE.md) dosyasını inceleyin
3. Geliştirme ekibiyle iletişime geçin

---

## Hızlı Başlangıç Özeti

```bash
# 1. NVM ve Node.js 20'yi kurun
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20 && nvm use 20

# 2. Projeye gidin
cd /path/to/Divisely/frontend

# 3. Bağımlılıkları kurun
npm install

# 4. (İsteğe Bağlı) Gemini API anahtarını ayarlayın
echo "GEMINI_API_KEY=your_key_here" > .env

# 5. Geliştirme sunucusunu başlatın
npm run dev

# 6. Tarayıcıyı açın
# Ziyaret edin: http://localhost:3000
# Giriş yapın: kevin@divisely.com
```

---

**Son Güncelleme:** 29 Kasım 2025
**Kullanılan Node.js Versiyonu:** v20.19.6
**Kullanılan npm Versiyonu:** v10.8.2
