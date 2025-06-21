import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate that all required environment variables are present
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}. Please check your .env file.`);
}

// Initialize Firebase with error handling
let app, db, auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);

  // Production optimizations
  if (import.meta.env.PROD) {
    // Enable offline persistence in production
    // Note: This is now handled automatically by Firebase v9+
    console.log('Firebase initialized in production mode');
  } else {
    console.log('Firebase initialized in development mode');
    console.log('Project ID:', firebaseConfig.projectId);
  }
} catch (initError) {
  console.error('Failed to initialize Firebase:', initError);
  throw new Error(`Firebase initialization failed: ${initError.message}`);
}

// Configure Google provider
const googleProvider = new GoogleAuthProvider();
// Add scopes that we want to request
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Configure Apple provider
const appleProvider = new OAuthProvider('apple.com');

// Utility function for better error handling and logging
const handleFirebaseError = (error, operation) => {
  const errorCode = error.code || 'unknown';
  const errorMessage = error.message || 'Unknown error occurred';

  // Log error with context
  console.error(`Firebase ${operation} error [${errorCode}]:`, errorMessage);

  // Create user-friendly error messages
  let userMessage = errorMessage;

  switch (errorCode) {
    case 'auth/user-not-found':
      userMessage = 'No account found with this email address.';
      break;
    case 'auth/wrong-password':
      userMessage = 'Incorrect password. Please try again.';
      break;
    case 'auth/email-already-in-use':
      userMessage = 'An account with this email already exists.';
      break;
    case 'auth/weak-password':
      userMessage = 'Password should be at least 6 characters long.';
      break;
    case 'auth/invalid-email':
      userMessage = 'Please enter a valid email address.';
      break;
    case 'auth/network-request-failed':
      userMessage = 'Network error. Please check your connection and try again.';
      break;
    case 'permission-denied':
      userMessage = 'You do not have permission to perform this action.';
      break;
    case 'unavailable':
      userMessage = 'Service temporarily unavailable. Please try again later.';
      break;
    default:
      userMessage = `Error: ${errorMessage}`;
  }

  // Return enhanced error object
  const enhancedError = new Error(userMessage);
  enhancedError.code = errorCode;
  enhancedError.originalError = error;
  enhancedError.operation = operation;

  return enhancedError;
};

// Connection state monitoring
let isConnected = true;
const connectionListeners = [];

// Monitor connection state
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isConnected = true;
    connectionListeners.forEach(listener => listener(true));
  });

  window.addEventListener('offline', () => {
    isConnected = false;
    connectionListeners.forEach(listener => listener(false));
  });
}

// Export connection utilities
export const getConnectionState = () => isConnected;
export const onConnectionChange = (callback) => {
  connectionListeners.push(callback);
  return () => {
    const index = connectionListeners.indexOf(callback);
    if (index > -1) connectionListeners.splice(index, 1);
  };
};

// Anonymous authentication for users who don't want to sign up
export const signInAnonymous = async () => {
  try {
    if (!isConnected) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    throw handleFirebaseError(error, 'anonymous sign-in');
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email, password, displayName) => {
  try {
    if (!isConnected) {
      throw new Error('No internet connection. Please check your network and try again.');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update the user's profile with the display name
    await updateProfile(userCredential.user, { displayName });

    // Create a user document in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      displayName,
      email,
      createdAt: serverTimestamp(),
      handicap: 0,
      friends: [],
      pendingFriendRequests: [],
    });

    return userCredential.user;
  } catch (error) {
    throw handleFirebaseError(error, 'email sign-up');
  }
};

// Sign in with email and password
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in with email: ', error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    // First, ensure we don't have any persistence issues by clearing auth state
    try {
      console.log('Clearing any previous auth state...');
      await firebaseSignOut(auth);
    } catch (signOutError) {
      console.log('Sign out error (expected if not signed in):', signOutError);
      // Ignore any error, we just want to make sure we're starting fresh
    }

    // Configure Google provider with custom parameters
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });

    // Set auth state persistence to LOCAL
    try {
      console.log('Setting persistence to LOCAL...');
      await setPersistence(auth, browserLocalPersistence);
    } catch (error) {
      console.error('Persistence error:', error);
      // Continue even if persistence fails
    }

    console.log('Attempting Google sign-in...');
    // Using signInWithPopup for better compatibility
    // Use a try/catch to handle popup issues better
    let userCredential;
    try {
      userCredential = await signInWithPopup(auth, googleProvider);
    } catch (popupError) {
      console.error('Google popup error:', popupError);
      throw popupError;
    }
    console.log('Google sign-in successful:', userCredential.user.displayName);

    // Check if this is the first time signing in with Google
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

    if (!userDoc.exists()) {
      console.log('Creating new user document for:', userCredential.user.displayName);
      // Create a user document in Firestore for new Google users
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        displayName: userCredential.user.displayName,
        email: userCredential.user.email,
        createdAt: serverTimestamp(),
        handicap: 0,
        friends: [],
        pendingFriendRequests: [],
      });
    }

    // Force reload of auth state to ensure it's properly propagated
    console.log('Refreshing user auth token to ensure state consistency');
    if (userCredential.user) {
      try {
        await userCredential.user.getIdToken(true);  // force refresh the token
      } catch (tokenError) {
        console.error('Error refreshing token:', tokenError);
        // Continue even if this fails
      }
    }

    return userCredential.user;
  } catch (error) {
    console.error('Error signing in with Google: ', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
};

// Sign in with Apple
export const signInWithApple = async () => {
  try {
    // Configure OAuth provider
    appleProvider.addScope('email');
    appleProvider.addScope('name');

    // Set auth state persistence
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch (error) {
      console.error('Persistence error:', error);
      // Continue even if persistence fails
    }

    const userCredential = await signInWithPopup(auth, appleProvider);

    // Check if this is the first time signing in with Apple
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

    if (!userDoc.exists()) {
      // Create a user document in Firestore for new Apple users
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        displayName: userCredential.user.displayName || 'Apple User',
        email: userCredential.user.email,
        createdAt: serverTimestamp(),
        handicap: 0,
        friends: [],
        pendingFriendRequests: [],
      });
    }

    return userCredential.user;
  } catch (error) {
    console.error('Error signing in with Apple: ', error);
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    console.log('Signing out user');
    await firebaseSignOut(auth);
    console.log('User signed out successfully');

    // Force a page refresh to ensure clean state
    window.location.href = '/reset.html';
  } catch (error) {
    console.error('Error signing out: ', error);
    // Still try to refresh even if Firebase signOut fails
    setTimeout(() => {
      window.location.href = '/reset.html';
    }, 500);
    throw error;
  }
};

// Send password reset email
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email: ', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Subscribe to auth state changes
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Create a new round with initial data
export const createRound = async (roundData) => {
  try {
    const roundsRef = collection(db, 'rounds');
    const newRoundRef = doc(roundsRef);
    const roundId = newRoundRef.id;

    await setDoc(newRoundRef, {
      ...roundData,
      id: roundId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return roundId;
  } catch (error) {
    console.error('Error creating round: ', error);
    throw error;
  }
};

// Get a round by ID
export const getRound = async (roundId) => {
  try {
    const roundRef = doc(db, 'rounds', roundId);
    const roundSnap = await getDoc(roundRef);

    if (roundSnap.exists()) {
      return roundSnap.data();
    } else {
      throw new Error('Round not found');
    }
  } catch (error) {
    console.error('Error getting round: ', error);
    throw error;
  }
};

// Update a round's data
export const updateRound = async (roundId, updateData) => {
  try {
    if (!isConnected) {
      throw new Error('No internet connection. Round will be updated when connection is restored.');
    }

    if (!updateData || typeof updateData !== 'object') {
      throw new Error('Invalid update data provided');
    }

    const roundRef = doc(db, 'rounds', roundId);

    // Filter out undefined and null values
    const cleanUpdateData = Object.entries(updateData).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {});

    await updateDoc(roundRef, {
      ...cleanUpdateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw handleFirebaseError(error, 'round update');
  }
};

// Update a specific player's score for a hole with validation
export const updateScore = async (roundId, playerName, holeIndex, score) => {
  try {
    if (!isConnected) {
      throw new Error('No internet connection. Score will be saved when connection is restored.');
    }

    const roundRef = doc(db, 'rounds', roundId);
    const roundSnap = await getDoc(roundRef);

    if (!roundSnap.exists()) {
      throw handleFirebaseError(new Error('Round not found'), 'score update');
    }

    const round = roundSnap.data();
    const scores = { ...round.scores };

    // Validate inputs
    if (typeof playerName !== 'string' || playerName.trim() === '') {
      throw new Error('Invalid player name');
    }

    if (holeIndex < 0 || holeIndex > 17) {
      throw new Error('Invalid hole index (must be 0-17)');
    }

    const parsedScore = parseInt(score);
    if (isNaN(parsedScore) || parsedScore < 0) {
      throw new Error('Invalid score (must be a positive number)');
    }

    // Validate score is reasonable (1-15 for most holes)
    const par = round.course?.par?.[holeIndex] || 4;
    if (parsedScore > par + 8) {
      console.warn(`Unusually high score: ${parsedScore} on par ${par} hole`);
    }

    // Initialize player scores if they don't exist
    if (!scores[playerName]) {
      scores[playerName] = Array(18).fill(0);
    }

    // Update the score for the specific hole
    scores[playerName][holeIndex] = parsedScore;

    // Update the round with the new scores and add metadata
    await updateDoc(roundRef, {
      scores,
      lastScoreUpdate: {
        playerName,
        holeIndex,
        score: parsedScore,
        timestamp: new Date().toISOString(),
      },
      updatedAt: serverTimestamp(),
    });

    return parsedScore;
  } catch (error) {
    throw handleFirebaseError(error, 'score update');
  }
};

// Add a bet to a round with improved data structure
export const addBet = async (roundId, bet) => {
  try {
    const roundRef = doc(db, 'rounds', roundId);
    const roundSnap = await getDoc(roundRef);

    if (!roundSnap.exists()) {
      throw new Error('Round not found');
    }

    const round = roundSnap.data();
    const bets = [...(round.bets || [])];

    // Validate bet structure
    if (!bet.type || !bet.amount || !bet.participants || !Array.isArray(bet.participants)) {
      throw new Error('Invalid bet structure');
    }

    // Create standardized bet structure
    const standardizedBet = {
      id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: bet.type,
      amount: parseFloat(bet.amount),
      participants: bet.participants, // Standardized naming
      settings: bet.options || {},
      status: 'active',
      results: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    bets.push(standardizedBet);

    // Update the round with the new bets
    await updateDoc(roundRef, {
      bets,
      updatedAt: serverTimestamp(),
    });

    return standardizedBet.id;
  } catch (error) {
    console.error('Error adding bet: ', error);
    throw error;
  }
};

// Subscribe to real-time updates for a round with better error handling
export const subscribeToRound = (roundId, callback, errorCallback) => {
  if (!roundId || typeof callback !== 'function') {
    throw new Error('Invalid parameters: roundId and callback are required');
  }

  const roundRef = doc(db, 'rounds', roundId);

  return onSnapshot(roundRef, (doc) => {
    try {
      if (doc.exists()) {
        callback(doc.data());
      } else {
        const error = new Error('Round not found');
        if (errorCallback) {
          errorCallback(error);
        } else {
          console.error('Round subscription error:', error);
        }
      }
    } catch (callbackError) {
      console.error('Error in round subscription callback:', callbackError);
      if (errorCallback) {
        errorCallback(callbackError);
      }
    }
  }, (error) => {
    const enhancedError = handleFirebaseError(error, 'round subscription');
    if (errorCallback) {
      errorCallback(enhancedError);
    } else {
      console.error('Round subscription error:', enhancedError);
    }
  });
};

// Get user's recent rounds
export const getUserRounds = (userId, callback) => {
  const roundsRef = collection(db, 'rounds');
  const q = query(
    roundsRef,
    where('createdBy', '==', userId),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(q, (querySnapshot) => {
    const rounds = [];
    querySnapshot.forEach((doc) => {
      rounds.push(doc.data());
    });
    callback(rounds);
  }, (error) => {
    console.error('Error getting user rounds: ', error);
  });
};

// Get a user by ID
export const getUserById = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error getting user: ', error);
    throw error;
  }
};

// Find a user by email
export const findUserByEmail = async (email) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    return {
      ...userDoc.data(),
      uid: userDoc.id,
    };
  } catch (error) {
    console.error('Error finding user: ', error);
    throw error;
  }
};

// Send a friend request
export const sendFriendRequest = async (senderId, recipientEmail) => {
  try {
    // Find recipient by email
    const recipient = await findUserByEmail(recipientEmail);

    if (!recipient) {
      throw new Error('User not found with that email');
    }

    const recipientId = recipient.uid;

    if (senderId === recipientId) {
      throw new Error('You cannot send a friend request to yourself');
    }

    // Check if already friends
    const senderRef = doc(db, 'users', senderId);
    const senderSnap = await getDoc(senderRef);

    if (!senderSnap.exists()) {
      throw new Error('Sender user not found');
    }

    const senderData = senderSnap.data();

    if (senderData.friends && senderData.friends.includes(recipientId)) {
      throw new Error('You are already friends with this user');
    }

    // Check if request already sent
    const recipientRef = doc(db, 'users', recipientId);
    const recipientSnap = await getDoc(recipientRef);

    if (!recipientSnap.exists()) {
      throw new Error('Recipient user not found');
    }

    const recipientData = recipientSnap.data();

    if (recipientData.pendingFriendRequests &&
        recipientData.pendingFriendRequests.some(req => req.senderId === senderId)) {
      throw new Error('Friend request already sent to this user');
    }

    // Add friend request to recipient's pending requests
    const friendRequest = {
      senderId,
      senderName: senderData.displayName,
      senderEmail: senderData.email,
      timestamp: serverTimestamp(),
    };

    await updateDoc(recipientRef, {
      pendingFriendRequests: arrayUnion(friendRequest),
    });

    return true;
  } catch (error) {
    console.error('Error sending friend request: ', error);
    throw error;
  }
};

// Accept a friend request
export const acceptFriendRequest = async (userId, senderId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const userData = userSnap.data();

    // Find the friend request
    const requestIndex = userData.pendingFriendRequests?.findIndex(req => req.senderId === senderId);

    if (requestIndex === -1 || requestIndex === undefined) {
      throw new Error('Friend request not found');
    }

    const senderRef = doc(db, 'users', senderId);
    const senderSnap = await getDoc(senderRef);

    if (!senderSnap.exists()) {
      throw new Error('Sender user not found');
    }

    // Add each user to the other's friends list
    const batch = writeBatch(db);

    // Add sender to user's friends
    batch.update(userRef, {
      friends: arrayUnion(senderId),
      pendingFriendRequests: arrayRemove(userData.pendingFriendRequests[requestIndex]),
    });

    // Add user to sender's friends
    batch.update(senderRef, {
      friends: arrayUnion(userId),
    });

    await batch.commit();

    return true;
  } catch (error) {
    console.error('Error accepting friend request: ', error);
    throw error;
  }
};

// Decline a friend request
export const declineFriendRequest = async (userId, senderId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const userData = userSnap.data();

    // Find the friend request
    const requestIndex = userData.pendingFriendRequests?.findIndex(req => req.senderId === senderId);

    if (requestIndex === -1 || requestIndex === undefined) {
      throw new Error('Friend request not found');
    }

    // Remove the friend request
    await updateDoc(userRef, {
      pendingFriendRequests: arrayRemove(userData.pendingFriendRequests[requestIndex]),
    });

    return true;
  } catch (error) {
    console.error('Error declining friend request: ', error);
    throw error;
  }
};

// Get a user's friends
export const getUserFriends = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const userData = userSnap.data();
    const friendIds = userData.friends || [];

    if (friendIds.length === 0) {
      return [];
    }

    // Get friend user documents
    const friends = [];

    for (const friendId of friendIds) {
      const friendRef = doc(db, 'users', friendId);
      const friendSnap = await getDoc(friendRef);

      if (friendSnap.exists()) {
        friends.push({
          ...friendSnap.data(),
          uid: friendId,
        });
      }
    }

    return friends;
  } catch (error) {
    console.error('Error getting user friends: ', error);
    throw error;
  }
};

// Get pending friend requests
export const getPendingFriendRequests = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found');
    }

    const userData = userSnap.data();
    return userData.pendingFriendRequests || [];
  } catch (error) {
    console.error('Error getting pending friend requests: ', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp(),
    });

    // Update auth profile if display name is provided
    if (profileData.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: profileData.displayName,
      });
    }

    return true;
  } catch (error) {
    console.error('Error updating user profile: ', error);
    throw error;
  }
};

// Update bet status and results
export const updateBetResults = async (roundId, betId, results) => {
  try {
    const roundRef = doc(db, 'rounds', roundId);
    const roundSnap = await getDoc(roundRef);

    if (!roundSnap.exists()) {
      throw new Error('Round not found');
    }

    const round = roundSnap.data();
    const bets = [...(round.bets || [])];

    // Find and update the bet
    const betIndex = bets.findIndex(bet => bet.id === betId);
    if (betIndex === -1) {
      throw new Error('Bet not found');
    }

    bets[betIndex] = {
      ...bets[betIndex],
      results,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(roundRef, {
      bets,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error updating bet results:', error);
    throw error;
  }
};

// Track detailed golf statistics for a round
export const updateRoundStatistics = async (roundId, playerName, stats) => {
  try {
    const roundRef = doc(db, 'rounds', roundId);
    const roundSnap = await getDoc(roundRef);

    if (!roundSnap.exists()) {
      throw new Error('Round not found');
    }

    const round = roundSnap.data();
    const statistics = { ...(round.statistics || {}) };

    statistics[playerName] = {
      ...stats,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(roundRef, {
      statistics,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error updating round statistics:', error);
    throw error;
  }
};

// Add course rating data for proper handicap calculations
export const updateCourseData = async (roundId, courseData) => {
  try {
    const roundRef = doc(db, 'rounds', roundId);

    const enhancedCourseData = {
      ...courseData,
      rating: courseData.rating || 72.0,
      slope: courseData.slope || 113,
      teeBox: courseData.teeBox || 'white',
      yardage: courseData.yardage || Array(18).fill(400),
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(roundRef, {
      course: enhancedCourseData,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error updating course data:', error);
    throw error;
  }
};

// Batch update multiple scores for performance
export const batchUpdateScores = async (roundId, scoreUpdates) => {
  try {
    if (!isConnected) {
      throw new Error('No internet connection. Scores will be saved when connection is restored.');
    }

    if (!Array.isArray(scoreUpdates) || scoreUpdates.length === 0) {
      throw new Error('Invalid score updates provided');
    }

    const roundRef = doc(db, 'rounds', roundId);
    const roundSnap = await getDoc(roundRef);

    if (!roundSnap.exists()) {
      throw handleFirebaseError(new Error('Round not found'), 'batch score update');
    }

    const round = roundSnap.data();
    const scores = { ...round.scores };

    // Validate and apply all score updates
    const validUpdates = [];
    scoreUpdates.forEach(({ playerName, holeIndex, score }) => {
      // Validate each update
      if (typeof playerName !== 'string' || playerName.trim() === '') {
        console.warn('Skipping invalid player name in batch update');
        return;
      }

      if (holeIndex < 0 || holeIndex > 17) {
        console.warn(`Skipping invalid hole index ${holeIndex} in batch update`);
        return;
      }

      const parsedScore = parseInt(score);
      if (isNaN(parsedScore) || parsedScore < 0) {
        console.warn(`Skipping invalid score ${score} in batch update`);
        return;
      }

      if (!scores[playerName]) {
        scores[playerName] = Array(18).fill(0);
      }
      scores[playerName][holeIndex] = parsedScore;
      validUpdates.push({ playerName, holeIndex, score: parsedScore });
    });

    if (validUpdates.length === 0) {
      throw new Error('No valid score updates provided');
    }

    await updateDoc(roundRef, {
      scores,
      lastBatchUpdate: {
        count: validUpdates.length,
        timestamp: new Date().toISOString(),
        updates: validUpdates,
      },
      updatedAt: serverTimestamp(),
    });

    return validUpdates.length;
  } catch (error) {
    throw handleFirebaseError(error, 'batch score update');
  }
};

// Export round data for sharing/analysis
export const exportRoundData = async (roundId) => {
  try {
    const roundRef = doc(db, 'rounds', roundId);
    const roundSnap = await getDoc(roundRef);

    if (!roundSnap.exists()) {
      throw new Error('Round not found');
    }

    const round = roundSnap.data();

    // Create exportable data structure
    const exportData = {
      roundInfo: {
        id: roundId,
        date: round.date,
        course: round.course,
        players: round.players,
        createdBy: round.createdBy,
      },
      scores: round.scores,
      bets: round.bets,
      statistics: round.statistics,
      exportedAt: new Date().toISOString(),
    };

    return exportData;
  } catch (error) {
    console.error('Error exporting round data:', error);
    throw error;
  }
};

// Get rounds for statistics and history
export const getRoundsForPlayer = async (playerId, limit = 20) => {
  try {
    const roundsRef = collection(db, 'rounds');
    const q = query(
      roundsRef,
      where('playerUids', 'array-contains', playerId),
      orderBy('createdAt', 'desc'),
      limit(limit),
    );

    const querySnapshot = await getDocs(q);
    const rounds = [];

    querySnapshot.forEach((doc) => {
      rounds.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return rounds;
  } catch (error) {
    console.error('Error getting player rounds:', error);
    throw error;
  }
};

export default db;
