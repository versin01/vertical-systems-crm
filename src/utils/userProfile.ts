import { supabase } from '../lib/supabase';
import { UserRole } from './permissions';

export interface CreateUserProfileData {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  job_title?: string;
  role: UserRole;
}

/**
 * Create user profile in users table - called manually when needed
 * This is NOT called automatically to prevent loops
 */
export const createUserProfile = async (authUser: any): Promise<any> => {
  try {
    const profileData: CreateUserProfileData = {
      id: authUser.id,
      email: authUser.email,
      full_name: authUser.user_metadata?.full_name || '',
      phone: authUser.user_metadata?.phone || '',
      job_title: authUser.user_metadata?.job_title || '',
      role: authUser.user_metadata?.role || 'User'
    };

    const { data, error } = await supabase
      .from('users')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      // If user already exists, that's okay
      if (error.code === '23505') { // Unique constraint violation
        console.log('User profile already exists:', authUser.id);
        return null;
      }
      throw error;
    }

    console.log('User profile created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
};

/**
 * Get or create user profile - safe method that doesn't cause loops
 */
export const getOrCreateUserProfile = async (authUser: any): Promise<any> => {
  try {
    // First try to get existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (existingProfile) {
      return existingProfile;
    }

    // If not found and it's not a "not found" error, throw it
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // Create new profile
    return await createUserProfile(authUser);
  } catch (error) {
    console.error('Error in getOrCreateUserProfile:', error);
    return null;
  }
};

/**
 * Sync auth user metadata to users table - called manually when needed
 */
export const syncUserMetadata = async (authUser: any): Promise<any> => {
  try {
    const updates = {
      email: authUser.email,
      full_name: authUser.user_metadata?.full_name || '',
      phone: authUser.user_metadata?.phone || '',
      job_title: authUser.user_metadata?.job_title || '',
      role: authUser.user_metadata?.role || 'User'
    };

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', authUser.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error syncing user metadata:', error);
    return null;
  }
};