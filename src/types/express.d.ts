import { User } from '../models/User';
import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
      file?: Express.Multer.File;
    }
  }
} 