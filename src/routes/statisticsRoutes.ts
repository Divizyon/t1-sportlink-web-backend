import { Router } from 'express';
import { StatisticsController } from '../controllers/StatisticsController';
// İleride kimlik doğrulama gibi ara katmanlar (middleware) eklemek gerekebilir
// import { authenticateToken } from '../middleware/authMiddleware'; // Örnek

const router = Router();

// Haftalık istatistikler için GET endpoint'i
// Örnek istek: GET /api/statistics/weekly?startDate=2023-10-23&endDate=2023-10-29
router.get(
    '/weekly',
    // authenticateToken, // Eğer bu route korumalı olacaksa kimlik doğrulama middleware'ini burada kullanın
    StatisticsController.getWeeklyStats
);

// Aylık istatistikler için route tanımı buraya eklenecek...
// Örnek istek: GET /api/statistics/monthly?year=2024&month=5
router.get(
    '/monthly',
    // authenticateToken, // Gerekirse kimlik doğrulama
    StatisticsController.getMonthlyStats
);

// Router'ı dışa aktararak ana uygulama dosyasında (örn: src/app.ts) kullanılabilir hale getiriyoruz.
export default router; 