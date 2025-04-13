import { Request, Response } from 'express';
import * as eventService from '../services/eventService';
import { UpdateEventStatusSchema, EventNotFoundError, EventPermissionError, EventStatusError, EventValidationError } from '../models/Event';
import logger from '../utils/logger';

export const updateEventStatus = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;
    const userId = req.user?.id;

    // Yetkilendirme kontrolü
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Oturum açmanız gerekmektedir.'
      });
    }

    // Status validasyonu
    const validationResult = UpdateEventStatusSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Geçersiz etkinlik durumu. Geçerli durumlar: active, cancelled, completed'
      });
    }

    const { status } = validationResult.data;

    const updatedEvent = await eventService.updateEventStatus(eventId, status, userId);

    logger.info(`Event status updated: ${eventId} -> ${status} by user: ${userId}`);

    res.status(200).json({
      status: 'success',
      data: {
        event: updatedEvent
      }
    });
  } catch (error) {
    logger.error('Update event status error:', error);

    if (error instanceof EventNotFoundError) {
      return res.status(404).json({
        status: 'error',
        message: error.message
      });
    }

    if (error instanceof EventPermissionError) {
      return res.status(403).json({
        status: 'error',
        message: error.message
      });
    }

    if (error instanceof EventStatusError) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }

    if (error instanceof EventValidationError) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Etkinlik durumu güncellenirken bir hata oluştu.'
    });
  }
}; 