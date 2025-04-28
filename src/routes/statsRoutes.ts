import { Router } from 'express';
import StatsController from '../controllers/StatsController';
// Import the correct authentication middleware
import { protect } from '../middleware/authMiddleware'; // Changed import to protect

const router = Router();

// GET /api/stats/weekly - Fetch weekly statistics
// Add authentication middleware
router.get(
    '/weekly',
    protect, // Use protect middleware
    StatsController.getWeeklyStats
);

// GET /api/stats/categories - Fetch category distribution
// Add authentication middleware
router.get(
    '/categories',
    protect, // Use protect middleware
    StatsController.getCategoryDistribution
);

// GET /api/stats/monthly - Fetch monthly statistics
// Activate the route and add protection
router.get(
    '/monthly',
    protect, // Added auth middleware
    StatsController.getMonthlyStats
);

// GET /api/stats/users/categories - Fetch user category growth
// Activate the route and add protection
router.get(
    '/users/categories',
    protect, // Added auth middleware
    StatsController.getUserCategoryGrowth
);


export default router; 