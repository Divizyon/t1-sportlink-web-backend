import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { LoginDTO, CreateUserDTO } from '../models/User';

export const register = async (req: Request, res: Response) => {
  try {
    const userData: CreateUserDTO = req.body;
    
    // Check if user already exists
    const existingUser = await userService.findUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Bu e-posta adresi zaten kullanılıyor.'
      });
    }
    
    const newUser = await userService.createUser(userData);
    if (!newUser) {
      return res.status(500).json({
        status: 'error',
        message: 'Kullanıcı oluşturulurken bir hata oluştu.'
      });
    }
    
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
    console.error('Register error:', error);
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

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await authService.resetPassword(email);
    
    res.status(200).json({
      status: 'success',
      message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Şifre sıfırlama işlemi sırasında bir hata oluştu.'
    });
  }
}; 