import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { LoginDTO, CreateUserDTO } from '../models/User';
import { SecurityService } from '../services/securityService';
import logger from '../utils/logger';
import supabase,{ supabaseAdmin } from '../config/supabase';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, password_confirm, first_name, last_name, birthday_date } = req.body;
    
    // Gerekli alanları kontrol et
    if (!email || !password || !password_confirm || !first_name || !last_name) {
      return res.status(400).json({
        status: 'error',
        message: 'Tüm alanları doldurun: isim, soyisim, e-posta ve şifre gereklidir.'
      });
    }
    
    // Şifrelerin eşleştiğini kontrol et
    if (password !== password_confirm) {
      return res.status(400).json({
        status: 'error',
        message: 'Şifreler eşleşmiyor. Lütfen aynı şifreyi tekrar girin.'
      });
    }
    
    // Şifre uzunluğu kontrolü
    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Şifre en az 6 karakter uzunluğunda olmalıdır.'
      });
    }
    
    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Geçerli bir e-posta adresi girin.'
      });
    }
    
    // Doğum tarihi kontrolü (eğer varsa)
    if (birthday_date) {
      const birthdayDateObj = new Date(birthday_date);
      const today = new Date();
      
      // Tarih geçerli mi kontrol et
      if (isNaN(birthdayDateObj.getTime())) {
        return res.status(400).json({
          status: 'error',
          message: 'Geçerli bir doğum tarihi girin (YYYY-MM-DD formatında).'
        });
      }
      
      // Doğum tarihi gelecekte olamaz
      if (birthdayDateObj > today) {
        return res.status(400).json({
          status: 'error',
          message: 'Doğum tarihi gelecek bir tarih olamaz.'
        });
      }
    }
    
    // IP adresini al
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    
    // User rolünde yeni kullanıcı oluştur
    const userData = { email, password, first_name, last_name, birthday_date };
    console.log('Register attempt with data:', { ...userData, password: '***' });
    
    // Kullanıcı oluştur
    const newUser = await userService.createUser(userData);
    if (!newUser) {
      console.error('User creation failed: newUser is null');
      
      // Başarısız kayıt işlemini logla
      await SecurityService.createLog({
        type: 'user_update',
        admin: email,
        ip,
        status: 'error',
        action: `Kayıt başarısız`
      });
      
      return res.status(500).json({
        status: 'error',
        message: 'Kullanıcı oluşturulurken bir hata oluştu.'
      });
    }
    
    console.log('User created successfully:', newUser.id);
    
    // Doğrulama e-postası gönder
    try {
      await authService.sendVerificationEmail(email);
      console.log('Verification email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // E-posta gönderimi başarısız olsa bile işleme devam ediyoruz
    }
    
    // Başarılı kayıt işlemini logla
    await SecurityService.createLog({
      type: 'user_update',
      admin: `${newUser.first_name} ${newUser.last_name}`,
      ip,
      status: 'success',
      action: `Yeni kayıt / ${newUser.email}`
    });
    
    // Başarılı yanıt
    res.status(201).json({
      status: 'success',
      message: 'Kayıt işlemi başarılı. Lütfen e-posta adresinizi doğrulayın.',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          birthday_date: newUser.birthday_date,
          role: newUser.role
        }
      }
    });
  } catch (error) {
    console.error('Register error details:', error);
    
    // IP adresini al
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    
    // Kayıt hatası logla
    try {
      await SecurityService.createLog({
        type: 'user_update',
        admin: req.body?.email || 'Bilinmeyen',
        ip,
        status: 'error',
        action: `Kayıt başarısız`
      });
    } catch (logError) {
      console.error('Register security log error:', logError);
    }
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Özel hata mesajlarını kontrol et
      if (error.message.includes('e-posta adresi zaten kullanılıyor') || 
          error.message.includes('already been registered')) {
        return res.status(400).json({
          status: 'error',
          message: 'Bu e-posta adresi zaten kullanılıyor.'
        });
      }
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Kayıt işlemi sırasında bir hata oluştu.'
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const credentials: LoginDTO = req.body;
    
    // IP adresini al (log için değil, authService.login için)
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    
    const authData = await authService.login(credentials, ip);
    
    if (!authData.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Giriş başarısız oldu.'
      });
    }
    
    // Auth kullanıcı verilerinden direkt dönüş yapalım
    res.status(200).json({
      status: 'success',
      data: {
        session: authData.session,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          first_name: authData.user.user_metadata?.first_name || '',
          last_name: authData.user.user_metadata?.last_name || '',
          role: authData.user.user_metadata?.role || 'USER'
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Email not confirmed hatası
    if (error instanceof Error && 'code' in error && error.code === 'email_not_confirmed') {
      return res.status(403).json({
        status: 'error',
        message: 'E-posta adresiniz henüz doğrulanmamış. Lütfen e-posta kutunuzu kontrol edin veya yeni bir doğrulama bağlantısı talep edin.',
        code: 'email_not_confirmed'
      });
    }
    
    res.status(401).json({
      status: 'error',
      message: 'Geçersiz e-posta veya şifre.'
    });
  }
};

export const googleAuthRedirect = async (req: Request, res: Response) => {
  try {
    const data = await authService.loginWithGoogle();
    res.redirect(data.url);
  } catch (error) {
    console.error('Google auth redirect error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Google ile giriş yapılırken bir hata oluştu.'
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // Doğrudan oturumu sonlandır
    await authService.logout();
    
    res.status(200).json({
      status: 'success',
      message: 'Başarıyla çıkış yapıldı.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Çıkış yapılırken bir hata oluştu.'
    });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userData = await authService.getCurrentUser();
    
    if (!userData.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Oturum açılmamış.'
      });
    }
    
    // Auth verileri üzerinden kullanıcı bilgilerini dön
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: userData.user.id,
          email: userData.user.email,
          first_name: userData.user.user_metadata?.first_name || '',
          last_name: userData.user.user_metadata?.last_name || '',
          role: userData.user.user_metadata?.role || 'USER'
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Oturum açılmamış veya süresi dolmuş.'
    });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'E-posta adresi gereklidir.'
      });
    }
    
    await authService.resetPassword(email);
    
    res.status(200).json({
      status: 'success',
      message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.'
    });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Şifre sıfırlama bağlantısı gönderilirken bir hata oluştu.'
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        status: 'error',
        message: 'Yeni şifre gereklidir.'
      });
    }
    
    await authService.updatePassword(password);
    
    res.status(200).json({
      status: 'success',
      message: 'Şifreniz başarıyla güncellendi.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Şifre güncellenirken bir hata oluştu.'
    });
  }
};

