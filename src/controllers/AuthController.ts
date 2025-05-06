import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { LoginDTO, CreateUserDTO } from '../models/User';
import { SecurityService } from '../services/securityService';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, password_confirm, first_name, last_name } = req.body;
    
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
    
    // IP adresini al
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    
    // User rolünde yeni kullanıcı oluştur (role parametresi artık gönderilmiyor)
    const userData = { email, password, first_name, last_name };
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
      message: 'Kayıt işlemi başarılı.',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role // Role artık her zaman 'USER'
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
    
    // IP adresini al
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
    // Güvenlik logu için kullanıcı bilgilerini al
    const userId = req.user?.id || 'Bilinmeyen';
    const userEmail = req.user?.email || 'Bilinmeyen';
    const firstName = req.user?.user_metadata?.first_name || '';
    const lastName = req.user?.user_metadata?.last_name || '';
    const userFullName = firstName && lastName 
      ? `${firstName} ${lastName}` 
      : userEmail;
      
    // IP adresini al
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    
    await authService.logout();
    
    // Güvenlik log kaydı oluştur
    try {
      await SecurityService.createLog({
        type: 'logout',
        admin: userFullName,
        ip,
        status: 'success',
        action: `Başarılı çıkış / ${userEmail}`
      });
    } catch (logError) {
      console.error('Logout security log error:', logError);
    }
    
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