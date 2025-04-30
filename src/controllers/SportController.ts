import { Request, Response } from 'express';
import * as sportService from '../services/sportService';
import logger from '../utils/logger';

export const getAllSports = async (req: Request, res: Response) => {
  try {
    const Sports = await sportService.getAllSports();
    
    res.status(200).json({
      status: 'success',
      data: {
        Sports
      }
    });
  } catch (error) {
    logger.error('Get all Sports error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Spor türleri getirilirken bir hata oluştu.'
    });
  }
}; 