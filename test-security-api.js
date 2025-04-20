// Test amaçlı Node.js script
const axios = require('axios');

async function testSecurityLogAPI() {
  try {
    // Yeni bir güvenlik logu oluştur
    const createResponse = await axios.post('http://localhost:3000/api/security/logs', {
      type: 'login',
      admin: 'admin1',
      ip: '127.0.0.1',
      status: 'success',
      action: 'Sisteme giriş yaptı'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Create Response:', createResponse.data);

    // Logları listele
    const getResponse = await axios.get('http://localhost:3000/api/security/logs');
    console.log('Get Response:', getResponse.data);
  } catch (error) {
    console.error('API Test Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testSecurityLogAPI(); 