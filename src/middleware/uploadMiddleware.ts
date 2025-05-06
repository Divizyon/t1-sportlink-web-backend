import multer from 'multer';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/supabase';

// Multer storage için memory storage kullan
// Böylece dosyalar önce hafızaya alınır ve sonra Supabase'e yüklenebilir
const storage = multer.memoryStorage();

// Sadece resim dosyalarını kabul eden filtre
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Sadece JPEG, PNG, GIF ve WEBP formatında resimler yüklenebilir.'));
  }
};

// Dosya boyutu limiti (5MB) ile Multer yükleme örneği oluştur
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Tek dosya yüklemesi için middleware
export const uploadImage = upload.single('avatar');

/**
 * Dosyayı Supabase Storage'a yükler
 * @param file Express.Multer.File objesi
 * @param path Storage içindeki isteğe bağlı alt klasör yolu
 * @returns {Promise<string>} Yüklenen dosyanın URL'si
 */
export const uploadToStorage = async (file: Express.Multer.File, path: string = ''): Promise<string> => {
  try {
    // Dosya adını oluştur
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    // Dosyayı Supabase Storage'a yükle
    const { data, error } = await supabaseAdmin.storage
      .from('sportlink-files')
      .upload(`announcements/${filePath}`, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Dosya yükleme hatası:', error);
      throw new Error(`Dosya yüklenirken bir hata oluştu: ${error.message}`);
    }

    // Dosya URL'sini getir
    const { data: urlData } = supabaseAdmin.storage
      .from('sportlink-files')
      .getPublicUrl(`announcements/${filePath}`);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Dosya yükleme işlemi sırasında hata:', error);
    throw error;
  }
}; 