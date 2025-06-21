import React, { useState, useEffect } from 'react';

import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfile } from '../../firebase';

function UserProfile() {
  const { currentUser, userProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [handicap, setHandicap] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setHandicap(userProfile.handicap || 0);
    }
  }, [userProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setMessage({ text: 'Display name cannot be empty', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await updateUserProfile(currentUser.uid, {
        displayName,
        handicap: Number(handicap),
      });

      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ text: error.message || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || !userProfile) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-green-700">My Profile</h2>

      {message.text && (
        <div className={`${message.type === 'error' ? 'bg-red-100 text-red-700 border-red-400' : 'bg-green-100 text-green-700 border-green-400'} border px-4 py-3 rounded mb-4`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={currentUser.email}
            className="w-full p-2 border rounded bg-gray-100"
            disabled
          />
          <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 mb-1">Handicap</label>
          <input
            type="number"
            value={handicap}
            onChange={(e) => setHandicap(e.target.value)}
            className="w-full p-2 border rounded"
            min="0"
            max="36"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}

export default UserProfile;
