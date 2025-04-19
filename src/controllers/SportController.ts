import { Request, Response } from 'express';
import * as sportService from '../services/sportService';

/**
 * Get all sports categories
 */
export const getSports = async (_req: Request, res: Response) => {
  try {
    const sports = await sportService.getSports();
    
    res.status(200).json({
      status: 'success',
      data: {
        sports,
      }
    });
  } catch (error) {
    console.error('Get sports error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Spor kategorileri getirilirken bir hata oluştu.'
    });
  }
};

/**
 * Get a specific sport by ID
 */
export const getSportById = async (req: Request, res: Response) => {
  try {
    const sportId = req.params.id;
    const sport = await sportService.getSportById(sportId);
    
    if (!sport) {
      return res.status(404).json({
        status: 'error',
        message: 'Spor kategorisi bulunamadı.'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        sport,
      }
    });
  } catch (error) {
    console.error('Get sport by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Spor kategorisi getirilirken bir hata oluştu.'
    });
  }
};

/**
 * Create a new sport category (admin only)
 */
export const createSport = async (req: Request, res: Response) => {
  try {
    const sportData = req.body;
    
    const newSport = await sportService.createSport(sportData);
    
    res.status(201).json({
      status: 'success',
      data: {
        sport: newSport,
      }
    });
  } catch (error) {
    console.error('Create sport error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Spor kategorisi oluşturulurken bir hata oluştu.'
    });
  }
};

/**
 * Update an existing sport category (admin only)
 */
export const updateSport = async (req: Request, res: Response) => {
  try {
    const sportId = req.params.id;
    const sportData = req.body;
    
    // Spor kategorisini kontrol et
    const existingSport = await sportService.getSportById(sportId);
    
    if (!existingSport) {
      return res.status(404).json({
        status: 'error',
        message: 'Spor kategorisi bulunamadı.'
      });
    }
    
    const updatedSport = await sportService.updateSport(sportId, sportData);
    
    res.status(200).json({
      status: 'success',
      data: {
        sport: updatedSport,
      }
    });
  } catch (error) {
    console.error('Update sport error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Spor kategorisi güncellenirken bir hata oluştu.'
    });
  }
};

/**
 * Delete a sport category (admin only)
 */
export const deleteSport = async (req: Request, res: Response) => {
  try {
    const sportId = req.params.id;
    
    // Spor kategorisini kontrol et
    const existingSport = await sportService.getSportById(sportId);
    
    if (!existingSport) {
      return res.status(404).json({
        status: 'error',
        message: 'Spor kategorisi bulunamadı.'
      });
    }
    
    await sportService.deleteSport(sportId);
    
    res.status(200).json({
      status: 'success',
      message: 'Spor kategorisi başarıyla silindi.'
    });
  } catch (error) {
    console.error('Delete sport error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Spor kategorisi silinirken bir hata oluştu.'
    });
  }
}; 