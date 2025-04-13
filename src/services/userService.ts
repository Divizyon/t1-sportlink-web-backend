import supabase, { supabaseAdmin } from '../config/supabase';
import { User, CreateUserDTO } from '../models/User';

export const findUserById = async (id: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as User;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return null;
  }
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) throw error;
    return data as User;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
};

export const createUser = async (userData: CreateUserDTO): Promise<User | null> => {
  try {
    // First, create the auth user with admin privileges to ensure it works
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true
    });

    if (authError) throw authError;
    
    if (!authData.user) {
      throw new Error('Auth user creation failed');
    }

    // Then create the user profile in our users table
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
        role: userData.role || 'user',
      })
      .select()
      .single();

    if (error) throw error;
    return data as User;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
};

interface GetAllUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

interface GetAllUsersResult {
  users: User[];
  total: number;
}

export const getAllUsers = async (params?: GetAllUsersParams): Promise<GetAllUsersResult> => {
  try {
    const { page = 1, limit = 10, search, role } = params || {};
    const offset = (page - 1) * limit;
    
    // Start with the basic query
    let query = supabase.from('users').select('*', { count: 'exact' });
    
    // Add search condition if provided
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }
    
    // Add role filter if provided
    if (role) {
      query = query.eq('role', role);
    }
    
    // Add pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return {
      users: data as User[],
      total: count || 0
    };
  } catch (error) {
    console.error('Error getting all users:', error);
    return {
      users: [],
      total: 0
    };
  }
}; 