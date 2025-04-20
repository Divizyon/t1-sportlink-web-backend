import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import sportsRoutes from './routes/sportsRoutes';
import { errorHandler } from './middleware/errorHandler';
import logRequest from './middleware/loggerMiddleware';
import setupSwagger from './config/swagger';
import { scheduleCompletedEventsJob } from './jobs/completedEventsJob';

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

// API double prefix sorununu çözmek için yönlendirme middleware'i
app.use((req, res, next) => {
  // Hatalı çift API prefix'i içeren istekleri yönlendir
  if (req.url.startsWith('/api/api/')) {
    const correctPath = req.url.replace('/api/api/', '/api/');
    console.log(`Hatalı API isteği düzeltiliyor: ${req.url} -> ${correctPath}`);
    return res.redirect(307, correctPath);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sports', sportsRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API Documentation available at http://localhost:${port}/api-docs`);
  
  // Start scheduled jobs
  scheduleCompletedEventsJob();
  console.log('Scheduled jobs started');
});

export default app;