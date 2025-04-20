// POST isteği için test scripti
const axios = require('axios');

async function createSecurityLog() {
  try {
    const response = await axios.post('http://localhost:3000/api/security/logs', {
      type: 'login',
      admin: 'admin_test',
      ip: '127.0.0.1',
      status: 'success',
      action: 'Test: Sisteme giriş yaptı'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Yanıt:', response.data);
  } catch (error) {
    console.error('Hata:', error.message);
    if (error.response) {
      console.error('Yanıt detayları:', error.response.data);
    }
  }
}

createSecurityLog(); 