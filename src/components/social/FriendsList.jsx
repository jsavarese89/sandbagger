import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getUserFriends, 
  getPendingFriendRequests, 
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest
} from '../../firebase';

function FriendsList() {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    loadFriendsAndRequests();
  }, [currentUser]);

  const loadFriendsAndRequests = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    
    try {
      const friendsData = await getUserFriends(currentUser.uid);
      setFriends(friendsData);
      
      const requestsData = await getPendingFriendRequests(currentUser.uid);
      setPendingRequests(requestsData);
    } catch (error) {
      console.error('Error loading friends and requests:', error);
      setMessage({ text: error.message || 'Failed to load friends', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage({ text: 'Please enter an email address', type: 'error' });
      return;
    }
    
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      await sendFriendRequest(currentUser.uid, email);
      setEmail('');
      setMessage({ text: 'Friend request sent successfully!', type: 'success' });
    } catch (error) {
      console.error('Error sending friend request:', error);
      setMessage({ text: error.message || 'Failed to send friend request', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (senderId) => {
    setLoading(true);
    
    try {
      await acceptFriendRequest(currentUser.uid, senderId);
      setMessage({ text: 'Friend request accepted!', type: 'success' });
      loadFriendsAndRequests();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      setMessage({ text: error.message || 'Failed to accept friend request', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRequest = async (senderId) => {
    setLoading(true);
    
    try {
      await declineFriendRequest(currentUser.uid, senderId);
      setMessage({ text: 'Friend request declined', type: 'success' });
      loadFriendsAndRequests();
    } catch (error) {
      console.error('Error declining friend request:', error);
      setMessage({ text: error.message || 'Failed to decline friend request', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center p-6">
        <p>Please log in to view friends</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-green-700">Golf Buddies</h2>
      
      {message.text && (
        <div className={`${message.type === 'error' ? 'bg-red-100 text-red-700 border-red-400' : 'bg-green-100 text-green-700 border-green-400'} border px-4 py-3 rounded mb-4`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSendRequest} className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Add Golf Buddy</h3>
        <div className="flex space-x-2">
          <input 
            type="email" 
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 p-2 border rounded"
            required
          />
          <button 
            type="submit" 
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </form>
      
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Pending Requests</h3>
          <div className="space-y-2">
            {pendingRequests.map((request, index) => (
              <div key={index} className="border p-3 rounded flex justify-between items-center">
                <div>
                  <p className="font-medium">{request.senderName}</p>
                  <p className="text-sm text-gray-500">{request.senderEmail}</p>
                </div>
                <div className="space-x-2">
                  <button 
                    onClick={() => handleAcceptRequest(request.senderId)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition"
                    disabled={loading}
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleDeclineRequest(request.senderId)}
                    className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-300 transition"
                    disabled={loading}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div>
        <h3 className="text-lg font-semibold mb-2">My Golf Buddies</h3>
        {friends.length === 0 ? (
          <p className="text-gray-500">You haven't added any golf buddies yet.</p>
        ) : (
          <div className="space-y-2">
            {friends.map((friend, index) => (
              <div key={index} className="border p-3 rounded">
                <p className="font-medium">{friend.displayName}</p>
                <p className="text-sm text-gray-500">{friend.email}</p>
                {friend.handicap !== undefined && (
                  <p className="text-sm">Handicap: {friend.handicap}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendsList;