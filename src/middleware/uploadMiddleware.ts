import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

// Dosya yükleme sınırlamaları
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Dosya tipini kontrol eden filtre
const fileFilter = (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    // Dosya tipine izin veriliyor
    cb(null, true);
  } else {
    // Dosya tipine izin verilmiyor
    cb(new Error('Geçersiz dosya tipi. Sadece JPEG, JPG, PNG ve WEBP dosyaları kabul edilir.'));
  }
};

// Memory storage kullanarak dosyaları buffer olarak tutma
const storage = multer.memoryStorage();

// Yükleme ayarlarını yapılandırma
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: fileFilter
});

// Avatar yüklemeleri için middleware (tek dosya)
export const uploadAvatar = upload.single('avatar');

// Çoklu dosya yüklemeleri için genişletilebilir (gerekirse)
export const uploadMultiple = (fieldName: string, maxCount: number = 5) => {
  return upload.array(fieldName, maxCount);
};

export default upload; 