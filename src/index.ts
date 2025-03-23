import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { rateLimit } from './middleware/rateLimit';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to auth routes
const authLimiter = rateLimit(20, 15 * 60 * 1000); // 20 requests per 15 minutes

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SportLink API',
      version: '1.0.0',
      description: 'SportLink API Documentation',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to SportLink API',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;