import React, { useState } from 'react';

import { useAuth } from '../contexts/AuthContext';

import AuthModal from './auth/AuthModal';
import UserProfile from './auth/UserProfile';
import Notifications from './Notifications';
import RoundHistory from './RoundHistory';
import FriendRounds from './social/FriendRounds';
import FriendsList from './social/FriendsList';
import StatsTracker from './StatsTracker';

function Dashboard({ activeTab = 'profile', onTabChange }) {
  const { currentUser, userProfile, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // If onTabChange not provided, create a local state
  const [localActiveTab, setLocalActiveTab] = useState(activeTab);

  // Use either the prop-based or local state depending on whether onTabChange is provided
  const currentTab = onTabChange ? activeTab : localActiveTab;
  const setCurrentTab = onTabChange || setLocalActiveTab;

  const handleLogout = async () => {
    try {
      // Use window.location to ensure a clean state
      window.location.href = '/logout.html';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="app-container">
      {currentUser ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6 mt-2">
          <div className="p-6">
            {currentTab === 'profile' && <UserProfile />}
            {currentTab === 'stats' && <StatsTracker />}
            {currentTab === 'history' && <RoundHistory />}
            {currentTab === 'friends' && <FriendsList />}
            {currentTab === 'rounds' && <FriendRounds />}
            {currentTab === 'notifications' && <Notifications />}
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold mb-4">Welcome to Sandbagger</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your dashboard</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border p-4 rounded-lg">
              <h3 className="font-bold text-green-700 mb-2">Track Scores</h3>
              <p className="text-sm text-gray-600">Save your golf scores and track your progress over time</p>
            </div>

            <div className="border p-4 rounded-lg">
              <h3 className="font-bold text-green-700 mb-2">Connect with Friends</h3>
              <p className="text-sm text-gray-600">Add golf buddies and see their rounds</p>
            </div>

            <div className="border p-4 rounded-lg">
              <h3 className="font-bold text-green-700 mb-2">Manage Bets</h3>
              <p className="text-sm text-gray-600">Track friendly wagers and golf games with your friends</p>
            </div>
          </div>

          <p className="text-green-700 mb-2">Please use the "Log Out" button in the navbar to log in with a different account</p>
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}

export default Dashboard;
