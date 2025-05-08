import { supabaseAdmin } from '../config/supabase';
import { PostgrestError } from '@supabase/supabase-js';
import supabase from '../config/supabase';

// Announcement interface
export interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

class AnnouncementService {
  // Get all announcements
  async getAllAnnouncements(): Promise<Announcement[]> {
    try {
      const { data, error } = await supabase
        .from('Announcements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Error getting announcements: ${error.message}`);
      }
      
      return data || [];
    } catch (err) {
      console.error('Exception in getAllAnnouncements:', err);
      throw err;
    }
  }

  // Get announcement by ID
  async getAnnouncementById(id: string): Promise<Announcement | null> {
    try {
      const { data, error } = await supabase
        .from('Announcements')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') { // Record not found
          return null;
        }
        throw new Error(`Error getting announcement: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('Exception in getAnnouncementById:', err);
      throw err;
    }
  }

  // Get latest announcements with a limit
  async getLatestAnnouncements(limit: number = 5): Promise<Announcement[]> {
    try {
      const { data, error } = await supabase
        .from('Announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        throw new Error(`Error getting announcements: ${error.message}`);
      }
      
      return data || [];
    } catch (err) {
      console.error('Exception in getLatestAnnouncements:', err);
      throw err;
    }
  }
}

export default new AnnouncementService(); 