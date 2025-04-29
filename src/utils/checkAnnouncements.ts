import { supabaseAdmin } from '../config/supabase';

async function checkAnnouncementsTable() {
  console.log('Checking Announcements table structure...');
  
  // Tablo yapısını kontrol et
  try {
    // Tablonun varlığını kontrol et
    const { data, error } = await supabaseAdmin
      .from('Announcements')
      .select('*')
      .limit(0);
      
    if (error) {
      console.error('Error querying Announcements table:', error);
    } else {
      console.log('Announcements table exists and is queryable');
      
      // Deneme amaçlı veri eklemeyi dene
      const testData = {
        title: 'Test Announcement',
        content: 'This is a test to debug the insertion issue',
        image_url: null,
        creator_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Trying to insert test data:', testData);
      
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('Announcements')
        .insert([testData]);
        
      if (insertError) {
        console.error('Error inserting test data:', {
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          message: insertError.message
        });
      } else {
        console.log('Test data successfully inserted:', insertData);
      }
    }
  } catch (e) {
    console.error('Exception when checking table:', e);
  }
}

// Script doğrudan çalıştırıldığında
if (require.main === module) {
  checkAnnouncementsTable()
    .then(() => {
      console.log('Check complete');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}

export default checkAnnouncementsTable; 