export const refreshSession = async (req: Request, res: Response) => {
  try {
    const data = await authService.refreshSession();
    
    res.status(200).json({
      status: 'success',
      data: {
        session: data.session
      }
    });
  } catch (error) {
    console.error('Refresh session error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Oturum yenilenirken bir hata oluştu.'
    });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'E-posta adresi gereklidir.'
      });
    }
    
    await authService.sendVerificationEmail(email);
    
    res.status(200).json({
      status: 'success',
      message: 'Doğrulama bağlantısı e-posta adresinize gönderildi.'
    });
  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Doğrulama bağlantısı gönderilirken bir hata oluştu.'
    });
  }
};

export const handleOAuthCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    
    if (!code) {
      return res.status(400).json({
        status: 'error',
        message: 'OAuth kodu eksik'
      });
    }

    const data = await authService.handleOAuthCallback(code);
    
    // Frontend'e yönlendir
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = new URL('/auth/callback', frontendUrl);
    
    // Token ve kullanıcı bilgilerini URL'e ekle
    redirectUrl.searchParams.append('access_token', data.session?.access_token || '');
    redirectUrl.searchParams.append('refresh_token', data.session?.refresh_token || '');
    
    if (data.user) {
      redirectUrl.searchParams.append('user_id', data.user.id);
      redirectUrl.searchParams.append('email', data.user.email || '');
      redirectUrl.searchParams.append('first_name', data.user.user_metadata?.given_name || '');
      redirectUrl.searchParams.append('last_name', data.user.user_metadata?.family_name || '');
    }
    
    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('OAuth callback hatası:', error);
    
    // Hata durumunda frontend'e yönlendir
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const errorUrl = new URL('/auth/error', frontendUrl);
    errorUrl.searchParams.append('error', 'Google ile giriş başarısız oldu');
    
    res.redirect(errorUrl.toString());
  }
};

