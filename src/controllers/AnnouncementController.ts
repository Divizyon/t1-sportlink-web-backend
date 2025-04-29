import { Request, Response, NextFunction } from 'express';
import { AnnouncementService } from '../services/AnnouncementService';
import logger from '../utils/logger';

export const AnnouncementController = {
  async createAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get text fields from req.body
      const { title, content, imageUrl } = req.body;
      // Get image file from req.file (added by multer)
      const file = req.file;
      
      // Get admin user ID from req.userProfile (added by auth middleware) or use null during testing
      const creatorId = req.userProfile?.id || null;

      // Required field validation
      if (!title || !content) {
        res.status(400).json({ status: 'error', message: 'Title and content fields are required.' });
        return;
      }

      logger.info('AnnouncementController: Announcement creation request received', { 
        title, 
        creatorId: creatorId || 'not provided', 
        hasFile: !!file,
        hasImageUrl: !!imageUrl 
      });

      // Call service layer - explicitly cast creatorId to match service type
      const newAnnouncement = await AnnouncementService.createAnnouncement({
        title,
        content,
        creatorId: creatorId,
        image: file,
        imageUrl
      });

      // Success response
      res.status(201).json({
        status: 'success',
        message: 'Announcement created successfully.',
        data: newAnnouncement
      });

    } catch (error) {
      // Error handling
      logger.error('AnnouncementController.createAnnouncement - Error:', error);
      next(error);
    }
  },

  async getAnnouncements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const announcements = await AnnouncementService.getAnnouncements();
      
      res.status(200).json({
        status: 'success',
        message: 'Announcements fetched successfully.',
        data: announcements
      });
    } catch (error) {
      logger.error('AnnouncementController.getAnnouncements - Error:', error);
      next(error);
    }
  },

  async getAnnouncementById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const announcementId = parseInt(req.params.id, 10);
      
      if (isNaN(announcementId)) {
        res.status(400).json({ status: 'error', message: 'Invalid announcement ID.' });
        return;
      }
      
      const announcement = await AnnouncementService.getAnnouncementById(announcementId);
      
      if (!announcement) {
        res.status(404).json({ status: 'error', message: 'Announcement not found.' });
        return;
      }
      
      res.status(200).json({
        status: 'success',
        message: 'Announcement fetched successfully.',
        data: announcement
      });
    } catch (error) {
      logger.error('AnnouncementController.getAnnouncementById - Error:', error);
      next(error);
    }
  }
}; 