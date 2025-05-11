const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Başlatılıyor: Vercel için build süreci...');

// TypeScript kaynak kodunu derleme
console.log('📦 TypeScript kodunu derleniyor...');
execSync('npm run build', { stdio: 'inherit' });

// Derleme başarılı oldu mu kontrol et
if (!fs.existsSync('./dist')) {
  console.error('❌ Derleme hatası: dist klasörü bulunamadı!');
  process.exit(1);
}

console.log('✅ Build süreci başarıyla tamamlandı!'); 