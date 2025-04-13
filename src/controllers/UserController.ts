import { Request, Response } from 'express';
import { UserService } from '../services/userService';

const userService = new UserService();

export class UserController {
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Bir hata oluştu'
      });
    }
  }

  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.getUserById(parseInt(req.params.id));
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Bir hata oluştu'
      });
    }
  }

  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Bir hata oluştu'
      });
    }
  }

  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await userService.updateUser(parseInt(req.params.id), req.body);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
        return;
      }
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Bir hata oluştu'
      });
    }
  }

  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const success = await userService.deleteUser(parseInt(req.params.id));
      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Kullanıcı bulunamadı'
        });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Bir hata oluştu'
      });
    }
  }
} 