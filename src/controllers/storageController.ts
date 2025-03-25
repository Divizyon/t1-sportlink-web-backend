import { Request, Response } from 'express';
import storageService from '../services/storageService';

// Varsayılan bucket adı
const DEFAULT_BUCKET = 'sportlink-files';

// Supabase storage bağlantısını test et
const testStorage = async (req: Request, res: Response) => {
  try {
    const result = await storageService.testStorageConnection();
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Test hatası:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Dosya yükleme
const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya bulunamadı' });
    }

    const { bucket = DEFAULT_BUCKET, path = '' } = req.body;
    
    console.log(`Dosya yükleniyor: Bucket=${bucket}, Path=${path}, Dosya=${req.file.originalname}`);
    
    // Dosya adını oluştur
    const fileName = `${path ? path + '/' : ''}${Date.now()}_${req.file.originalname}`;
    
    const result = await storageService.uploadFile(
      bucket,
      fileName,
      req.file.buffer
    );

    // Yüklenen dosyanın genel URL'ini al
    const publicUrl = await storageService.getFileUrl(bucket, fileName);

    return res.status(200).json({
      success: true,
      data: result,
      publicUrl,
    });
  } catch (error: any) {
    console.error('Dosya yükleme hatası:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Dosyayı getir
const getFile = async (req: Request, res: Response) => {
  try {
    const { bucket, filePath } = req.params;
    
    if (!bucket || !filePath) {
      return res.status(400).json({ error: 'Bucket ve dosya yolu gereklidir' });
    }

    const fileUrl = await storageService.getFileUrl(bucket, filePath);
    
    return res.status(200).json({
      success: true,
      url: fileUrl,
    });
  } catch (error: any) {
    console.error('Dosya getirme hatası:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Dosya sil
const deleteFile = async (req: Request, res: Response) => {
  try {
    const { bucket, filePath } = req.params;
    
    if (!bucket || !filePath) {
      return res.status(400).json({ error: 'Bucket ve dosya yolu gereklidir' });
    }

    await storageService.deleteFile(bucket, filePath);
    
    return res.status(200).json({
      success: true,
      message: 'Dosya başarıyla silindi',
    });
  } catch (error: any) {
    console.error('Dosya silme hatası:', error);
    return res.status(500).json({ error: error.message });
  }
};

export default {
  testStorage,
  uploadFile,
  getFile,
  deleteFile,
}; 