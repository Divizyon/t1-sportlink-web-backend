import { supabaseAdmin } from '../config/supabase';

export const sendWarningEmail = async (
  to: string,
  userName: string,
  message: string,
  adminName: string
) => {
  try {
    // TODO: SMTP yapılandırması henüz tamamlanmadı
    console.warn('⚠️ Email gönderme devre dışı: SMTP yapılandırması gerekiyor');
    console.info({
      to,
      userName,
      message,
      adminName,
      status: 'Email gönderimi atlandı - SMTP ayarları beklemede'
    });
    
    return {
      success: true,
      message: 'Email gönderimi geçici olarak devre dışı bırakıldı. SMTP yapılandırması tamamlandığında aktif edilecek.'
    };
  } catch (error) {
    console.error('Email işlemi hatası:', error);
    throw error;
  }
};