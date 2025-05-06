import { Request, Response } from 'express';
import * as friendshipService from '../services/friendshipService';

export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const { receiver_id } = req.body;
    
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.'
      });
    }
    
    const requester_id = req.userId;

    if (!receiver_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Arkadaşlık isteği göndermek için alıcı ID gereklidir.'
      });
    }

    try {
      const friendRequest = await friendshipService.sendFriendRequest(requester_id, receiver_id);

      res.status(201).json({
        status: 'success',
        data: friendRequest
      });
    } catch (serviceError) {
      // Özel hata durumlarını yönet
      const errorMessage = serviceError instanceof Error ? serviceError.message : 'Bilinmeyen hata';
      
      if (errorMessage.includes('zaten bir arkadaşlık isteği gönderdiniz') || 
          errorMessage.includes('zaten arkadaşsınız') ||
          errorMessage.includes('size zaten bir arkadaşlık isteği göndermiş')) {
        return res.status(409).json({
          status: 'error',
          message: errorMessage
        });
      }
      
      if (errorMessage.includes('Kendinize arkadaşlık isteği gönderemezsiniz')) {
        return res.status(400).json({
          status: 'error',
          message: errorMessage
        });
      }

      // Diğer durumlarda 500 dön
      res.status(500).json({
        status: 'error',
        message: errorMessage
      });
    }
  } catch (error) {
    console.error('Arkadaşlık isteği gönderme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Arkadaşlık isteği gönderilirken bir hata oluştu.'
    });
  }
};

export const getIncomingFriendRequests = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.'
      });
    }
    
    const userId = req.userId;
    const requests = await friendshipService.getIncomingFriendRequests(userId);

    res.status(200).json({
      status: 'success',
      data: requests
    });
  } catch (error) {
    console.error('Gelen arkadaşlık isteklerini listelerken hata:', error);
    res.status(500).json({
      status: 'error',
      message: 'Arkadaşlık istekleri alınırken bir hata oluştu.'
    });
  }
};

export const getOutgoingFriendRequests = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.'
      });
    }
    
    const userId = req.userId;
    const requests = await friendshipService.getOutgoingFriendRequests(userId);

    res.status(200).json({
      status: 'success',
      data: requests
    });
  } catch (error) {
    console.error('Giden arkadaşlık isteklerini listelerken hata:', error);
    res.status(500).json({
      status: 'error',
      message: 'Arkadaşlık istekleri alınırken bir hata oluştu.'
    });
  }
};

export const respondToFriendRequest = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.'
      });
    }
    
    const userId = req.userId;

    if (!requestId || !status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Geçerli bir istek ID ve durum (accepted/rejected) gereklidir.'
      });
    }

    const result = await friendshipService.respondToFriendRequest(
      parseInt(requestId), 
      status as 'accepted' | 'rejected', 
      userId
    );

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Arkadaşlık isteği yanıtlama hatası:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Arkadaşlık isteği yanıtlanırken bir hata oluştu.'
    });
  }
};

export const getFriends = async (req: Request, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.'
      });
    }
    
    const userId = req.userId;
    const friends = await friendshipService.getFriends(userId);

    res.status(200).json({
      status: 'success',
      data: friends
    });
  } catch (error) {
    console.error('Arkadaşları listeleme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Arkadaşlar alınırken bir hata oluştu.'
    });
  }
};

export const removeFriendship = async (req: Request, res: Response) => {
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

    const result = await friendshipService.removeFriendship(userId, friendId);

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error('Arkadaşlık silme hatası:', error);
    res.status(400).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Arkadaşlık silinirken bir hata oluştu.'
    });
  }
};

export const updateOnlineStatus = async (req: Request, res: Response) => {
  try {
    const { is_online } = req.body;
    
    if (!req.userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.'
      });
    }
    
    const userId = req.userId;

    if (is_online === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Çevrimiçi durumu (is_online) gereklidir.'
      });
    }

    await friendshipService.updateOnlineStatus(userId, is_online);

    res.status(200).json({
      status: 'success',
      data: { is_online }
    });
  } catch (error) {
    console.error('Çevrimiçi durum güncelleme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Çevrimiçi durum güncellenirken bir hata oluştu.'
    });
  }
};
