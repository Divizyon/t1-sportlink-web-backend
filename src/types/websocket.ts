export interface SportEvent {
    id: string;
    type: 'football' | 'basketball' | 'volleyball' | 'tennis';
    status: 'upcoming' | 'live' | 'finished';
    homeTeam: string;
    awayTeam: string;
    startTime: Date | string;
    location: string;
    details?: Record<string, any>;
}

export interface LiveScore {
    eventId: string;
    homeScore: number;
    awayScore: number;
    period?: string;
    timestamp: Date | string;
    details?: Record<string, any>;
}

export interface RoomEvent {
    socketId: string;
    roomId: string;
    timestamp: Date | string;
}

export interface WebSocketEvents {
    // İstemci -> Sunucu olayları
    joinRoom: (roomId: string) => void;
    leaveRoom: (roomId: string) => void;
    sportEventUpdate: (data: { roomId: string; event: SportEvent }) => void;
    liveScoreUpdate: (data: { roomId: string; score: LiveScore }) => void;

    // Sunucu -> İstemci olayları
    sportEventUpdated: (event: SportEvent) => void;
    liveScoreUpdated: (score: LiveScore) => void;
    announcement: (data: { message: string }) => void;
    error: (data: { message: string }) => void;

    // Sistem olayları
    connection: () => void;
    disconnect: () => void;
    userJoinedRoom: (data: RoomEvent) => void;
    userLeftRoom: (data: RoomEvent) => void;
    userDisconnected: (socketId: string) => void;
} 