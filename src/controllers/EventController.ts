import { Request, Response } from 'express';
import { EventService } from '../services/EventService';

export class EventController {
  static async getPendingEvents(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await EventService.getPendingEvents(page, limit);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Onay bekleyen etkinlikler getirilirken bir hata oluştu'
      });
    }
  }

  static async getEventById(req: Request, res: Response) {
    try {
      const event = await EventService.getEventById(req.params.id);
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Etkinlik bulunamadı'
        });
      }

      return res.status(200).json({
        success: true,
        data: event
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Etkinlik getirilirken bir hata oluştu'
      });
    }
  }

  static async updateEventStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz durum değeri'
        });
      }

      const event = await EventService.updateEventStatus(req.params.id, status);
      
      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'Etkinlik bulunamadı'
        });
      }

      return res.status(200).json({
        success: true,
        data: event
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Etkinlik durumu güncellenirken bir hata oluştu'
      });
    }
  }
} 