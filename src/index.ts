import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import sportsRoutes from './routes/sportsRoutes';
import profileRoutes from './routes/profileRoutes';
import statsRoutes from './routes/statsRoutes';
import statisticsRoutes from './routes/statisticsRoutes';
import userNewsRoutes from './routes/userNewsRoutes';
import announcementRoutes from './routes/announcementRoutes';
import eventRatingRoutes from './routes/eventRatingRoutes';
import userReportRoutes from './routes/userReportRoutes';
import warningRoutes from './routes/warningRoutes';
import { errorHandler } from './middleware/errorHandler';
import logRequest from './middleware/loggerMiddleware';
import { setupSwagger } from './middleware/swaggerMiddleware';
import { scheduleCompletedEventsJob, scheduleAutoRejectEventsJob } from './jobs/completedEventsJob';
import newsExpiryChecker from './utils/newsExpiryChecker';
import { warmupConnectionPool } from './config/supabase';
import { setupStorageBuckets } from './config/bucketSetup';
import { dbConnectionCheck } from './middleware/databaseMiddleware';
import http from 'http';
import { initializeSocket } from './config/socket';
import logger from './utils/logger';
import { supabaseAdmin } from './config/supabase';

// Load environment variables
dotenv.config({ override: true });

// Initialize express app
const app = express();
const server = http.createServer(app);
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
      "img-src": ["'self'", "data:", "https:"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      "style-src": ["'self'", "'unsafe-inline'"]
    }
  }
})); // Configure helmet to allow inline scripts and styles
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logRequest); // Add logRequest middleware

// Statik dosyalar için public klasörünü kullan
app.use(express.static(path.join(__dirname, '../public')));

// Setup Swagger documentation
setupSwagger(app);

// Veritabanı bağlantı kontrolü middleware'ini ekle
app.use(dbConnectionCheck);

// Socket.IO başlat
initializeSocket(server);

// Özel yönlendirmeler - /auth/* route'larını /api/auth/* 'a yönlendir
app.use('/auth/:path', (req, res) => {
  const path = req.params.path;
  const queryString = Object.keys(req.query).length > 0 
    ? '?' + new URLSearchParams(req.query as any).toString() 
    : '';
  
  console.log(`/auth/${path} yönlendirmesi: /api/auth/${path}${queryString}`);
  res.redirect(`/api/auth/${path}${queryString}`);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sports', sportsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/user-news', userNewsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/event-ratings', eventRatingRoutes);
app.use('/api/user-reports', userReportRoutes);
app.use('/api/warnings', warningRoutes);

// Mobil API Routes
import mobileFriendshipRoutes from './routes/friendshipRoutes';
import mobileMessageRoutes from './routes/messageRoutes';

app.use('/api/mobile/friendships', mobileFriendshipRoutes);
app.use('/api/mobile/messages', mobileMessageRoutes);

// Error handling middleware
app.use(errorHandler);

// Server başlatılmadan önce veritabanı bağlantısını ısıt
const startServer = async () => {
  try {
    // Bağlantı havuzunu ısıt
    await warmupConnectionPool();
    
    // Storage bucket'ları yapılandır
    await setupStorageBuckets();
    
    // Sunucuyu başlat (app.listen yerine server.listen kullanıyoruz)
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`API Documentation available at http://localhost:${port}/api-docs`);
      
      // Zamanlayıcı işlerini başlat
      scheduleCompletedEventsJob();
      scheduleAutoRejectEventsJob();
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