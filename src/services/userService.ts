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

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw error;
    return data as User[];
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}; 