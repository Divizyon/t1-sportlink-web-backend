import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { LoginDTO, CreateUserDTO } from '../models/User';

export const register = async (req: Request, res: Response) => {
  try {
    const userData: CreateUserDTO = req.body;
    console.log('Register attempt with data:', userData);
    
    // Kullanıcı oluştur
    const newUser = await userService.createUser(userData);
    if (!newUser) {
      console.error('User creation failed: newUser is null');
      return res.status(500).json({
        status: 'error',
        message: 'Kullanıcı oluşturulurken bir hata oluştu.'
      });
    }
    
    console.log('User created successfully:', newUser);
    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role
        }
      }
    });
  } catch (error) {
    console.error('Register error details:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Özel hata mesajlarını kontrol et
      if (error.message.includes('e-posta adresi zaten kullanılıyor')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
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
    const authData = await authService.login(credentials);
    
    // Get user profile data
    const user = await userService.findUserByEmail(credentials.email);
    
    res.status(200).json({
      status: 'success',
      data: {
        session: authData.session,
        user: {
          id: user?.id,
          email: user?.email,
          first_name: user?.first_name,
          last_name: user?.last_name,
          role: user?.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
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
    
    // Get user profile data
    const user = await userService.findUserById(userData.user.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user?.id,
          email: user?.email,
          first_name: user?.first_name,
          last_name: user?.last_name,
          role: user?.role
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