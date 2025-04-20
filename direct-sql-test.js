require('dotenv').config();
const { Pool } = require('pg');

// Veritabanı bağlantısı
const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
});

async function testSecurityLogs() {
  const client = await pool.connect();
  
  try {
    console.log('Test başlatılıyor...');
    
    // Yeni log ekleme
    const insertQuery = `
      INSERT INTO security_logs (type, admin, ip, date, time, status, action)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().substring(0, 5);
    
    const insertResult = await client.query(insertQuery, [
      'login',
      'admin1',
      '127.0.0.1',
      date,
      time,
      'success',
      'API Test: Sisteme giriş yaptı'
    ]);
    
    console.log('Yeni log eklendi:', insertResult.rows[0]);
    
    // Tüm logları listeleme
    const selectQuery = `SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 10;`;
    const selectResult = await client.query(selectQuery);
    
    console.log('\nTüm loglar:');
    console.table(selectResult.rows);
    
  } catch (error) {
    console.error('Hata oluştu:', error);
  } finally {
    client.release();
    pool.end();
  }
}

testSecurityLogs(); 