import { io, Socket } from 'socket.io-client';
import { WebSocketEvents, SportEvent } from '../types/websocket';

describe('WebSocket Tests', () => {
    let clientSocket: Socket<WebSocketEvents>;
    const TEST_ROOM = 'test-room-123';

    beforeAll((done) => {
        clientSocket = io('http://localhost:3001', {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            timeout: 5000
        });

        clientSocket.on('connect', () => {
            console.log('Bağlantı kuruldu');
            done();
        });

        clientSocket.on('connect_error', (error) => {
            console.error('Bağlantı hatası:', error);
        });
    });

    afterAll((done) => {
        if (clientSocket.connected) {
            clientSocket.disconnect();
        }
        done();
    });

    test('Odaya katılma ve ayrılma', (done) => {
        expect(clientSocket.connected).toBeTruthy();
        
        clientSocket.emit('joinRoom', TEST_ROOM);
        
        clientSocket.once('userJoinedRoom', (data) => {
            expect(data.roomId).toBe(TEST_ROOM);
            expect(data.socketId).toBeDefined();
            
            clientSocket.emit('leaveRoom', TEST_ROOM);
            
            clientSocket.once('userLeftRoom', (data) => {
                expect(data.roomId).toBe(TEST_ROOM);
                expect(data.socketId).toBeDefined();
                done();
            });
        });
    }, 30000);

    test('Spor etkinliği güncelleme', (done) => {
        const testDate = new Date();
        const testEvent: SportEvent = {
            id: 'test-event-1',
            type: 'football' as const,
            status: 'live',
            homeTeam: 'Test Home',
            awayTeam: 'Test Away',
            startTime: testDate,
            location: 'Test Stadium'
        };

        clientSocket.emit('joinRoom', TEST_ROOM);
        
        clientSocket.once('sportEventUpdated', (event) => {
            expect(event).toEqual({
                ...testEvent,
                startTime: testDate.toISOString()
            });
            done();
        });

        setTimeout(() => {
            clientSocket.emit('sportEventUpdate', {
                roomId: TEST_ROOM,
                event: testEvent
            });
        }, 1000);
    }, 30000);

    test('Canlı skor güncelleme', (done) => {
        const testDate = new Date();
        const testScore = {
            eventId: 'test-event-1',
            homeScore: 2,
            awayScore: 1,
            period: '2nd Half',
            timestamp: testDate,
            details: {
                possession: '60-40',
                shots: '12-8'
            }
        };

        clientSocket.emit('joinRoom', TEST_ROOM);
        
        clientSocket.once('liveScoreUpdated', (score) => {
            expect(score).toEqual({
                ...testScore,
                timestamp: testDate.toISOString()
            });
            done();
        });

        setTimeout(() => {
            clientSocket.emit('liveScoreUpdate', {
                roomId: TEST_ROOM,
                score: testScore
            });
        }, 1000);
    }, 30000);

    test('Bağlantı kopma durumu', (done) => {
        clientSocket.once('disconnect', () => {
            expect(clientSocket.connected).toBeFalsy();
            done();
        });

        clientSocket.disconnect();
    }, 5000);
}); 