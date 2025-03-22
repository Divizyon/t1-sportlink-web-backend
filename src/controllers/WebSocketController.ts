import WebSocketService from '../services/WebSocketService';

class WebSocketController {
    private wsService: WebSocketService;

    constructor() {
        this.wsService = WebSocketService.getInstance();
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Kullanıcı odaya katıldığında
        this.wsService.on('userJoinedRoom', ({ socketId, roomId }) => {
            console.log(`Kullanıcı ${socketId} odaya katıldı: ${roomId}`);
            // Burada gerekli iş mantığı işlemleri yapılabilir
            // Örneğin: Veritabanına kayıt, diğer kullanıcılara bildirim vb.
        });

        // Kullanıcı odadan ayrıldığında
        this.wsService.on('userLeftRoom', ({ socketId, roomId }) => {
            console.log(`Kullanıcı ${socketId} odadan ayrıldı: ${roomId}`);
            // Burada gerekli iş mantığı işlemleri yapılabilir
        });

        // Kullanıcı bağlantısı koptuğunda
        this.wsService.on('userDisconnected', (socketId) => {
            console.log(`Kullanıcı bağlantısı koptu: ${socketId}`);
            // Burada gerekli temizlik işlemleri yapılabilir
        });
    }

    // Spor etkinliği güncellemesi gönderme
    public sendSportEventUpdate(roomId: string, eventData: any): void {
        this.wsService.sendToRoom(roomId, 'sportEventUpdated', eventData);
    }

    // Canlı skor güncellemesi gönderme
    public sendLiveScoreUpdate(roomId: string, scoreData: any): void {
        this.wsService.sendToRoom(roomId, 'liveScoreUpdated', scoreData);
    }

    // Tüm bağlı kullanıcılara duyuru gönderme
    public sendAnnouncement(message: string): void {
        this.wsService.broadcast('announcement', { message });
    }
}

export default new WebSocketController(); 