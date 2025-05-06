import { Request, Response } from 'express';
import * as messageService from '../services/messageService';

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { friendId } = req.params;
    const { content, content_type } = req.body;
    
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.'
      });
    }
    
    const senderId = req.userId;

    if (!friendId || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Geçerli bir alıcı ID ve mesaj içeriği gereklidir.'
      });
    }

    const message = await messageService.sendMessage(
      senderId, 
      friendId, 
      content, 
      content_type || 'text'
    );

    res.status(201).json({
      status: 'success',
      data: message
    });
  } catch (error) {
    console.error('Mesaj gönderme hatası:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Mesaj gönderilirken bir hata oluştu.'
    });
  }
};

export const getConversation = async (req: Request, res: Response) => {
  try {
    const { friendId } = req.params;
    const { limit = '50', offset = '0' } = req.query;
    
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.'
      });
    }
    
    const userId = req.userId;

    if (!friendId) {
      return res.status(400).json({
        status: 'error',
        message: 'Geçerli bir arkadaş ID gereklidir.'
      });
    }

    const conversation = await messageService.getConversation(
      userId, 
      friendId, 
      parseInt(limit as string), 
      parseInt(offset as string)
    );

    res.status(200).json({
      status: 'success',
      data: conversation
    });
  } catch (error) {
    console.error('Mesajları listeleme hatası:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Mesajlar alınırken bir hata oluştu.'
    });
  }
};

export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const { friendId } = req.params;
    
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.'
      });
    }
    
    const userId = req.userId;

    if (!friendId) {
      return res.status(400).json({
        status: 'error',
        message: 'Geçerli bir arkadaş ID gereklidir.'
      });
    }

    // Bu işlem, friendId parametresindeki arkadaşın gönderdiği,
    // aktif kullanıcının (userId) aldığı ve henüz okunmamış mesajları
    // okundu olarak işaretler
    const result = await messageService.markMessagesAsRead(userId, friendId);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Mesajları okundu işaretleme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Mesajlar okundu olarak işaretlenirken bir hata oluştu.'
    });
  }
};

export const getUnreadMessageCount = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.'
      });
    }
    
    const userId = req.userId;
    const unreadCounts = await messageService.getUnreadMessageCount(userId);

    res.status(200).json({
      status: 'success',
      data: unreadCounts
    });
  } catch (error) {
    console.error('Okunmamış mesaj sayısı alma hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Okunmamış mesaj sayıları alınırken bir hata oluştu.'
    });
  }
};

export const getChatList = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.'
      });
    }
    
    const userId = req.userId;
    const chatList = await messageService.getChatList(userId);

    res.status(200).json({
      status: 'success',
      data: chatList
    });
  } catch (error) {
    console.error('Sohbet listesi alma hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Sohbet listesi alınırken bir hata oluştu.'
    });
  }
};
