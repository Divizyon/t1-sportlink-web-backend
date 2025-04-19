import supabase from '../config/supabase';
import { Event, EventWithSport, CreateEventDTO, UpdateEventDTO } from '../models/Event';

/**
 * Tüm etkinlikleri getir, isteğe bağlı olarak spor kategorisine göre filtrele
 */
export const getEvents = async (sportId?: string): Promise<EventWithSport[]> => {
  try {
    let query = supabase
      .from('events')
      .select(`
        *,
        sports:sport_id (
          id,
          name,
          type
        ),
        users:creator_id (
          id, 
          first_name,
          last_name
        )
      `);

    // Eğer sportId varsa, o kategoriye göre filtrele
    if (sportId) {
      query = query.eq('sport_id', sportId);
    }

    const { data, error } = await query.order('event_date', { ascending: true });

    if (error) throw error;

    // API yanıtı için verileri düzenle
    const formattedEvents = data.map(event => {
      return {
        ...event,
        sport: event.sports,
        creator: event.users,
        sports: undefined,
        users: undefined,
      };
    });

    return formattedEvents as EventWithSport[];
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
};

/**
 * ID'ye göre bir etkinlik getir
 */
export const getEventById = async (id: string): Promise<EventWithSport | null> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        sports:sport_id (
          id,
          name,
          type
        ),
        users:creator_id (
          id, 
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) return null;

    const formattedEvent = {
      ...data,
      sport: data.sports,
      creator: data.users,
      sports: undefined,
      users: undefined,
    };

    return formattedEvent as EventWithSport;
  } catch (error) {
    console.error(`Error getting event with ID ${id}:`, error);
    return null;
  }
};

/**
 * Yeni bir etkinlik oluştur
 */
export const createEvent = async (eventData: CreateEventDTO): Promise<Event | null> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (error) throw error;
    return data as Event;
  } catch (error) {
    console.error('Error creating event:', error);
    return null;
  }
};

/**
 * Mevcut bir etkinliği güncelle
 */
export const updateEvent = async (id: string, eventData: UpdateEventDTO): Promise<Event | null> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Event;
  } catch (error) {
    console.error(`Error updating event with ID ${id}:`, error);
    return null;
  }
};

/**
 * Bir etkinliği sil
 */
export const deleteEvent = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting event with ID ${id}:`, error);
    return false;
  }
}; 