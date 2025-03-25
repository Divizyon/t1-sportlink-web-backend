@echo off
setlocal enabledelayedexpansion

:menu
cls
echo ===== Sportlink Storage Backend Server Kontrol =====
echo.
echo 1. Server'ı başlat
echo 2. Server'ı durdur
echo 3. Çıkış
echo.

set /p choice=Lütfen bir seçenek girin (1-3): 

if "%choice%"=="1" (
  cls
  echo Server başlatılıyor...
  echo.
  start /B cmd /c "npx nodemon --exec ts-node src/index.ts > server.log 2>&1"
  echo Server arka planda başlatıldı.
  echo Log dosyası: server.log
  echo.
  pause
  goto :menu
)

if "%choice%"=="2" (
  cls
  echo Server durduruluyor...
  echo.
  taskkill /F /IM node.exe > nul 2>&1
  if %errorlevel% equ 0 (
    echo Server başarıyla durduruldu.
  ) else (
    echo Server zaten çalışmıyor veya durdurulamadı.
  )
  echo.
  pause
  goto :menu
)

if "%choice%"=="3" (
  echo Çıkış yapılıyor...
  goto :end
)

echo Geçersiz seçenek. Lütfen tekrar deneyin.
pause
goto :menu

:end
echo.
echo İşlem tamamlandı.
exit /b 0 