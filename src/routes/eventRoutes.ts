import { Router } from 'express';
import { EventController } from '../controllers/EventController';

const router = Router();

router.get('/pending', EventController.getPendingEvents);
router.get('/:id', EventController.getEventById);
router.patch('/:id/status', EventController.updateEventStatus);

export default router; 