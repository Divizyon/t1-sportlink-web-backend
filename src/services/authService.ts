import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';

interface UserData {
  name: string;
  email: string;
  password: string;
  surname: string;
  phoneNumber: string;
}

interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
  token: string;
}

export class AuthService {
  static async register(userData: UserData): Promise<LoginResponse> {
    const { name, email, password, surname, phoneNumber } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('Bu email adresi zaten kullanımda');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      surname,
      phoneNumber
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    return {
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  static async login(email: string, password: string): Promise<LoginResponse> {
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Geçersiz email veya şifre');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Geçersiz email veya şifre');
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    return {
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  static async verifyToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
      const user = await User.findByPk(decoded.userId);
      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }
      return user;
    } catch (error) {
      throw new Error('Geçersiz token');
    }
  }
} 