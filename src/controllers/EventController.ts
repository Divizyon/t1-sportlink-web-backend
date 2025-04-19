import { Request, Response } from 'express';
import * as eventService from '../services/eventService';

/**
 * Get all events with optional filtering by sport_id
 */
export const getEvents = async (req: Request, res: Response) => {
  try {
    // sport_id query parametresini al (varsa)
    const sportId = req.query.sport_id as string;
    
    // Etkinlikleri getir (sport_id varsa filtreleme yap)
    const events = await eventService.getEvents(sportId);
    
    res.status(200).json({
      status: 'success',
      data: {
        events,
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Etkinlikler getirilirken bir hata oluştu.'
    });
  }
};

/**
 * Get a specific event by ID
 */
export const getEventById = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;
    const event = await eventService.getEventById(eventId);
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Etkinlik bulunamadı.'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        event,
      }
    });
  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Etkinlik getirilirken bir hata oluştu.'
    });
  }
};

/**
 * Create a new event
 */
export const createEvent = async (req: Request, res: Response) => {
  try {
    const eventData = req.body;
    
    // Kullanıcı ID'sini ekle (auth middleware'den geliyor)
    eventData.creator_id = req.user.id;
    
    const newEvent = await eventService.createEvent(eventData);
    
    res.status(201).json({
      status: 'success',
      data: {
        event: newEvent,
      }
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Etkinlik oluşturulurken bir hata oluştu.'
    });
  }
};

/**
 * Update an existing event
 */
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;
    const eventData = req.body;
    const userId = req.user.id;
    
    // Etkinliği kontrol et
    const existingEvent = await eventService.getEventById(eventId);
    
    if (!existingEvent) {
      return res.status(404).json({
        status: 'error',
        message: 'Etkinlik bulunamadı.'
      });
    }
    
    // Sadece etkinliği oluşturan kullanıcı güncelleyebilir
    if (existingEvent.creator_id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu etkinliği güncelleme yetkiniz yok.'
      });
    }
    
    const updatedEvent = await eventService.updateEvent(eventId, eventData);
    
    res.status(200).json({
      status: 'success',
      data: {
        event: updatedEvent,
      }
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Etkinlik güncellenirken bir hata oluştu.'
    });
  }
};

/**
 * Delete an event
 */
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    
    // Etkinliği kontrol et
    const existingEvent = await eventService.getEventById(eventId);
    
    if (!existingEvent) {
      return res.status(404).json({
        status: 'error',
        message: 'Etkinlik bulunamadı.'
      });
    }
    
    // Sadece etkinliği oluşturan kullanıcı silebilir
    if (existingEvent.creator_id !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu etkinliği silme yetkiniz yok.'
      });
    }
    
    await eventService.deleteEvent(eventId);
    
    res.status(200).json({
      status: 'success',
      message: 'Etkinlik başarıyla silindi.'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Etkinlik silinirken bir hata oluştu.'
    });
  }
}; 