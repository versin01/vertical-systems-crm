import React, { useState, useEffect } from 'react';
import { User, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createUserProfile, getOrCreateUserProfile } from '../../utils/userProfile';
import { useUsers } from '../../hooks/useUsers';

const UserProfileSetup: React.FC = () => {
  const { user } = useAuth();
  const { users, fetchUsers } = useUsers();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserProfile();
    }
  }, [user]);

  const checkUserProfile = async () => {
    if (!user) return;
    
    try {
      const profile = await getOrCreateUserProfile(user);
      setHasProfile(!!profile);
      
      if (profile) {
        setMessage({ type: 'success', text: 'User profile found and ready!' });
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
    }
  };

  const handleCreateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const profile = await createUserProfile(user);
      
      if (profile) {
        setHasProfile(true);
        setMessage({ type: 'success', text: 'User profile created successfully!' });
        // Refresh users list
        await fetchUsers();
      } else {
        setMessage({ type: 'error', text: 'Failed to create user profile. It may already exist.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create user profile' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center space-x-3 mb-4">
        <User className="h-6 w-6 text-teal-400" />
        <h3 className="text-lg font-semibold text-white">User Profile Setup</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
          <div>
            <p className="text-white font-medium">Current User</p>
            <p className="text-gray-400 text-sm">{user.email}</p>
            <p className="text-gray-400 text-sm">
              Role: {user.user_metadata?.role || 'User'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasProfile ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-green-400 text-sm">Profile Ready</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <span className="text-yellow-400 text-sm">Profile Needed</span>
              </>
            )}
          </div>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-900/20 border border-green-500/30 text-green-400' 
              : 'bg-red-900/20 border border-red-500/30 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {!hasProfile && (
          <div className="space-y-3">
            <p className="text-gray-300 text-sm">
              A user profile is needed for webhook tracking and user management features.
              This will create an entry in the users table with your authentication data.
            </p>
            
            <button
              onClick={handleCreateProfile}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-600 hover:from-teal-500 hover:to-cyan-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{loading ? 'Creating...' : 'Create User Profile'}</span>
            </button>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <p>• User profiles are stored separately from authentication data</p>
          <p>• This enables webhook tracking and user management features</p>
          <p>• Your authentication remains unchanged and secure</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfileSetup;