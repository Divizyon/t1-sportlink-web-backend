import dotenv from 'dotenv';
import { jest } from '@jest/globals';

declare global {
    var TEST_SERVER_URL: string;
}

// Test ortamı için .env dosyasını yükle
dotenv.config({ path: '.env.test' });

// Test timeout süresini artır
jest.setTimeout(30000);

// Global test değişkenleri
global.TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:3001'; 