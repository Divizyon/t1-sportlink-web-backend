import express from 'express';
import * as EventController from '../controllers/EventController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// Get all events (with optional sport_id filter)
router.get('/', EventController.getEvents);

// Get a specific event by ID
router.get('/:id', EventController.getEventById);

// Create a new event (requires authentication)
router.post('/', authenticate, EventController.createEvent);

// Update an event (requires authentication)
router.put('/:id', authenticate, EventController.updateEvent);

// Delete an event (requires authentication)
router.delete('/:id', authenticate, EventController.deleteEvent);

export default router; 