# SportLink Web Backend - Vercel Deployment Kılavuzu

Bu belge, SportLink Web Backend uygulamasının Vercel'e nasıl dağıtılacağını adım adım açıklar.

## Ön Gereksinimler

- Vercel hesabı
- Git
- Node.js (18.x veya daha yüksek)

## Vercel CLI Kurulumu

Eğer henüz Vercel CLI kurulu değilse:

```bash
npm install -g vercel
```

## Deployment Adımları

### 1. Vercel'e Giriş Yapın

```bash
vercel login
```

### 2. Projeyi Vercel'e Deploy Edin

Projenin kök dizininde:

```bash
vercel
```

Bu komut interaktif bir kurulum başlatacaktır. Aşağıdaki soruları yanıtlamanız gerekecektir:

- Set up and deploy? `y`
- Link to existing project? `n` (İlk kez deploy ediyorsanız)
- What's your project's name? `sportlink-web-backend`
- In which directory is your code located? `./` (Ana dizin)
- Want to override the settings? `y`
- Which framework preset would you like to use? `Other`
- Build Command: `npm run vercel-build`
- Output Directory: `dist`
- Development Command: `npm run dev`

### 3. Ortam Değişkenlerini Ayarlayın

Vercel dashboard üzerinden projenize gidin ve "Settings" > "Environment Variables" sekmesinden aşağıdaki değişkenleri ekleyin:

```
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_KEY=your-supabase-anon-key
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
NODE_ENV=production
CLIENT_URL=https://sportlink-web.vercel.app (frontend URL'iniz)
```

### 4. Production Dağıtımı

Değişikliklerinizi main/master branch'e push ettiğinizde, Vercel otomatik olarak projenizi yeniden deploy edecektir.

```bash
git add .
git commit -m "Vercel deployment yapılandırması"
git push origin main
```

## Deployment Güvenlik Notları

1. JWT_SECRET değişkenini güçlü ve benzersiz tutun.
2. SUPABASE_KEY değişkeni sadece anon key olmalıdır, service_role key değil.
3. CORS ayarlarının frontend URL'nizle eşleştiğinden emin olun.

## Sorun Giderme

- **Bağlantı Hataları**: Supabase bağlantı hatası alıyorsanız, Vercel'in IP adreslerinin Supabase'in güvenlik duvarı kurallarında izin verilen listede olduğundan emin olun.
- **Timeout Hataları**: Vercel serverless fonksiyonları 10 saniye timeout'a sahiptir. Uzun süren işlemler için Vercel Cron Jobs veya harici zamanlayıcılar kullanın.
- **Log Kayıtları**: Log kayıtlarını "Deployments" > [Deployment ID] > "Functions" altında görebilirsiniz.

## Önemli Notlar

- Vercel'de cron job'lar standart deployment'larda çalışmaz. Bu nedenle, zamanlı görevler için Vercel Cron Jobs veya harici bir sağlayıcı kullanmanız gerekebilir.
- Serverless yapısı nedeniyle, uygulama soğuk başlatma (cold start) yaşayabilir. İlk istekler biraz daha yavaş olabilir.
- `dist` klasörü `.gitignore` içinde olsa bile Vercel build sürecinde oluşturulacak ve kullanılacaktır. 