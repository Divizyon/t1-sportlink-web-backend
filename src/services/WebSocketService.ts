import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { EventEmitter } from 'events';
import { WebSocketEvents, SportEvent, LiveScore } from '../types/websocket';

type WebSocketEventTypes = keyof WebSocketEvents;
type EmitEvents = {
    [K in keyof WebSocketEvents]: (data: Parameters<WebSocketEvents[K]>[0]) => void;
};

class WebSocketService extends EventEmitter {
    private io: SocketServer<WebSocketEvents, EmitEvents>;
    private static instance: WebSocketService;

    private constructor(server: HttpServer) {
        super();
        this.io = new SocketServer<WebSocketEvents, EmitEvents>(server, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:3000',
                methods: ['GET', 'POST']
            }
        });

        this.setupEventHandlers();
    }

    public static getInstance(server?: HttpServer): WebSocketService {
        if (!WebSocketService.instance && server) {
            WebSocketService.instance = new WebSocketService(server);
        }
        return WebSocketService.instance;
    }

    private setupEventHandlers(): void {
        this.io.on('connection', (socket: Socket<WebSocketEvents, EmitEvents>) => {
            console.log(`Yeni bağlantı: ${socket.id}`);

            // Kullanıcı odaya katılma
            socket.on('joinRoom', (roomId: string) => {
                socket.join(roomId);
                this.emit('userJoinedRoom', { socketId: socket.id, roomId });
            });

            // Kullanıcı odadan ayrılma
            socket.on('leaveRoom', (roomId: string) => {
                socket.leave(roomId);
                this.emit('userLeftRoom', { socketId: socket.id, roomId });
            });

            // Spor etkinliği güncelleme
            socket.on('sportEventUpdate', (data: { roomId: string; event: SportEvent }) => {
                const { roomId, event } = data;
                this.io.to(roomId).emit('sportEventUpdated', event);
            });

            // Canlı skor güncelleme
            socket.on('liveScoreUpdate', (data: { roomId: string; score: LiveScore }) => {
                const { roomId, score } = data;
                this.io.to(roomId).emit('liveScoreUpdated', score);
            });

            // Bağlantı koptuğunda
            socket.on('disconnect', () => {
                console.log(`Bağlantı koptu: ${socket.id}`);
                this.emit('userDisconnected', socket.id);
            });
        });
    }

    // Belirli bir odaya mesaj gönderme
    public sendToRoom<T extends WebSocketEventTypes>(
        roomId: string,
        event: T,
        data: Parameters<WebSocketEvents[T]>[0]
    ): void {
        (this.io.to(roomId) as any).emit(event, data);
    }

    // Tüm bağlantılara mesaj gönderme
    public broadcast<T extends WebSocketEventTypes>(
        event: T,
        data: Parameters<WebSocketEvents[T]>[0]
    ): void {
        (this.io as any).emit(event, data);
    }

    // Belirli bir sokete mesaj gönderme
    public sendToSocket<T extends WebSocketEventTypes>(
        socketId: string,
        event: T,
        data: Parameters<WebSocketEvents[T]>[0]
    ): void {
        (this.io.to(socketId) as any).emit(event, data);
    }
}

export default WebSocketService; 