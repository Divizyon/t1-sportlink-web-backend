import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import EventRatingService from '../services/EventRatingService';

class EventRatingController {
  // Etkinliğin tüm yorumlarını getir
  async getEventRatings(req: Request, res: Response) {
    try {
      const eventId = parseInt(req.params.eventId);
      
      if (isNaN(eventId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Geçersiz etkinlik ID'
        });
      }

      const ratings = await EventRatingService.getEventRatings(eventId);
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: ratings
      });
    } catch (error: any) {
      console.error('Hata (getEventRatings controller):', error);
      
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Yorumlar getirilirken bir hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  // Kullanıcının belirli bir etkinliğe yaptığı yorumu getir
  async getUserRatingForEvent(req: Request, res: Response) {
    try {
      const eventId = parseInt(req.params.eventId);
      const userId = req.user?.id;
      
      if (isNaN(eventId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Geçersiz etkinlik ID'
        });
      }

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Bu işlem için giriş yapmanız gerekmektedir'
        });
      }

      const rating = await EventRatingService.getUserRatingForEvent(eventId, userId);
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: rating || null
      });
    } catch (error: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Yorum getirilirken bir hata oluştu'
      });
    }
  }

  // Yeni yorum/puanlama ekle
  async addRating(req: Request, res: Response) {
    try {
      const eventId = parseInt(req.params.eventId);
      const userId = req.user?.id;
      const { review, rating } = req.body;
      
      if (isNaN(eventId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Geçersiz etkinlik ID'
        });
      }

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Bu işlem için giriş yapmanız gerekmektedir'
        });
      }

      if (!review) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Yorum alanı zorunludur'
        });
      }

      const ratingData = {
        event_id: eventId,
        user_id: userId,
        review,
        rating: rating ? parseInt(rating) : undefined
      };

      const newRating = await EventRatingService.addRating(ratingData);
      
      return res.status(StatusCodes.CREATED).json({
        success: true,
        data: newRating,
        message: 'Yorum başarıyla eklendi'
      });
    } catch (error: any) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Yorum eklenirken bir hata oluştu'
      });
    }
  }

  // Yorumu güncelle
  async updateRating(req: Request, res: Response) {
    try {
      const ratingId = parseInt(req.params.ratingId);
      const userId = req.user?.id;
      const { review, rating } = req.body;
      
      if (isNaN(ratingId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Geçersiz yorum ID'
        });
      }

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Bu işlem için giriş yapmanız gerekmektedir'
        });
      }

      if (!review) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Yorum alanı zorunludur'
        });
      }

      const updates = {
        review,
        rating: rating ? parseInt(rating) : undefined
      };

      const updatedRating = await EventRatingService.updateRating(ratingId, userId, updates);
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: updatedRating,
        message: 'Yorum başarıyla güncellendi'
      });
    } catch (error: any) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Yorum güncellenirken bir hata oluştu'
      });
    }
  }

  // Yorumu sil
  async deleteRating(req: Request, res: Response) {
    try {
      const ratingId = parseInt(req.params.ratingId);
      const userId = req.user?.id;
      
      if (isNaN(ratingId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Geçersiz yorum ID'
        });
      }

      if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Bu işlem için giriş yapmanız gerekmektedir'
        });
      }

      const result = await EventRatingService.deleteRating(ratingId, userId);
      
      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Yorum başarıyla silindi'
      });
    } catch (error: any) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.message || 'Yorum silinirken bir hata oluştu'
      });
    }
  }

  // Etkinliğin ortalama puanını getir
  async getEventAverageRating(req: Request, res: Response) {
    try {
      const eventId = parseInt(req.params.eventId);
      
      if (isNaN(eventId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Geçersiz etkinlik ID'
        });
      }

      const ratingStats = await EventRatingService.getEventAverageRating(eventId);
      
      return res.status(StatusCodes.OK).json({
        success: true,
        data: ratingStats
      });
    } catch (error: any) {
      console.error('Hata (getEventAverageRating controller):', error);
      
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || 'Etkinlik ortalama puanı getirilirken bir hata oluştu',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
}

export default new EventRatingController(); 