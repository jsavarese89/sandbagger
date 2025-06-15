import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, onSnapshot, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

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

export default db;