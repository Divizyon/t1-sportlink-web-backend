import { Request, Response } from 'express';
import * as eventService from '../services/eventService';
import { UpdateEventStatusSchema, EventNotFoundError, EventPermissionError, EventStatusError, EventValidationError } from '../models/Event';
import logger from '../utils/logger';
import { EventValidationSchema } from '../models/Event';

export const updateEventStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Oturum açmış kullanıcının kimliğini al
    const userId = req.userProfile?.id;
    
    // Kullanıcı kimliği kontrolü
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }
    
    console.log(`Etkinlik durumu güncelleme isteği: eventId=${id}, status=${status}`);
    
    try {
      // Status validasyonu 
      const statusValidation = UpdateEventStatusSchema.safeParse({ status });
      if (!statusValidation.success) {
        return res.status(400).json({
          status: 'error',
          message: 'Geçersiz etkinlik durumu.'
        });
      }
      
      // Etkinlik durumunu güncelle
      const updatedEvent = await eventService.updateEventStatus(id, status, userId);
      
      console.log("Etkinlik durumu güncellendi:", updatedEvent);
      
      res.status(200).json({
        status: 'success',
        data: {
          event: updatedEvent
        }
      });
    } catch (error) {
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
      
      console.error('Etkinlik durumu güncelleme hatası:', error);
      throw error;
    }
  } catch (error) {
    console.error('Etkinlik durumu güncelleme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Etkinlik durumu güncellenirken bir hata oluştu.'
    });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    // Oturum açmış kullanıcının kimliğini al
    const userId = req.userProfile?.id;
    
    // Kullanıcı kimliği kontrolü
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız.'
      });
    }
    
    try {
      console.log("Etkinlik oluşturma isteği:", req.body);
      
      // Etkinliği oluştur
      const newEvent = await eventService.createEvent({
        ...req.body,
        creator_id: userId
      });

      console.log("Etkinlik başarıyla oluşturuldu:", newEvent);

      // Başarılı yanıt
      return res.status(201).json({
        status: 'success',
        data: {
          event: newEvent
        }
      });
    } catch (error: any) {
      console.error("Etkinlik oluşturma hatası:", error);
      if (error.message.includes('validation')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Etkinlik oluşturma hatası:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Etkinlik oluşturulurken bir hata oluştu.'
    });
  }
};

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    console.log('Tüm etkinlikler istendi');
    
    // Etkinlikleri getir
    const events = await eventService.getAllEvents();
    
    console.log(`${events.length} etkinlik bulundu`);
    
    res.status(200).json({
      status: 'success',
      data: {
        events
      }
    });
  } catch (error) {
    console.error('Etkinlikleri getirme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Etkinlikler getirilirken bir hata oluştu.'
    });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`Etkinlik detayı istendi: ${id}`);
    
    try {
      // Etkinliği getir
      const event = await eventService.findEventById(id);
      
      console.log(`Etkinlik bulundu: ${id}`);
      
      res.status(200).json({
        status: 'success',
        data: {
          event
        }
      });
    } catch (error) {
      if (error instanceof EventNotFoundError) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Etkinlik detayı getirme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Etkinlik detayı getirilirken bir hata oluştu.'
    });
  }
}; 