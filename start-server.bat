@echo off
echo Server başlatılıyor...
echo.

start /B cmd /c "npx nodemon --exec ts-node src/index.ts > server.log 2>&1"
for /f "tokens=2" %%a in ('tasklist ^| findstr "node.exe"') do set "pid=%%a"
echo %pid% > server.pid

echo Server arka planda başlatıldı.
echo Log dosyası: server.log
echo PID: %pid%
echo.
echo Server'ı durdurmak için Ctrl+C tuşlarına basın.
echo.

:loop
timeout /t 1 /nobreak > nul
goto :loop 