export const resendConfirmationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    });
    
    if (error) throw error;
    
    return res.status(200).json({
      success: true,
      message: 'Doğrulama e-postası tekrar gönderildi'
    });
  } catch (error) {
    return res.status(500).json({
      success: false, 
      message: 'Doğrulama e-postası gönderilemedi'
    });
  }
};

export const confirmEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('Geçersiz doğrulama bağlantısı');
    }

    // Frontend URL'inizi buraya yazın
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Doğrulama token'ı ile frontend'e yönlendir
    // Frontend bu token'ı işleyecek
    res.redirect(`${frontendUrl}/auth/confirm?token=${token}`);
  } catch (error) {
    console.error('Email confirmation error:', error);
    res.status(500).send('Doğrulama işlemi sırasında bir hata oluştu');
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).send('Token bulunamadı');
    }

    try {
      // Token'dan kullanıcıyı bul
      const { data: userDecodeData, error: decodeError } = await supabase.auth.getUser(token as string);
      
      if (decodeError || !userDecodeData?.user) {
        console.error('Token geçersiz:', decodeError);
        return res.status(400).send('Geçersiz token');
      }
      
      const userId = userDecodeData.user.id;
      const userEmail = userDecodeData.user.email;
      
      console.log(`Kullanıcı doğrulanıyor: ${userId} (${userEmail})`);
      
      // E-posta durumunu doğrulanmış olarak güncelle
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { 
          email_confirm: true,
          user_metadata: {
            ...userDecodeData.user.user_metadata,
            email_verified: true
          }
        }
      );

      if (updateError) {
        console.error('Kullanıcı güncelleme hatası:', updateError);
        
        // Admin API ile kullanıcı güncellenemiyorsa, alternatif çözüm uygula
        // Kullanıcının son giriş zamanını güncelle (trigger kullanıcıyı oluşturacak)
        try {
          console.log('Alternatif yöntem deneniyor: Direct SQL update');
          const { data: directUpdateData, error: directUpdateError } = await supabaseAdmin.rpc(
            'manual_verify_user_email',
            { user_id: userId }
          );
          
          if (directUpdateError) {
            console.error('Doğrudan güncelleme hatası:', directUpdateError);
            return res.status(500).send('Doğrulama hatası: Kullanıcı güncellenemiyor');
          }
          
          console.log('Alternatif doğrulama başarılı');
        } catch (directUpdateErr) {
          console.error('Alternatif güncelleme hatası:', directUpdateErr);
          return res.status(500).send('Doğrulama hatası: Kullanıcı güncellenemiyor');
        }
      }

      // Başarılı sayfası
      res.send(`
        <html>
          <head>
            <title>E-posta Doğrulandı</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .container { max-width: 600px; margin: 0 auto; }
              .success { color: green; }
              .btn { 
                display: inline-block; 
                padding: 10px 20px; 
                background-color: #4CAF50; 
                color: white; 
                text-decoration: none; 
                border-radius: 4px; 
                margin-top: 20px; 
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="success">E-posta Adresiniz Doğrulandı!</h1>
              <p>E-posta adresiniz başarıyla doğrulandı. Artık giriş yapabilirsiniz.</p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" class="btn">Giriş Yap</a>
            </div>
          </body>
        </html>
      `);
    } catch (err) {
      console.error('Doğrulama işleminde hata:', err);
      return res.status(500).send('Doğrulama sırasında bir hata oluştu');
    }
  } catch (error) {
    console.error('Doğrulama hatası:', error);
    res.status(500).send('Doğrulama işlemi sırasında bir hata oluştu');
  }
}; 