import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './auth/AuthModal';
import UserProfile from './auth/UserProfile';
import FriendsList from './social/FriendsList';
import FriendRounds from './social/FriendRounds';

function Dashboard() {
  const { currentUser, userProfile, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-700">Dashboard</h1>
        
        {currentUser ? (
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              Hello, {userProfile?.displayName || currentUser.email}
            </span>
            <button 
              onClick={handleLogout}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
            >
              Log Out
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowAuthModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Log In / Sign Up
          </button>
        )}
      </div>
      
      {currentUser ? (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="flex border-b">
              <button 
                className={`flex-1 py-3 px-4 font-medium ${activeTab === 'profile' ? 'bg-green-50 text-green-700 border-b-2 border-green-600' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('profile')}
              >
                My Profile
              </button>
              <button 
                className={`flex-1 py-3 px-4 font-medium ${activeTab === 'friends' ? 'bg-green-50 text-green-700 border-b-2 border-green-600' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('friends')}
              >
                Golf Buddies
              </button>
              <button 
                className={`flex-1 py-3 px-4 font-medium ${activeTab === 'rounds' ? 'bg-green-50 text-green-700 border-b-2 border-green-600' : 'text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('rounds')}
              >
                Friend Rounds
              </button>
            </div>
            
            <div className="p-6">
              {activeTab === 'profile' && <UserProfile />}
              {activeTab === 'friends' && <FriendsList />}
              {activeTab === 'rounds' && <FriendRounds />}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold mb-4">Welcome to Sandbagger</h2>
          <p className="text-gray-600 mb-6">Log in or sign up to access all features, including:</p>
          
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
          
          <button 
            onClick={() => setShowAuthModal(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            Get Started
          </button>
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