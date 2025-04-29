import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';
// import { Database } from '../types/supabase';

const ANNOUNCEMENT_BUCKET = 'sportlink-files';
const ANNOUNCEMENT_FOLDER = 'announcements';

type AnnouncementInput = {
  title: string;
  content: string;
  creatorId?: string | null; // Optional - who created the announcement - accept null values too
  image?: Express.Multer.File; // Optional image file
  imageUrl?: string; // Optional image URL
};

// Manuel olarak tür tanımlayalım çünkü Supabase türleri henüz güncellenmedi
type Announcement = {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  creator_id: string | null;
  created_at: string;
  updated_at: string;
};

export const AnnouncementService = {
  async createAnnouncement(input: AnnouncementInput): Promise<Announcement> {
    const { title, content, creatorId, image, imageUrl: providedImageUrl } = input;
    let finalImageUrl: string | null = providedImageUrl || null;

    logger.info(`Announcement creation started: title=${title}, creatorId=${creatorId || 'none'}`);

    try {
      // 1. Upload image if provided
      if (image) {
        const fileExtension = image.originalname.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `${ANNOUNCEMENT_FOLDER}/${uniqueFileName}`;

        logger.info(`Uploading image: bucket=${ANNOUNCEMENT_BUCKET}, path=${filePath}`);

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from(ANNOUNCEMENT_BUCKET)
          .upload(filePath, image.buffer, {
            contentType: image.mimetype,
          });

        if (uploadError) {
          logger.error(`Supabase Storage upload error: ${uploadError.message}`, uploadError);
          throw new Error('Error uploading image.');
        }

        // Get public URL of uploaded file
        const { data: urlData } = supabaseAdmin.storage
          .from(ANNOUNCEMENT_BUCKET)
          .getPublicUrl(filePath);

        finalImageUrl = urlData?.publicUrl || null;
        logger.info(`Image successfully uploaded: url=${finalImageUrl}`);
      }

      // 2. Save to database
      const announcementData = {
        title,
        content,
        image_url: finalImageUrl,
        creator_id: creatorId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      logger.info('Adding announcement to database:', announcementData);

      const { data: newAnnouncement, error: insertError } = await supabaseAdmin
        .from('Announcements')
        .insert([announcementData])
        .select()
        .single();

      if (insertError) {
        logger.error(`Supabase database insertion error: ${insertError.message}`, insertError);
        console.error('Database insert error details:', {
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          message: insertError.message
        });
        throw new Error(`Error saving announcement to database: ${insertError.message}`);
      }

      if (!newAnnouncement) {
        logger.error('Announcement created but no data returned.');
        throw new Error('Announcement created but result not available.');
      }

      logger.info(`Announcement successfully created: id=${newAnnouncement.id}`);
      return newAnnouncement as Announcement;

    } catch (error) {
      logger.error(`Error in announcement service: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
      throw error;
    }
  },

  async getAnnouncements(): Promise<Announcement[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('Announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error(`Error fetching announcements: ${error.message}`, error);
        throw new Error('Error fetching announcements.');
      }

      return data as Announcement[];
    } catch (error) {
      logger.error(`Error in getAnnouncements: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
      throw error;
    }
  },

  async getAnnouncementById(id: number): Promise<Announcement | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('Announcements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error(`Error fetching announcement by id: ${error.message}`, error);
        throw new Error('Error fetching announcement.');
      }

      return data as Announcement;
    } catch (error) {
      logger.error(`Error in getAnnouncementById: ${error instanceof Error ? error.message : 'Unknown error'}`, error);
      throw error;
    }
  }
}; 