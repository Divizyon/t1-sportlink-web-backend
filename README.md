# Sportlink Web Backend

Bu proje, Sportlink web uygulamasının backend kısmıdır. TypeScript ve Supabase kullanılarak geliştirilmiştir.

## Teknolojiler

- Node.js
- Express.js
- TypeScript
- Supabase (PostgreSQL + Auth)
- Jest (Test)
- Docker
- Swagger/OpenAPI (API Dokümantasyonu)

## Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/Divizyon/t1-sportlink-web-backend.git
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
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=3600
FRONTEND_URL=http://localhost:5173
```

4. Geliştirme modunda çalıştırın:
```bash
npm run dev
```

## Docker ile Çalıştırma

1. Docker Desktop'ı yükleyin ve çalıştırın.

2. Container'ı oluşturup çalıştırın:
```bash
docker-compose up
```

3. Arka planda çalıştırmak için:
```bash
docker-compose up -d
```

4. Container'ı durdurmak için:
```bash
docker-compose down
```

5. Production build için:
```bash
docker build -t sportlink-web-backend .
docker run -p 3000:3000 sportlink-web-backend
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

## API Dokümantasyonu

Bu projede API dokümantasyonu için Swagger/OpenAPI kullanılmıştır. Swagger UI aracılığıyla API'nizi görsel olarak keşfedebilir ve test edebilirsiniz.

### Swagger UI Erişimi

API dokümantasyonuna aşağıdaki URL üzerinden erişebilirsiniz:

```
http://localhost:3000/api-docs
```

Dokümantasyon aşağıdaki özellikleri içerir:
- Tüm API endpointlerinin detaylı açıklamaları
- Request/Response şemaları
- Örnek API çağrıları
- Interaktif API testi yapabilme
- Kimlik doğrulama gereksinimleri

### Swagger JSON

OpenAPI şemasının JSON formatına aşağıdaki URL üzerinden erişebilirsiniz:

```
http://localhost:3000/api-docs.json
```

## Geliştirme Standartları

Bu proje, `.cursorrules` dosyasında belirtilen Sportlink Development Standards (SCDS) kurallarına uygun olarak geliştirilmiştir.