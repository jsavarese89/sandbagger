import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRounds, getUserById } from '../../firebase';

function FriendRounds() {
  const { currentUser, userProfile } = useAuth();
  const [friendRounds, setFriendRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser || !userProfile) return;
    
    loadFriendRounds();
  }, [currentUser, userProfile]);

  const loadFriendRounds = async () => {
    if (!userProfile?.friends || userProfile.friends.length === 0) {
      setFriendRounds([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // For each friend, get their user data and recent rounds
      const friendsWithRounds = [];
      
      for (const friendId of userProfile.friends) {
        const friendData = await getUserById(friendId);
        
        // Use a promise to get rounds asynchronously
        const roundsPromise = new Promise((resolve) => {
          const unsubscribe = getUserRounds(friendId, (rounds) => {
            // Add friend info to each round
            const friendRounds = rounds.map(round => ({
              ...round,
              friendName: friendData.displayName,
              friendId
            }));
            
            unsubscribe(); // Unsubscribe after getting the data
            resolve(friendRounds);
          });
        });
        
        const friendRounds = await roundsPromise;
        friendsWithRounds.push(...friendRounds);
      }
      
      // Sort rounds by creation date, newest first
      friendsWithRounds.sort((a, b) => {
        // Handle serverTimestamp conversion
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });
      
      setFriendRounds(friendsWithRounds);
    } catch (error) {
      console.error('Error loading friend rounds:', error);
      setError('Failed to load friend rounds');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    // Convert Firebase timestamp to JavaScript Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleJoinRound = (roundId) => {
    // Navigate to the round page
    window.location.href = `/round/${roundId}`;
  };

  if (!currentUser) {
    return (
      <div className="text-center p-6">
        <p>Please log in to view friend rounds</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-green-700">Friend Rounds</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="spinner"></div>
        </div>
      ) : friendRounds.length === 0 ? (
        <p className="text-gray-500">No friend rounds found. Add some golf buddies to see their rounds!</p>
      ) : (
        <div className="space-y-4">
          {friendRounds.map((round, index) => (
            <div key={index} className="border p-4 rounded-lg hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{round.course?.name || 'Golf Round'}</h3>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">{round.friendName}</span> • {formatDate(round.createdAt)}
                  </p>
                </div>
                <button 
                  onClick={() => handleJoinRound(round.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
                >
                  Join Round
                </button>
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-2">
                {round.players && round.players.map((player, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-medium">{player.name}</span>
                    {player.handicap !== undefined && (
                      <span className="text-gray-500"> (HCP: {player.handicap})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FriendRounds;