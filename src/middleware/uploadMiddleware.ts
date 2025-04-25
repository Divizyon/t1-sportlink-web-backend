import multer from 'multer';
import { BadRequestError } from '../errors/customErrors';

// Bellekte saklama seçeneğini kullanıyoruz (Supabase'e doğrudan yüklemek için)
const storage = multer.memoryStorage();

// Dosya türü filtresi (sadece resim dosyaları)
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Sadece resim dosyaları yüklenebilir! Desteklenen formatlar: JPG, PNG, GIF, WEBP.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5 MB limit
  }
});

export default upload; 