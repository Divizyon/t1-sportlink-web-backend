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
import announcementRoutes from './routes/announcementRoutes';
import { errorHandler } from './middleware/errorHandler';
import logRequest from './middleware/loggerMiddleware';
import { setupSwagger } from './middleware/swaggerMiddleware';
import { scheduleCompletedEventsJob } from './jobs/completedEventsJob';
import newsExpiryChecker from './utils/newsExpiryChecker';

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
app.use('/api/announcements', announcementRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  console.log(`API Documentation available at http://localhost:${port}/api-docs`);
  
  // Start scheduled jobs
  scheduleCompletedEventsJob();
  console.log('Scheduled jobs started');
  
  // Haber süresi kontrol servisini başlat
  newsExpiryChecker.start();
});

export default app;