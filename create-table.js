require('dotenv').config();
const { Pool } = require('pg');

// Veritabanı bağlantı bilgileri
const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
});

async function createSecurityLogsTable() {
  const client = await pool.connect();
  
  try {
    console.log('Security_logs tablosu oluşturuluyor...');
    
    // Tablo oluşturma SQL sorgusu
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS security_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL,
        admin VARCHAR(100) NOT NULL,
        ip VARCHAR(50) NOT NULL,
        date VARCHAR(10) NOT NULL,
        time VARCHAR(5) NOT NULL,
        status VARCHAR(20) NOT NULL,
        action TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await client.query(createTableQuery);
    console.log('security_logs tablosu başarıyla oluşturuldu!');
    
    // Test verisi ekleme
    const insertDataQuery = `
      INSERT INTO security_logs (type, admin, ip, date, time, status, action)
      VALUES 
        ('login', 'admin1', '192.168.1.100', '2024-03-15', '10:30', 'success', 'Sisteme giriş yaptı'),
        ('failed_attempt', 'admin2', '192.168.1.101', '2024-03-15', '11:45', 'error', 'Başarısız giriş denemesi'),
        ('role_change', 'admin1', '192.168.1.102', '2024-03-15', '12:00', 'success', 'user123 kullanıcısının rolünü User''dan Admin''e değiştirdi');
    `;
    
    await client.query(insertDataQuery);
    console.log('Test verileri eklendi!');
    
    // Tablo verilerini kontrol etme
    const checkDataQuery = `SELECT * FROM security_logs;`;
    const result = await client.query(checkDataQuery);
    
    console.log('Tablo verileri:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('Hata oluştu:', error.message);
  } finally {
    client.release();
    pool.end();
  }
}

createSecurityLogsTable(); 