import express from 'express';
import * as ReportController from '../controllers/ReportController';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { enforceDbConnection } from '../middleware/databaseMiddleware';

// Bu rota dosyası Admin rapor işlemleri için kullanılır
// Ancak index.ts'de kullanılmadığından API'da erişilemez durumdadır

const router = express.Router();

// Tüm rapor rotaları korumalıdır ve sadece admin ve staff erişebilir
router.use(protect);
router.use(restrictTo('ADMIN', 'STAFF'));

// UYARI: Bu rotalar index.ts'de bağlanmadığından erişilemezdir
// Rotaları etkinleştirmek için src/routes/index.ts'ye tekrar ekleyin

router.get('/', enforceDbConnection, ReportController.getAllReports);
router.get('/dashboard', ReportController.getReportData);
router.patch('/:id/status', ReportController.updateReportStatus);
router.patch('/:id/notes', ReportController.updateAdminNotes);
router.post('/:id/ban-user', ReportController.banUserFromReport);
router.get('/:id/admin-info', ReportController.getReportAdminInfo);
router.get('/:id', ReportController.getReportDetails);
router.post('/test', ReportController.createTestReport);

export default router;