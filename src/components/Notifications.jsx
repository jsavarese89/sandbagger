import {
  getFirestore,
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import {
  getPendingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
} from '../firebase';

const Notifications = () => {
  const { currentUser, userProfile } = useAuth();
  const [friendRequests, setFriendRequests] = useState([]);
  const [roundInvites, setRoundInvites] = useState([]);
  const [roundUpdates, setRoundUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);

    // Listen for friend requests
    const db = getFirestore();
    const userRef = doc(db, 'users', currentUser.uid);

    const unsubscribeUser = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setFriendRequests(userData.pendingFriendRequests || []);
      }
    });

    // Listen for round invites
    const invitesRef = collection(db, 'roundInvites');
    const invitesQuery = query(
      invitesRef,
      where('recipientId', '==', currentUser.uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribeInvites = onSnapshot(invitesQuery, (snapshot) => {
      const invites = [];
      snapshot.forEach((doc) => {
        invites.push({ id: doc.id, ...doc.data() });
      });
      setRoundInvites(invites);
    });

    // Listen for round updates (recent activity in rounds you're part of)
    const roundsRef = collection(db, 'rounds');
    const roundsQuery = query(
      roundsRef,
      where('players', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc'),
      limit(5),
    );

    const unsubscribeRounds = onSnapshot(roundsQuery, (snapshot) => {
      const updates = [];
      snapshot.forEach((doc) => {
        const roundData = doc.data();

        // Only include rounds that have been updated in the last 7 days
        const updatedAt = roundData.updatedAt?.toDate() || new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (updatedAt > sevenDaysAgo) {
          updates.push({ id: doc.id, ...roundData });
        }
      });
      setRoundUpdates(updates);
    });

    setLoading(false);

    return () => {
      unsubscribeUser();
      unsubscribeInvites();
      unsubscribeRounds();
    };
  }, [currentUser]);

  const handleAcceptFriendRequest = async (senderId) => {
    try {
      await acceptFriendRequest(currentUser.uid, senderId);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleDeclineFriendRequest = async (senderId) => {
    try {
      await declineFriendRequest(currentUser.uid, senderId);
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const handleAcceptRoundInvite = async (inviteId) => {
    try {
      const db = getFirestore();
      await db.collection('roundInvites').doc(inviteId).update({
        status: 'accepted',
        respondedAt: new Date(),
      });
    } catch (error) {
      console.error('Error accepting round invite:', error);
    }
  };

  const handleDeclineRoundInvite = async (inviteId) => {
    try {
      const db = getFirestore();
      await db.collection('roundInvites').doc(inviteId).update({
        status: 'declined',
        respondedAt: new Date(),
      });
    } catch (error) {
      console.error('Error declining round invite:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const getTotalNotifications = () => {
    return friendRequests.length + roundInvites.length;
  };

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'friends':
        return friendRequests;
      case 'invites':
        return roundInvites;
      case 'updates':
        return roundUpdates;
      case 'all':
      default:
        return [...friendRequests, ...roundInvites, ...roundUpdates];
    }
  };

  if (!currentUser) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-center py-4">Please sign in to view notifications</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Notifications</h2>
        <p className="text-center py-4">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Notifications</h2>
        {getTotalNotifications() > 0 && (
          <span className="px-2 py-1 bg-red-500 text-white text-sm rounded-full">
            {getTotalNotifications()}
          </span>
        )}
      </div>

      <div className="flex border-b mb-4">
        <button
          className={`pb-2 px-4 ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
        <button
          className={`pb-2 px-4 ${activeTab === 'friends' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
          onClick={() => setActiveTab('friends')}
        >
          Friend Requests
          {friendRequests.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {friendRequests.length}
            </span>
          )}
        </button>
        <button
          className={`pb-2 px-4 ${activeTab === 'invites' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
          onClick={() => setActiveTab('invites')}
        >
          Round Invites
          {roundInvites.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {roundInvites.length}
            </span>
          )}
        </button>
        <button
          className={`pb-2 px-4 ${activeTab === 'updates' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-600'}`}
          onClick={() => setActiveTab('updates')}
        >
          Updates
        </button>
      </div>

      {getFilteredNotifications().length === 0 ? (
        <p className="text-center py-6 text-gray-500">No notifications to display</p>
      ) : (
        <div className="space-y-3">
          {friendRequests.length > 0 && (activeTab === 'all' || activeTab === 'friends') && (
            <>
              {friendRequests.map((request, index) => (
                <div key={index} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{request.senderName} sent you a friend request</div>
                      <div className="text-sm text-gray-500">{request.senderEmail}</div>
                      <div className="text-xs text-gray-400 mt-1">{formatTimestamp(request.timestamp)}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        onClick={() => handleAcceptFriendRequest(request.senderId)}
                      >
                        Accept
                      </button>
                      <button
                        className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300"
                        onClick={() => handleDeclineFriendRequest(request.senderId)}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {roundInvites.length > 0 && (activeTab === 'all' || activeTab === 'invites') && (
            <>
              {roundInvites.map((invite) => (
                <div key={invite.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{invite.senderName} invited you to join a round</div>
                      <div className="text-sm">{invite.courseName || 'Unnamed course'}</div>
                      <div className="text-xs text-gray-400 mt-1">{formatTimestamp(invite.createdAt)}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        onClick={() => handleAcceptRoundInvite(invite.id)}
                      >
                        Join
                      </button>
                      <button
                        className="px-3 py-1 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300"
                        onClick={() => handleDeclineRoundInvite(invite.id)}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {roundUpdates.length > 0 && (activeTab === 'all' || activeTab === 'updates') && (
            <>
              {roundUpdates.map((round) => (
                <div key={round.id} className="p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium">
                      {round.lastUpdatedBy
                        ? `${round.lastUpdatedBy} updated a round`
                        : 'Round updated'}
                    </div>
                    <div className="text-sm">
                      {round.courseName || 'Unnamed course'} - {new Date(round.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatTimestamp(round.updatedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
