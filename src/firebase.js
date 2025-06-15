import { initializeApp } from 'firebase/app';
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
  arrayRemove
} from 'firebase/firestore';
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
  sendPasswordResetEmail
} from 'firebase/auth';

// Your Firebase configuration
// Replace these values with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyDKnmFcnjqmA9V6iAW7wdl5iREuLQvVw0o",
  authDomain: "sandbagger-golf.firebaseapp.com",
  projectId: "sandbagger-golf",
  storageBucket: "sandbagger-golf.appspot.com",
  messagingSenderId: "841256418931",
  appId: "1:841256418931:web:24aaed34d3de7652ffbbd8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Anonymous authentication for users who don't want to sign up
export const signInAnonymous = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in anonymously: ", error);
    throw error;
  }
};

// Sign up with email and password
export const signUpWithEmail = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's profile with the display name
    await updateProfile(userCredential.user, { displayName });
    
    // Create a user document in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      displayName,
      email,
      createdAt: serverTimestamp(),
      handicap: 0,
      friends: [],
      pendingFriendRequests: []
    });
    
    return userCredential.user;
  } catch (error) {
    console.error("Error signing up with email: ", error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in with email: ", error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    
    // Check if this is the first time signing in with Google
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    
    if (!userDoc.exists()) {
      // Create a user document in Firestore for new Google users
      await setDoc(doc(db, "users", userCredential.user.uid), {
        displayName: userCredential.user.displayName,
        email: userCredential.user.email,
        createdAt: serverTimestamp(),
        handicap: 0,
        friends: [],
        pendingFriendRequests: []
      });
    }
    
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw error;
  }
};

