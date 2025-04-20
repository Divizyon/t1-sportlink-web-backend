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
    console.log('Starting user creation process for:', userData.email);
    
    // Önce email'in kullanımda olup olmadığını kontrol et
    const existingUser = await findUserByEmail(userData.email);
    if (existingUser) {
      console.log('Email already exists:', userData.email);
      throw new Error('Bu e-posta adresi zaten kullanılıyor.');
    }

    console.log('Creating auth user...');
    // Auth user oluştur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      if (authError.message.includes('already been registered')) {
        throw new Error('Bu e-posta adresi zaten kullanılıyor.');
      }
      throw authError;
    }
    
    if (!authData.user) {
      console.error('Auth data user is null');
      throw new Error('Kullanıcı oluşturulamadı.');
    }

    console.log('Creating user profile...');
    // Kullanıcı profilini oluştur
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        role: userData.role || 'USER'
      })
      .select()
      .single();

    if (error) {
      console.error('Profile creation error:', error);
      // Eğer profil oluşturma başarısız olursa auth user'ı da sil
      console.log('Deleting auth user due to profile creation failure...');
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw error;
    }

    console.log('User created successfully:', data);
    return data as User;
  } catch (error) {
    console.error('Error in createUser:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
    throw new Error('Kullanıcı oluşturulurken bir hata oluştu.');
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