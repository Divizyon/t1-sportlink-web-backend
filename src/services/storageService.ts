import supabase from '../config/supabase';

// Bucket var mı kontrol et
const ensureBucketExists = async (bucket: string) => {
  try {
    // Bucket'ın var olup olmadığını kontrol et
    const { data: buckets, error: getBucketsError } = await supabase.storage.listBuckets();
    
    if (getBucketsError) {
      throw new Error(`Bucket listesi alınamadı: ${getBucketsError.message}`);
    }
    
    console.log('Mevcut bucketlar:', buckets.map(b => b.name));
    
    const bucketExists = buckets.some(b => b.name === bucket);
    
    // Bucket yoksa uyarı ver
    if (!bucketExists) {
      console.warn(`Bucket "${bucket}" bulunamadı! Mevcut bucketlar: ${buckets.map(b => b.name).join(', ')}`);
      throw new Error(`Bucket "${bucket}" bulunamadı. Mevcut bucketlar: ${buckets.map(b => b.name).join(', ')}`);
    }
    
    return buckets.find(b => b.name === bucket);
  } catch (error: any) {
    throw new Error(`Bucket işlem hatası: ${error.message}`);
  }
};

// Bucket listesi
const listBuckets = async () => {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw new Error(`Bucket listesi alınamadı: ${error.message}`);
    }
    
    return data || [];
  } catch (error: any) {
    throw new Error(`Bucket listeleme hatası: ${error.message}`);
  }
};

// Dosya yükleme
const uploadFile = async (bucket: string, filePath: string, file: Buffer) => {
  try {
    // Önce bucket'ın varlığını kontrol et
    await ensureBucketExists(bucket);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      throw new Error(`Dosya yükleme hatası: ${error.message}`);
    }

    return data;
  } catch (error: any) {
    console.error('Upload error:', error);
    throw error;
  }
};

// Dosyanın genel URL'ini alma
const getFileUrl = async (bucket: string, filePath: string) => {
  // Bucket'ın varlığını kontrol et
  await ensureBucketExists(bucket);
  
  const { data } = await supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
};

// Dosya listeleme
const listFiles = async (bucket: string, folderPath?: string) => {
  // Bucket'ın varlığını kontrol et
  await ensureBucketExists(bucket);
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folderPath || '');

  if (error) {
    throw new Error(`Dosya listeleme hatası: ${error.message}`);
  }

  return data;
};

// Dosya silme
const deleteFile = async (bucket: string, filePath: string) => {
  // Bucket'ın varlığını kontrol et
  await ensureBucketExists(bucket);
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(`Dosya silme hatası: ${error.message}`);
  }

  return data;
};

// Test fonksiyonu
const testStorageConnection = async () => {
  try {
    // Mevcut bucketları listele
    const buckets = await listBuckets();
    console.log('Supabase bağlantısı başarılı, bucketlar:', buckets);
    
    return { 
      success: true, 
      message: 'Supabase storage bağlantısı başarılı', 
      buckets: buckets,
      note: buckets.length === 0 ? 'Henüz hiç bucket yok. Supabase dashboard üzerinden bucket oluşturmalısınız.' : ''
    };
  } catch (error: any) {
    console.error('Test error:', error);
    return { success: false, message: error.message };
  }
};

export default {
  uploadFile,
  getFileUrl,
  listFiles,
  deleteFile,
  testStorageConnection,
  ensureBucketExists,
  listBuckets
}; 