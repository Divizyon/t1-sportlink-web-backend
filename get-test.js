// GET isteği için test scripti
const axios = require('axios');

async function getSecurityLogs() {
  try {
    const response = await axios.get('http://localhost:3000/api/security/logs');
    console.log('Yanıt:', response.data);
  } catch (error) {
    console.error('Hata:', error.toString());
    console.error('Stack:', error.stack);
    if (error.response) {
      console.error('Yanıt detayları:', error.response.data);
      console.error('Yanıt status:', error.response.status);
    }
  }
}

getSecurityLogs(); 