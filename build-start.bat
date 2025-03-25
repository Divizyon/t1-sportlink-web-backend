@echo off
echo Sportlink Storage Backend sunucusu derleniyor ve başlatılıyor...

:: Ortam değişkenlerinin doğru şekilde ayarlandığını kontrol et
if not exist .env (
  echo HATA: .env dosyası bulunamadı!
  echo Lütfen .env dosyasını oluşturun ve gerekli değişkenleri ayarlayın:
  echo PORT=3000
  echo NODE_ENV=production
  echo SUPABASE_URL=your_supabase_url
  echo SUPABASE_KEY=your_supabase_key
  pause
  exit /b 1
)

:: node_modules klasörünün varlığını kontrol et
if not exist node_modules (
  echo Bağımlılıklar yüklü değil. Yükleniyor...
  call npm install
  if %ERRORLEVEL% neq 0 (
    echo HATA: Bağımlılıklar yüklenemedi!
    pause
    exit /b 1
  )
)

:: Projeyi derle
echo Proje derleniyor...
call npm run build
if %ERRORLEVEL% neq 0 (
  echo HATA: Proje derlenemedi!
  pause
  exit /b 1
)

:: Üretim modunda sunucuyu başlat
echo Sunucu başlatılıyor...
call npm start

pause 