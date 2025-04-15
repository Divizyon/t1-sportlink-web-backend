import { Request, Response } from 'express';
import * as eventService from '../services/eventService';

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const events = await eventService.getAllEvents();
    
    res.status(200).json(events);
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Etkinlikler getirilirken bir hata oluştu.'
    });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const event = await eventService.getEventById(id);
    
    if (!event) {
      return res.status(404).json({
        status: 'error',
        message: 'Etkinlik bulunamadı.'
      });
    }
    
    res.status(200).json(event);
  } catch (error) {
    console.error('Get event by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Etkinlik getirilirken bir hata oluştu.'
    });
  }
}; 