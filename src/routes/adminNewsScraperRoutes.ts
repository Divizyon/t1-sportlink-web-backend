import { Router } from 'express';
import { NewsScraperController } from '../controllers/NewsScraperController';
import { protect, isAdmin } from '../middleware/authMiddleware';

// Bu dosya, admin/yönetici tarafından kullanılan haber scraper endpoint'lerini içerir
// Ancak artık API'da erişilemez durumdadır
// İhtiyaç duyulursa tekrar eklenebilir

const router = Router();
const newsScraperController = new NewsScraperController();

// URL'den haberleri scrape et ve veritabanına kaydet
router.post(
  '/scrape',
  protect,
  isAdmin,
  newsScraperController.scrapeNewsFromUrl
);

// Bekleyen haberleri listele
router.get(
  '/pending',
  protect,
  isAdmin,
  newsScraperController.listPendingNews
);

// Onaylanmış haberleri listele
router.get(
  '/approved',
  protect,
  newsScraperController.listApprovedNews
);

// Reddedilmiş haberleri listele
router.get(
  '/rejected',
  protect,
  isAdmin,
  newsScraperController.listRejectedNews
);

// Tüm scrape edilmiş haberleri listele
router.get(
  '/scraped',
  protect,
  newsScraperController.listAllScrapedNews
);

// Haber durumunu güncelle (onaylama/reddetme)
router.patch(
  '/:id/status',
  protect,
  isAdmin,
  newsScraperController.updateNewsStatus
);

// Belirli bir haberi sil
router.delete(
  '/:id',
  protect,
  isAdmin,
  newsScraperController.deleteNews
);

export default router;
