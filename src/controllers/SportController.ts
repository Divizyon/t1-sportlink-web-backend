import { Request, Response } from 'express';
import * as sportService from '../services/sportService';
import logger from '../utils/logger';

export const getAllSports = async (req: Request, res: Response) => {
  try {
    const sports = await sportService.getAllSports();
    
    res.status(200).json({
      status: 'success',
      data: {
        sports
      }
    });
  } catch (error) {
    logger.error(`Get all sports error: ${JSON.stringify(error)}`);
    res.status(500).json({
      status: 'error',
      message: 'Spor türleri getirilirken bir hata oluştu.'
    });
  }
}; 