import { Request, Response, NextFunction } from 'express';
import StatsService from '../services/StatsService';

class StatsController {
    /**
     * @description Get weekly participation statistics
     * @route GET /api/stats/weekly
     * @access Private (adjust based on authentication)
     */
    static async getWeeklyStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const weeklyData = await StatsService.fetchWeeklyStats();
            res.status(200).json(weeklyData);
        } catch (error) {
            next(error); // Pass error to the error handling middleware
        }
    }

    // Placeholder for getCategoryDistribution
    /**
     * @description Get participant distribution by sport category
     * @route GET /api/stats/categories
     * @access Private (adjust based on authentication)
     */
    static async getCategoryDistribution(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const categoryData = await StatsService.fetchCategoryDistribution();
            res.status(200).json(categoryData);
        } catch (error) {
            next(error);
        }
    }

    // Placeholder for getMonthlyStats
    /**
     * @description Get monthly event statistics by status
     * @route GET /api/stats/monthly
     * @access Private
     */
    static async getMonthlyStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const monthlyData = await StatsService.fetchMonthlyStats();
            res.status(200).json(monthlyData);
        } catch (error) {
            next(error);
        }
    }

    // Placeholder for getUserCategoryGrowth
    // Activate and implement getUserCategoryGrowth
    /**
     * @description Get user growth by sport category over the last 30 days
     * @route GET /api/stats/users/categories
     * @access Private
     */
    static async getUserCategoryGrowth(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userGrowthData = await StatsService.fetchUserCategoryGrowth();
            res.status(200).json(userGrowthData);
        } catch (error) {
            next(error);
        }
    }
}

export default StatsController; 