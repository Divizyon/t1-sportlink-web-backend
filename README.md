# Sportlink Web Backend

Bu proje, Sportlink web uygulamasının backend kısmıdır. TypeScript ve Supabase kullanılarak geliştirilmiştir.

## Teknolojiler

- Node.js
- Express.js
- TypeScript
- Supabase (PostgreSQL + Auth)
- Jest (Test)

## Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/your-username/sportlink-web-backend.git
cd sportlink-web-backend
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. `.env` dosyasını oluşturun ve gerekli değişkenleri ayarlayın:
```
PORT=3000
NODE_ENV=development
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
```

4. Geliştirme modunda çalıştırın:
```bash
npm run dev
```

## Klasör Yapısı

```
src/
├── config/         # Yapılandırma dosyaları
├── controllers/    # İstek işleyicileri
├── middleware/     # Ara yazılımlar
├── models/         # Veri modelleri
├── routes/         # API rotaları
├── services/       # İş mantığı
├── utils/          # Yardımcı fonksiyonlar
└── index.ts        # Uygulama giriş noktası
```

## API Rotaları

### Kimlik Doğrulama
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/logout` - Kullanıcı çıkışı
- `GET /api/auth/me` - Mevcut kullanıcı bilgilerini getir
- `POST /api/auth/reset-password` - Şifre sıfırlama

### Kullanıcılar
- `GET /api/users` - Tüm kullanıcıları getir (sadece admin)
- `GET /api/users/:id` - Belirli bir kullanıcıyı getir

## Geliştirme Standartları

Bu proje, `.cursorrules` dosyasında belirtilen Sportlink Development Standards (SCDS) kurallarına uygun olarak geliştirilmiştir.