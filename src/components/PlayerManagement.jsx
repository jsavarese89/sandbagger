import React, { useState, useEffect } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { getUserFriends, findUserByEmail } from '../firebase';

import CourseSelector from './CourseSelector';

// Enhanced component with improved Golf Buddy selection
function PlayerManagement({ players, setPlayers, onCourseSelect }) {
  // Use separate state variables to avoid complex dependencies
  const [name, setName] = useState('');
  const [handicap, setHandicap] = useState(0);
  const [editIndex, setEditIndex] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formKey, setFormKey] = useState(0);

  // Friend selection related states
  const [showFriends, setShowFriends] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const { currentUser } = useAuth();

  // Fetch friends list when component mounts or when showing friends
  useEffect(() => {
    if (currentUser && showFriends) {
      const loadFriends = async () => {
        try {
          setLoading(true);
          const friendsData = await getUserFriends(currentUser.uid);
          setFriends(friendsData);
        } catch (error) {
          console.error('Error loading friends:', error);
        } finally {
          setLoading(false);
        }
      };

      loadFriends();
    }
  }, [currentUser, showFriends]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) return;

    if (editIndex !== null) {
      // Update existing player
      const updatedPlayers = [...players];
      updatedPlayers[editIndex] = { name, handicap: Number(handicap) };
      setPlayers(updatedPlayers);
      setEditIndex(null);
    } else {
      // Add new player
      setPlayers([...players, { name, handicap: Number(handicap) }]);
    }

    // Reset form
    setName('');
    setHandicap(0);
    setFormKey(formKey + 1);
  };

  // Simplified handlers without useCallback to avoid dependency issues
  const handleEdit = (index) => {
    setName(players[index].name);
    setHandicap(players[index].handicap);
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    setPlayers(players.filter((_, i) => i !== index));
    if (editIndex === index) {
      setEditIndex(null);
      setName('');
      setHandicap(0);
      setFormKey(formKey + 1);
    }
  };

  // Add a friend to the players list
  const handleAddFriend = (friend) => {
    // Check if friend is already in players list
    if (players.some(player => player.name === friend.displayName)) {
      alert(`${friend.displayName} is already in the players list`);
      return;
    }

    // Add friend to players list
    setPlayers([
      ...players,
      {
        name: friend.displayName,
        handicap: friend.handicap || 0,
        userId: friend.uid,  // Store the user ID for potential future use
      },
    ]);
  };

  // Search for a user by email
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchEmail.trim()) {
      setSearchError('Please enter an email address');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError('');

      const user = await findUserByEmail(searchEmail);

      if (!user) {
        setSearchError('No user found with that email');
        setSearchResults([]);
        return;
      }

      // Don't show the current user in results
      if (user.uid === currentUser.uid) {
        setSearchError('That\'s your own email address');
        setSearchResults([]);
        return;
      }

      setSearchResults([user]);
    } catch (error) {
      console.error('Error searching for user:', error);
      setSearchError('An error occurred while searching');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="player-management">
      <h3 className="info-card-header">Player Management</h3>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-bold">Players</h4>
          <button
            data-testid="toggle-golf-buddies-btn"
            type="button"
            onClick={() => setShowFriends(!showFriends)}
            style={{
              backgroundColor: '#15803d',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '14px',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {showFriends ? 'Hide Golf Buddies' : 'Add Golf Buddy'}
          </button>
        </div>

        {showFriends && (
          <div style={{
            marginBottom: '16px',
            padding: '16px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#f9fafb',
          }}
          >
            <h4 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '12px',
            }}
            >Find Golf Buddy
            </h4>

            {/* User search form */}
            <form
              onSubmit={handleSearch}
              style={{
                marginBottom: '16px',
                display: 'flex',
                gap: '8px',
              }}
            >
              <input
                data-testid="search-email-input"
                type="email"
                placeholder="Search by email"
                aria-describedby={searchError ? "search-error-message" : undefined}
                aria-invalid={!!searchError}
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
              <button
                data-testid="search-submit-btn"
                type="submit"
                disabled={searchLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  cursor: searchLoading ? 'wait' : 'pointer',
                }}
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Search results */}
            {searchError && (
              <div 
                className="alert alert-danger" 
                role="alert" 
                aria-live="polite"
                id="search-error-message"
              >
                <span className="sr-only">Error: </span>
                {searchError}
              </div>
            )}

            {searchResults.length > 0 && (
              <div style={{
                marginBottom: '16px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
              >
                <h5 style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  padding: '8px 12px',
                  backgroundColor: '#f3f4f6',
                  borderBottom: '1px solid #d1d5db',
                }}
                >Search Results
                </h5>

                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
                >
                  {searchResults.map((user, index) => (
                    <div
                      key={`search-${index}`}
                      style={{
                        padding: '12px',
                        borderBottom: index < searchResults.length - 1 ? '1px solid #e5e7eb' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <p style={{
                          fontWeight: 'bold',
                          marginBottom: '4px',
                        }}
                        >{user.displayName}
                        </p>
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                        }}
                        >{user.email}
                        </p>
                      </div>
                      <button
                        data-testid="add-search-result-btn"
                        type="button"
                        onClick={() => handleAddFriend(user)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#15803d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '14px',
                          cursor: 'pointer',
                        }}
                      >
                        Add to Round
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends list */}
            <h5 style={{
              fontSize: '16px',
              fontWeight: 'bold',
              marginBottom: '8px',
            }}
            >My Golf Buddies
            </h5>

            {loading ? (
              <p style={{
                padding: '12px',
                textAlign: 'center',
                color: '#6b7280',
              }}
              >Loading golf buddies...
              </p>
            ) : friends.length === 0 ? (
              <p style={{
                padding: '12px',
                color: '#6b7280',
              }}
              >You don't have any golf buddies yet. Search for users by email to add them.
              </p>
            ) : (
              <div style={{
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                overflow: 'hidden',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
              >
                {friends.map((friend, index) => (
                  <div
                    key={`friend-${index}`}
                    style={{
                      padding: '12px',
                      borderBottom: index < friends.length - 1 ? '1px solid #e5e7eb' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <p style={{
                        fontWeight: 'bold',
                        marginBottom: '4px',
                      }}
                      >{friend.displayName}
                      </p>
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                      }}
                      >{friend.email}
                      </p>
                    </div>
                    <button
                      data-testid="add-friend-btn"
                      type="button"
                      onClick={() => handleAddFriend(friend)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#15803d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      Add to Round
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <form key={formKey} onSubmit={handleSubmit} className="player-form">
          <div className="form-group">
            <label>Name</label>
            <input
              data-testid="player-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter player name"
              required
            />
          </div>

          <div className="form-group">
            <label>Handicap</label>
            <input
              data-testid="player-handicap-input"
              type="number"
              value={handicap}
              onChange={(e) => setHandicap(Number(e.target.value))}
              min="0"
              max="36"
              required
              pattern="[0-9]*"
              inputMode="numeric"
            />
          </div>

          <button
            data-testid="player-submit-btn"
            type="submit"
            className="btn"
          >
            {editIndex !== null ? 'Update Player' : 'Add Player'}
          </button>

          {editIndex !== null && (
            <button
              data-testid="player-cancel-btn"
              type="button"
              onClick={() => {
                setEditIndex(null);
                setName('');
                setHandicap(0);
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      {players.length > 0 && (
        <div>
          <h4 className="active-bets-header">Added Players</h4>
          <div className="player-list">
            {players.map((player, index) => (
              <div key={index} className="player-item">
                <div>
                  <span className="player-name">{player.name}</span>
                  <span className="player-handicap">HCP: {player.handicap}</span>
                </div>
                <div className="player-actions">
                  <button
                    data-testid="player-edit-btn"
                    onClick={() => handleEdit(index)}
                    className="btn-sm btn-edit"
                  >
                    Edit
                  </button>
                  <button
                    data-testid="player-delete-btn"
                    onClick={() => handleDelete(index)}
                    className="btn-sm btn-delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="info-card-header">Select Course</h3>
        <CourseSelector
          onCourseSelect={(course) => {
            setSelectedCourse(course);
            if (onCourseSelect) {
              onCourseSelect(course);
            }
          }}
        />

        {selectedCourse && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 className="font-bold mb-2">Selected Course</h4>
            <p>{selectedCourse.name}</p>
            <p className="text-sm text-gray-600">{selectedCourse.city}, {selectedCourse.state}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerManagement;
