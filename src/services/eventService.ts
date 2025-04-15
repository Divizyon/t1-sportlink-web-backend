import supabase from '../config/supabase';

export const getAllEvents = async () => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Get all events error:', error);
    throw error;
  }
};

export const getEventById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Get event by ID error:', error);
    throw error;
  }
}; 