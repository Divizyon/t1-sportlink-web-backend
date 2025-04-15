import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import mediaRoutes from './routes/mediaRoutes';
import eventRoutes from './routes/eventRoutes';
import { errorHandler } from './middleware/errorHandler';
import logRequest from './middleware/loggerMiddleware';
import { setupSwagger } from './middleware/swaggerMiddleware';
import supabase from './config/supabase';

// Load environment variables
dotenv.config();

/**
 * Uygulama başlangıcında gerekli kontrolleri yapar
 */
async function initializeApp() {
  try {
    // Supabase bağlantısını kontrol et
    const { data, error } = await supabase.from('users').select('id').limit(1);
    
    if (error) {
      console.error('Supabase bağlantı hatası:', error);
    } else {
      console.log('Supabase bağlantısı başarılı');
    }
    
    // Medya tablosunun varlığını kontrol et
    const { data: mediaData, error: mediaError } = await supabase.from('event_media').select('id').limit(1);
    
    if (mediaError && mediaError.code === '42P01') {
      console.warn('event_media tablosu bulunamadı. Supabase SQL Editöründe tablo oluşturma betiğini çalıştırın.');
    } else if (!mediaError) {
      console.log('event_media tablosu mevcut');
    } else {
      console.error('Medya tablosu kontrolü hatası:', mediaError);
    }
  } catch (error) {
    console.error('Uygulama başlatma hatası:', error);
  }
}

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https:"]
    }
  }
})); // Configure helmet to allow swagger-ui images
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logRequest); // Add logRequest middleware

// Setup Swagger documentation
setupSwagger(app);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/events', eventRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  console.log(`API Documentation available at http://localhost:${port}/api-docs`);
  
  // Uygulama başlatma kontrollerini çalıştır
  await initializeApp();
});

export default app;