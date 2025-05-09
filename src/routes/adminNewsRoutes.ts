import { Router } from 'express';
import multer from 'multer';
import { NewsController } from '../controllers/NewsController';
import { protect } from '../middleware/authMiddleware';
import { isAdmin } from '../middleware/adminCheckMiddleware';
import logger from '../utils/logger';

const router = Router();

// Bu dosya, admin/yönetici tarafından kullanılan haber endpoint'lerini içerir
// Ancak artık routes/index.ts'de bağlantısı olmadığından API'da erişilemez durumdadır
// İhtiyaç duyulursa tekrar eklenebilir

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      logger.warn(`Geçersiz dosya türü yüklendi: ${file.mimetype}, fieldname=${file.fieldname}`);
      cb(new Error('Sadece resim dosyaları yüklenebilir!'));
    }
  }
});

router.post(
  '/',
  protect,
  isAdmin,
  upload.single('image'),
  NewsController.createNews
);

router.get('/', NewsController.getNews);

router.get('/:id', NewsController.getNews);

router.put(
  '/:id',
  protect,
  isAdmin,
  upload.single('image'),
  NewsController.updateNews
);

router.delete(
  '/:id',
  protect,
  isAdmin,
  NewsController.deleteNews
);

export default router; 