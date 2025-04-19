export interface Event {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  sport_id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location_name: string;
  location_lat?: number;
  location_long?: number;
  max_participants: number;
  status: 'active' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface EventWithSport extends Event {
  sport?: {
    id: string;
    name: string;
    type: string;
  };
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface CreateEventDTO {
  title: string;
  description: string;
  creator_id: string;
  sport_id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  location_name: string;
  location_lat?: number;
  location_long?: number;
  max_participants: number;
  status?: 'active' | 'cancelled' | 'completed';
}

export interface UpdateEventDTO {
  title?: string;
  description?: string;
  sport_id?: string;
  event_date?: string;
  start_time?: string;
  end_time?: string;
  location_name?: string;
  location_lat?: number;
  location_long?: number;
  max_participants?: number;
  status?: 'active' | 'cancelled' | 'completed';
} 