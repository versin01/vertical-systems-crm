import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  job_title?: string;
  role: 'User' | 'Finance' | 'Admin';
  created_at: string;
  updated_at: string;
}

/**
 * Hook for managing users table data - SEPARATE from AuthContext
 */
export const useUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createUserProfile = async (profileData: Omit<UserProfile, 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setUsers(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating user profile:', error);
      return { data: null, error };
    }
  };

  const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, ...data } : user
      ));
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      return { data: null, error };
    }
  };

  return { 
    users, 
    loading, 
    error, 
    fetchUsers, 
    createUserProfile, 
    updateUserProfile 
  };
};

/**
 * Hook for single user profile (when needed)
 */
export const useUserProfile = (userId: string | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) throw error;
        setProfile(data);
      } catch (error: any) {
        console.error('Error fetching user profile:', error);
        setError(error.message);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return { profile, loading, error };
};