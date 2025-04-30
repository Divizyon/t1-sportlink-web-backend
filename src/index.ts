import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import sportsRoutes from './routes/sportsRoutes';
import securityRoutes from './routes/securityRoutes';
import reportRoutes from './routes/reportRoutes';
import profileRoutes from './routes/profileRoutes';
import statsRoutes from './routes/statsRoutes';
import statisticsRoutes from './routes/statisticsRoutes';
import newsRoutes from './routes/newsRoutes';
import newsScraperRoutes from './routes/newsScraperRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { errorHandler } from './middleware/errorHandler';
import logRequest from './middleware/loggerMiddleware';
import { setupSwagger } from './middleware/swaggerMiddleware';
import { scheduleCompletedEventsJob } from './jobs/completedEventsJob';
import newsExpiryChecker from './utils/newsExpiryChecker';
import { warmupConnectionPool } from './config/supabase';
import { dbConnectionCheck } from './middleware/databaseMiddleware';

// Load environment variables
dotenv.config({ override: true });

// Initialize express app
const app = express();
const port = 3000;

// CORS options
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "https:"]
    }
  }
})); // Configure helmet to allow swagger-ui images
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logRequest); // Add logRequest middleware

// Setup Swagger documentation
setupSwagger(app);

// Veritabanı bağlantı kontrolü middleware'ini ekle
app.use(dbConnectionCheck);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/news-scraper', newsScraperRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use(errorHandler);

// Server başlatılmadan önce veritabanı bağlantısını ısıt
const startServer = async () => {
  try {
    // Bağlantı havuzunu ısıt
    await warmupConnectionPool();
    
    // Sunucuyu başlat
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`API Documentation available at http://localhost:${port}/api-docs`);
      
      // Zamanlayıcı işlerini başlat
      scheduleCompletedEventsJob();
      console.log('Scheduled jobs started');
    });
    
    // Haber süresi kontrol servisini başlat
    newsExpiryChecker.start();
    
    return server;
  } catch (error) {
    console.error('Server başlatma hatası:', error);
    process.exit(1);
  }
};

// Server'ı başlat
startServer()
  .then(() => console.log('Server başarıyla başlatıldı'))
  .catch(err => console.error('Server başlatılamadı:', err));

export default app;