// Sign in with Apple
export const signInWithApple = async () => {
  try {
    // Configure OAuth provider
    appleProvider.addScope('email');
    appleProvider.addScope('name');
    
    const userCredential = await signInWithPopup(auth, appleProvider);
    
    // Check if this is the first time signing in with Apple
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    
    if (!userDoc.exists()) {
      // Create a user document in Firestore for new Apple users
      await setDoc(doc(db, "users", userCredential.user.uid), {
        displayName: userCredential.user.displayName || 'Apple User',
        email: userCredential.user.email,
        createdAt: serverTimestamp(),
        handicap: 0,
        friends: [],
        pendingFriendRequests: []
      });
    }
    
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in with Apple: ", error);
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
};

// Send password reset email
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error sending password reset email: ", error);
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
    const roundsRef = collection(db, "rounds");
    const newRoundRef = doc(roundsRef);
    const roundId = newRoundRef.id;
    
    await setDoc(newRoundRef, {
      ...roundData,
      id: roundId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return roundId;
  } catch (error) {
    console.error("Error creating round: ", error);
    throw error;
  }
};

// Get a round by ID
export const getRound = async (roundId) => {
  try {
    const roundRef = doc(db, "rounds", roundId);
    const roundSnap = await getDoc(roundRef);
    
    if (roundSnap.exists()) {
      return roundSnap.data();
    } else {
      throw new Error("Round not found");
    }
  } catch (error) {
    console.error("Error getting round: ", error);
    throw error;
  }
};

// Update a round's data
export const updateRound = async (roundId, updateData) => {
  try {
    const roundRef = doc(db, "rounds", roundId);
    await updateDoc(roundRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating round: ", error);
    throw error;
  }
};

// Update a specific player's score for a hole
export const updateScore = async (roundId, playerName, holeIndex, score) => {
  try {
    const roundRef = doc(db, "rounds", roundId);
    const roundSnap = await getDoc(roundRef);
    
    if (!roundSnap.exists()) {
      throw new Error("Round not found");
    }
    
    const round = roundSnap.data();
    const scores = {...round.scores};
    
    // Initialize player scores if they don't exist
    if (!scores[playerName]) {
      scores[playerName] = Array(18).fill(0);
    }
    
    // Update the score for the specific hole
    scores[playerName][holeIndex] = parseInt(score) || 0;
    
    // Update the round with the new scores
    await updateDoc(roundRef, {
      scores,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error updating score for ${playerName} on hole ${holeIndex+1}: `, error);
    throw error;
  }
};

// Add a bet to a round
export const addBet = async (roundId, bet) => {
  try {
    const roundRef = doc(db, "rounds", roundId);
    const roundSnap = await getDoc(roundRef);
    
    if (!roundSnap.exists()) {
      throw new Error("Round not found");
    }
    
    const round = roundSnap.data();
    const bets = [...(round.bets || [])];
    
    // Add the new bet with a timestamp
    bets.push({
      ...bet,
      timestamp: serverTimestamp()
    });
    
    // Update the round with the new bets
    await updateDoc(roundRef, {
      bets,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error adding bet: ", error);
    throw error;
  }
};

// Subscribe to real-time updates for a round
export const subscribeToRound = (roundId, callback) => {
  const roundRef = doc(db, "rounds", roundId);
  
  return onSnapshot(roundRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      console.error("Round not found");
    }
  }, (error) => {
    console.error("Error subscribing to round: ", error);
  });
};

// Get user's recent rounds
export const getUserRounds = (userId, callback) => {
  const roundsRef = collection(db, "rounds");
  const q = query(
    roundsRef,
    where("createdBy", "==", userId),
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const rounds = [];
    querySnapshot.forEach((doc) => {
      rounds.push(doc.data());
    });
    callback(rounds);
  }, (error) => {
    console.error("Error getting user rounds: ", error);
  });
};

// Get a user by ID
export const getUserById = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      throw new Error("User not found");
    }
  } catch (error) {
    console.error("Error getting user: ", error);
    throw error;
  }
};

// Find a user by email
export const findUserByEmail = async (email) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userDoc = querySnapshot.docs[0];
    return {
      ...userDoc.data(),
      uid: userDoc.id
    };
  } catch (error) {
    console.error("Error finding user: ", error);
    throw error;
  }
};

// Send a friend request
export const sendFriendRequest = async (senderId, recipientEmail) => {
  try {
    // Find recipient by email
    const recipient = await findUserByEmail(recipientEmail);
    
    if (!recipient) {
      throw new Error("User not found with that email");
    }
    
    const recipientId = recipient.uid;
    
    if (senderId === recipientId) {
      throw new Error("You cannot send a friend request to yourself");
    }
    
    // Check if already friends
    const senderRef = doc(db, "users", senderId);
    const senderSnap = await getDoc(senderRef);
    
    if (!senderSnap.exists()) {
      throw new Error("Sender user not found");
    }
    
    const senderData = senderSnap.data();
    
    if (senderData.friends && senderData.friends.includes(recipientId)) {
      throw new Error("You are already friends with this user");
    }
    
    // Check if request already sent
    const recipientRef = doc(db, "users", recipientId);
    const recipientSnap = await getDoc(recipientRef);
    
    if (!recipientSnap.exists()) {
      throw new Error("Recipient user not found");
    }
    
    const recipientData = recipientSnap.data();
    
    if (recipientData.pendingFriendRequests && 
        recipientData.pendingFriendRequests.some(req => req.senderId === senderId)) {
      throw new Error("Friend request already sent to this user");
    }
    
    // Add friend request to recipient's pending requests
    const friendRequest = {
      senderId,
      senderName: senderData.displayName,
      senderEmail: senderData.email,
      timestamp: serverTimestamp()
    };
    
    await updateDoc(recipientRef, {
      pendingFriendRequests: arrayUnion(friendRequest)
    });
    
    return true;
  } catch (error) {
    console.error("Error sending friend request: ", error);
    throw error;
  }
};

// Accept a friend request
export const acceptFriendRequest = async (userId, senderId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userSnap.data();
    
    // Find the friend request
    const requestIndex = userData.pendingFriendRequests?.findIndex(req => req.senderId === senderId);
    
    if (requestIndex === -1 || requestIndex === undefined) {
      throw new Error("Friend request not found");
    }
    
    const senderRef = doc(db, "users", senderId);
    const senderSnap = await getDoc(senderRef);
    
    if (!senderSnap.exists()) {
      throw new Error("Sender user not found");
    }
    
    // Add each user to the other's friends list
    const batch = writeBatch(db);
    
    // Add sender to user's friends
    batch.update(userRef, {
      friends: arrayUnion(senderId),
      pendingFriendRequests: arrayRemove(userData.pendingFriendRequests[requestIndex])
    });
    
    // Add user to sender's friends
    batch.update(senderRef, {
      friends: arrayUnion(userId)
    });
    
    await batch.commit();
    
    return true;
  } catch (error) {
    console.error("Error accepting friend request: ", error);
    throw error;
  }
};

// Decline a friend request
export const declineFriendRequest = async (userId, senderId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userSnap.data();
    
    // Find the friend request
    const requestIndex = userData.pendingFriendRequests?.findIndex(req => req.senderId === senderId);
    
    if (requestIndex === -1 || requestIndex === undefined) {
      throw new Error("Friend request not found");
    }
    
    // Remove the friend request
    await updateDoc(userRef, {
      pendingFriendRequests: arrayRemove(userData.pendingFriendRequests[requestIndex])
    });
    
    return true;
  } catch (error) {
    console.error("Error declining friend request: ", error);
    throw error;
  }
};

// Get a user's friends
export const getUserFriends = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userSnap.data();
    const friendIds = userData.friends || [];
    
    if (friendIds.length === 0) {
      return [];
    }
    
    // Get friend user documents
    const friends = [];
    
    for (const friendId of friendIds) {
      const friendRef = doc(db, "users", friendId);
      const friendSnap = await getDoc(friendRef);
      
      if (friendSnap.exists()) {
        friends.push({
          ...friendSnap.data(),
          uid: friendId
        });
      }
    }
    
    return friends;
  } catch (error) {
    console.error("Error getting user friends: ", error);
    throw error;
  }
};

// Get pending friend requests
export const getPendingFriendRequests = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userSnap.data();
    return userData.pendingFriendRequests || [];
  } catch (error) {
    console.error("Error getting pending friend requests: ", error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    });
    
    // Update auth profile if display name is provided
    if (profileData.displayName && auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: profileData.displayName
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error updating user profile: ", error);
    throw error;
  }
};

export default db;