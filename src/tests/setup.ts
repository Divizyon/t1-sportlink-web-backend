import axios from 'axios';
import { Server } from 'http';
import app from '../index';
import * as dotenv from 'dotenv';

// Jest'i import et
import { jest, beforeAll, afterAll } from '@jest/globals';

dotenv.config();

// Global TS tanımları
declare global {
  namespace NodeJS {
    interface Global {
      TEST_SERVER_URL: string;
    }
  }
  
  var TEST_SERVER_URL: string;
}

// Jest timeout'unu artıralım
jest.setTimeout(30000);

// Test URL'i tanımlıyoruz
global.TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3001';

// Sunucu ve veritabanı işlemleri
let server: Server;

beforeAll(async () => {
  server = app.listen(process.env.PORT || 3001);
  
  // Veritabanı bağlantısını test için kapatıyoruz
  // try {
  //   await mongoose.disconnect();
  // } catch (error) {
  //   console.log('MongoDB bağlantısı zaten kapalı veya bağlantı yoktu.');
  // }
});

afterAll(async () => {
  server.close();
});

// Axios'u ayarla
axios.defaults.baseURL = global.TEST_SERVER_URL; 