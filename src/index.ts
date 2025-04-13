import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import storageRoutes from './routes/storageRoutes';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middleware/errorHandler';
import logRequest from './middleware/loggerMiddleware';
import { setupSwagger } from './middleware/swaggerMiddleware';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
// CORS ayarları
const corsOptions = {
  origin: '*', // Tüm originlere izin ver
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Helmet ayarları
const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false
};

// Middleware sırası önemli
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet(helmetOptions)); // Configure helmet to allow swagger-ui images
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(helmet(helmetOptions));

// Setup Swagger documentation
setupSwagger(app);

// Routes
app.use('/api/storage', storageRoutes);

// Root endpoint
app.get('/', (req: express.Request, res: express.Response) => {
  try {
    res.status(200).json({
      name: 'Sportlink Storage Backend',
      description: 'Supabase Storage entegrasyonu için backend yapısı',
      version: '1.0.0',
      status: 'active',
      endpoints: {
        health: '/health',
        storage: '/api/storage/*'
      }
    });
  } catch (error) {
    console.error('Root endpoint hatası:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Sunucu hatası oluştu'
    });
  }
});

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'UP', message: 'Servis çalışıyor' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Hata yakalandı:', err.stack);
  res.status(500).json({
    success: false,
    message: err.message || 'Sunucu hatası',
  });
});

// 404 handler - en sonda olmalı
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı',
    path: req.path
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portunda çalışıyor 🚀!`);
  console.log(`Ana sayfa: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Storage API: http://localhost:${PORT}/api/storage/test`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

// Ctrl+C ile düzgün kapanma için işleyici
process.on('SIGINT', () => {
  console.log('\nCtrl+C algılandı! Server kapatılıyor...');
  server.close(() => {
    console.log('Server başarıyla kapatıldı.');
    process.exit(0);
  });
});

// Beklenmeyen hatalarda düzgün kapanma
process.on('uncaughtException', (error) => {
  console.error('Beklenmeyen hata:', error);
  server.close(() => {
    console.log('Server beklenmeyen hata nedeniyle kapatıldı.');
    process.exit(1);
  });
});
