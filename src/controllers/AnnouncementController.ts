import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import AnnouncementService from '../services/announcementService';

/**
 * List all announcements
 * @param req Express Request
 * @param res Express Response
 */
export const getAllAnnouncements = async (req: Request, res: Response) => {
  try {
    const announcements = await AnnouncementService.getAllAnnouncements();
    
    return res.status(StatusCodes.OK).json({
      success: true,
      data: announcements
    });
  } catch (error: any) {
    console.error('Error (getAllAnnouncements controller):', error);
    
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Error retrieving announcements'
    });
  }
};

/**
 * Get a single announcement by ID
 * @param req Express Request
 * @param res Express Response
 */
export const getAnnouncementById = async (req: Request, res: Response) => {
  try {
    const announcementId = req.params.id;
    
    if (!announcementId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid announcement ID'
      });
    }

    const announcement = await AnnouncementService.getAnnouncementById(announcementId);
    
    if (!announcement) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    return res.status(StatusCodes.OK).json({
      success: true,
      data: announcement
    });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Error retrieving announcement'
    });
  }
};

// Get latest announcements (with limit)
export const getLatestAnnouncements = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    
    const announcements = await AnnouncementService.getLatestAnnouncements(limit);
    
    return res.status(StatusCodes.OK).json({
      success: true,
      data: announcements
    });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Error retrieving announcements'
    });
  }
}; 