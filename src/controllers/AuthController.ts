import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Bir hata oluştu'
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Bir hata oluştu'
      });
    }
  }

  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Token bulunamadı'
        });
        return;
      }

      const user = await AuthService.verifyToken(token);
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Bir hata oluştu'
      });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      // TODO: Implement password reset logic
      
      res.status(200).json({
        success: true,
        message: 'Şifre sıfırlama bağlantısı email adresinize gönderildi'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Bir hata oluştu'
      });
    }
  }
} 