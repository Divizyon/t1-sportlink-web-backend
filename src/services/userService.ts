import { User } from '../models/User';
import bcrypt from 'bcryptjs';

interface UserData {
  name: string;
  email: string;
  password: string;
  surname: string;
  phoneNumber: string;
}

export class UserService {
  async getAllUsers(): Promise<User[]> {
    return await User.findAll();
  }

  async getUserById(id: number): Promise<User | null> {
    return await User.findByPk(id);
  }

  async createUser(userData: UserData): Promise<User> {
    const { name, email, password, surname, phoneNumber } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    return await User.create({
      name,
      email,
      password: hashedPassword,
      surname,
      phoneNumber
    });
  }

  async updateUser(id: number, userData: Partial<UserData>): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) {
      return null;
    }

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    await user.update(userData);
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = await User.findByPk(id);
    if (!user) {
      return false;
    }
    await user.destroy();
    return true;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }
} 