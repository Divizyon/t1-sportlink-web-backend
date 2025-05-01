import { Request, Response } from 'express';
import * as announcementService from '../services/announcementService';
import { uploadToStorage } from '../middleware/uploadMiddleware';

/**
 * Tüm duyuruları listeler
 * @param req Express Request
 * @param res Express Response
 */
export const getAllAnnouncements = async (req: Request, res: Response): Promise<void> => {
  try {
    const announcements = await announcementService.getAllAnnouncements();
    
    res.status(200).json({
      message: 'Duyurular başarıyla getirildi',
      data: announcements
    });
  } catch (error) {
    console.error('Duyurular getirilirken hata oluştu:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
    
    res.status(500).json({ 
      message: 'Duyurular getirilirken bir hata oluştu', 
      error: errorMessage 
    });
  }
};

/**
 * Tek bir duyuruyu ID ile getirir
 * @param req Express Request
 * @param res Express Response
 */
export const getAnnouncementById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ message: 'Duyuru ID gereklidir' });
      return;
    }
    
    const announcement = await announcementService.getAnnouncementById(id);
    
    if (!announcement) {
      res.status(404).json({ message: 'Duyuru bulunamadı' });
      return;
    }
    
    res.status(200).json({
      message: 'Duyuru başarıyla getirildi',
      data: announcement
    });
  } catch (error) {
    console.error('Duyuru getirilirken hata oluştu:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
    
    if (errorMessage.includes('bulunamadı')) {
      res.status(404).json({ message: errorMessage });
    } else {
      res.status(500).json({ 
        message: 'Duyuru getirilirken bir hata oluştu', 
        error: errorMessage 
      });
    }
  }
};

/**
 * Yeni bir duyuru oluşturur (sadece admin)
 * @param req Express Request
 * @param res Express Response
 */
export const createAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;
    const creatorId = req.user?.id;
    
    // Dosya yükleme işlemini başlat
    let image_url = null;
    if (req.file) {
      // Dosyayı Supabase Storage'a yükle
      image_url = await uploadToStorage(req.file);
    }
    
    if (!title || !content) {
      res.status(400).json({ message: 'Başlık ve içerik alanları zorunludur' });
      return;
    }
    
    if (!creatorId) {
      res.status(401).json({ message: 'Bu işlem için giriş yapmalısınız' });
      return;
    }
    
    const newAnnouncement = await announcementService.createAnnouncement({
      title,
      content,
      image_url,
      creator_id: creatorId
    });
    
    res.status(201).json({
      message: 'Duyuru başarıyla oluşturuldu',
      data: newAnnouncement
    });
  } catch (error) {
    console.error('Duyuru oluşturulurken hata oluştu:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
    
    res.status(500).json({ 
      message: 'Duyuru oluşturulurken bir hata oluştu', 
      error: errorMessage 
    });
  }
};

/**
 * Bir duyuruyu günceller (sadece admin)
 * @param req Express Request
 * @param res Express Response
 */
export const updateAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const adminId = req.user?.id;
    
    // Dosya yükleme işlemini başlat
    let image_url = undefined; // undefined kullanıldığında mevcut değer korunur
    if (req.file) {
      // Dosyayı Supabase Storage'a yükle
      image_url = await uploadToStorage(req.file);
    }
    
    if (!id) {
      res.status(400).json({ message: 'Duyuru ID gereklidir' });
      return;
    }
    
    if (!adminId) {
      res.status(401).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
      return;
    }
    
    const updatedAnnouncement = await announcementService.updateAnnouncement(id, {
      title,
      content,
      image_url,
      updater_id: adminId
    });
    
    res.status(200).json({
      message: 'Duyuru başarıyla güncellendi',
      data: updatedAnnouncement
    });
  } catch (error) {
    console.error('Duyuru güncellenirken hata oluştu:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
    
    if (errorMessage.includes('bulunamadı')) {
      res.status(404).json({ message: errorMessage });
    } else {
      res.status(500).json({ 
        message: 'Duyuru güncellenirken bir hata oluştu', 
        error: errorMessage 
      });
    }
  }
};

/**
 * Bir duyuruyu siler (sadece admin)
 * @param req Express Request
 * @param res Express Response
 */
export const deleteAnnouncement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    
    if (!id) {
      res.status(400).json({ message: 'Duyuru ID gereklidir' });
      return;
    }
    
    if (!adminId) {
      res.status(401).json({ message: 'Bu işlem için yetkiniz bulunmamaktadır' });
      return;
    }
    
    await announcementService.deleteAnnouncement(id);
    
    res.status(200).json({
      message: 'Duyuru başarıyla silindi'
    });
  } catch (error) {
    console.error('Duyuru silinirken hata oluştu:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
    
    if (errorMessage.includes('bulunamadı')) {
      res.status(404).json({ message: errorMessage });
    } else {
      res.status(500).json({ 
        message: 'Duyuru silinirken bir hata oluştu', 
        error: errorMessage 
      });
    }
  }
}; 