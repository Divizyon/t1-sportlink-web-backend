import express from 'express';
import * as SportController from '../controllers/SportController';
import { authenticate } from '../middleware/authMiddleware';
import { isAdmin } from '../middleware/roleMiddleware';

const router = express.Router();

// Tüm spor kategorilerini getir (herkese açık)
router.get('/', SportController.getSports);

// ID'ye göre spor kategorisi getir (herkese açık)
router.get('/:id', SportController.getSportById);

// Yeni spor kategorisi oluştur (sadece admin)
router.post('/', authenticate, isAdmin, SportController.createSport);

// Spor kategorisini güncelle (sadece admin)
router.put('/:id', authenticate, isAdmin, SportController.updateSport);

// Spor kategorisini sil (sadece admin)
router.delete('/:id', authenticate, isAdmin, SportController.deleteSport);

export default router; 