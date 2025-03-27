import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { EventEmitter } from 'events';
import { WebSocketEvents, SportEvent, LiveScore } from '../types/websocket';
import winston from 'winston';

// Logger yapılandırması
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

type WebSocketEventTypes = keyof WebSocketEvents;
type EmitEvents = {
    [K in keyof WebSocketEvents]: (data: Parameters<WebSocketEvents[K]>[0]) => void;
};

class WebSocketService extends EventEmitter {
    private io: SocketServer<WebSocketEvents, EmitEvents>;
    private static instance: WebSocketService;
    private rooms: Map<string, Set<string>> = new Map();
    private socketConnections: Map<string, Socket<WebSocketEvents, EmitEvents>> = new Map();

    private constructor(server: HttpServer) {
        super();
        this.io = new SocketServer<WebSocketEvents, EmitEvents>(server, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling'],
            pingTimeout: 60000,
            pingInterval: 25000,
            connectTimeout: 45000
        });

        this.setupEventHandlers();
        this.setupErrorHandling();
    }

    public static getInstance(server?: HttpServer): WebSocketService {
        if (!WebSocketService.instance && server) {
            WebSocketService.instance = new WebSocketService(server);
        }
        return WebSocketService.instance;
    }

    private setupErrorHandling(): void {
        this.io.on('error', (error) => {
            logger.error('Socket.IO Server Error:', error);
        });

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception:', error);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });
    }

    private setupEventHandlers(): void {
        this.io.on('connection', (socket: Socket<WebSocketEvents, EmitEvents>) => {
            logger.info(`Yeni bağlantı: ${socket.id}`);
            this.socketConnections.set(socket.id, socket);

            // Kullanıcı odaya katılma
            socket.on('joinRoom', (roomId: string) => {
                try {
                    this.handleJoinRoom(socket, roomId);
                } catch (error) {
                    logger.error(`Odaya katılma hatası (${socket.id}):`, error);
                    this.handleError(socket, 'Odaya katılırken bir hata oluştu');
                }
            });

            // Kullanıcı odadan ayrılma
            socket.on('leaveRoom', (roomId: string) => {
                try {
                    this.handleLeaveRoom(socket, roomId);
                } catch (error) {
                    logger.error(`Odadan ayrılma hatası (${socket.id}):`, error);
                    this.handleError(socket, 'Odadan ayrılırken bir hata oluştu');
                }
            });

            // Spor etkinliği güncelleme
            socket.on('sportEventUpdate', async (data: { roomId: string; event: SportEvent }) => {
                try {
                    await this.handleSportEventUpdate(socket, data);
                } catch (error) {
                    logger.error(`Spor etkinliği güncelleme hatası (${socket.id}):`, error);
                    this.handleError(socket, 'Spor etkinliği güncellenirken bir hata oluştu');
                }
            });

            // Canlı skor güncelleme
            socket.on('liveScoreUpdate', async (data: { roomId: string; score: LiveScore }) => {
                try {
                    await this.handleLiveScoreUpdate(socket, data);
                } catch (error) {
                    logger.error(`Canlı skor güncelleme hatası (${socket.id}):`, error);
                    this.handleError(socket, 'Canlı skor güncellenirken bir hata oluştu');
                }
            });

            // Bağlantı koptuğunda
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });

            // Hata durumunda
            socket.on('error', (error) => {
                logger.error(`Socket hatası (${socket.id}):`, error);
                this.handleError(socket, 'Bir hata oluştu');
            });
        });
    }

    private handleJoinRoom(socket: Socket<WebSocketEvents, EmitEvents>, roomId: string): void {
        socket.join(roomId);
        
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        this.rooms.get(roomId)?.add(socket.id);

        const eventData = {
            socketId: socket.id,
            roomId,
            timestamp: new Date().toISOString()
        };

        this.io.to(roomId).emit('userJoinedRoom', eventData);
        logger.info(`Kullanıcı odaya katıldı: ${socket.id} -> ${roomId}`);
    }

    private handleLeaveRoom(socket: Socket<WebSocketEvents, EmitEvents>, roomId: string): void {
        socket.leave(roomId);
        this.rooms.get(roomId)?.delete(socket.id);

        const eventData = {
            socketId: socket.id,
            roomId,
            timestamp: new Date().toISOString()
        };

        this.io.to(roomId).emit('userLeftRoom', eventData);
        logger.info(`Kullanıcı odadan ayrıldı: ${socket.id} -> ${roomId}`);
    }

    private async handleSportEventUpdate(
        socket: Socket<WebSocketEvents, EmitEvents>,
        data: { roomId: string; event: SportEvent }
    ): Promise<void> {
        const { roomId, event } = data;
        
        // Date nesnesini ISO string'e çevir
        const eventWithStringDate = {
            ...event,
            startTime: event.startTime instanceof Date 
                ? event.startTime.toISOString() 
                : event.startTime
        };

        this.io.to(roomId).emit('sportEventUpdated', eventWithStringDate);
        logger.info(`Spor etkinliği güncellendi: ${event.id} -> ${roomId}`);
    }

    private async handleLiveScoreUpdate(
        socket: Socket<WebSocketEvents, EmitEvents>,
        data: { roomId: string; score: LiveScore }
    ): Promise<void> {
        const { roomId, score } = data;
        
        // Date nesnesini ISO string'e çevir
        const scoreWithStringDate = {
            ...score,
            timestamp: score.timestamp instanceof Date 
                ? score.timestamp.toISOString() 
                : score.timestamp
        };

        this.io.to(roomId).emit('liveScoreUpdated', scoreWithStringDate);
        logger.info(`Canlı skor güncellendi: ${score.eventId} -> ${roomId}`);
    }

    private handleDisconnect(socket: Socket<WebSocketEvents, EmitEvents>): void {
        // Tüm odalardan çıkar
        this.rooms.forEach((members, roomId) => {
            if (members.has(socket.id)) {
                this.handleLeaveRoom(socket, roomId);
            }
        });

        this.socketConnections.delete(socket.id);
        logger.info(`Bağlantı koptu: ${socket.id}`);
    }

    private handleError(socket: Socket<WebSocketEvents, EmitEvents>, message: string): void {
        socket.emit('error', { message });
    }

    // Belirli bir odaya mesaj gönderme
    public sendToRoom<T extends WebSocketEventTypes>(
        roomId: string,
        event: T,
        data: Parameters<WebSocketEvents[T]>[0]
    ): void {
        try {
            (this.io.to(roomId) as any).emit(event, data);
            logger.info(`Oda mesajı gönderildi: ${roomId} -> ${event}`);
        } catch (error) {
            logger.error(`Oda mesajı gönderme hatası (${roomId}):`, error);
        }
    }

    // Tüm bağlantılara mesaj gönderme
    public broadcast<T extends WebSocketEventTypes>(
        event: T,
        data: Parameters<WebSocketEvents[T]>[0]
    ): void {
        try {
            (this.io as any).emit(event, data);
            logger.info(`Broadcast mesajı gönderildi: ${event}`);
        } catch (error) {
            logger.error('Broadcast mesajı gönderme hatası:', error);
        }
    }

    // Belirli bir sokete mesaj gönderme
    public sendToSocket<T extends WebSocketEventTypes>(
        socketId: string,
        event: T,
        data: Parameters<WebSocketEvents[T]>[0]
    ): void {
        try {
            (this.io.to(socketId) as any).emit(event, data);
            logger.info(`Soket mesajı gönderildi: ${socketId} -> ${event}`);
        } catch (error) {
            logger.error(`Soket mesajı gönderme hatası (${socketId}):`, error);
        }
    }

    // Oda üyelerini getir
    public getRoomMembers(roomId: string): string[] {
        return Array.from(this.rooms.get(roomId) || []);
    }

    // Aktif bağlantı sayısını getir
    public getActiveConnections(): number {
        return this.socketConnections.size;
    }
}

export default WebSocketService; 