import React, { useState, useEffect } from 'react'
import PlayerManagement from './components/PlayerManagement'
import Scorecard from './components/Scorecard'
import { signInAnonymous, createRound, getRound } from './firebase'

function App() {
  const [players, setPlayers] = useState([])
  const [userId, setUserId] = useState(null)
  const [roundId, setRoundId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(navigator.onLine)
  const [view, setView] = useState('setup') // 'setup' or 'round'
  
  // Check network status
  useEffect(() => {
    const handleOnline = () => setIsConnected(true)
    const handleOffline = () => setIsConnected(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Sign in anonymously on load
  useEffect(() => {
    async function signIn() {
      try {
        const user = await signInAnonymous()
        setUserId(user.uid)
      } catch (error) {
        console.error("Error signing in:", error)
      }
    }
    
    signIn()
    
    // Check for roundId in URL
    const url = new URL(window.location)
    const pathSegments = url.pathname.split('/')
    if (pathSegments.includes('round') && pathSegments.length > 2) {
      const urlRoundId = pathSegments[pathSegments.indexOf('round') + 1]
      if (urlRoundId) {
        loadExistingRound(urlRoundId)
      }
    }
  }, [])
  
  const loadExistingRound = async (id) => {
    try {
      setLoading(true)
      const roundData = await getRound(id)
      setPlayers(roundData.players || [])
      setRoundId(id)
      setView('round')
    } catch (error) {
      console.error("Error loading round:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const startNewRound = async () => {
    if (players.length === 0) {
      alert("Please add at least one player")
      return
    }
    
    try {
      setLoading(true)
      
      // Initialize empty scores for all players
      const scores = {}
      players.forEach(player => {
        scores[player.name] = Array(18).fill(0)
      })
      
      // Create new round in Firebase
      const id = await createRound({
        players,
        scores,
        bets: [],
        createdBy: userId,
      })
      
      setRoundId(id)
      setView('round')
      
      // Update URL without reloading
      window.history.pushState({}, '', `/round/${id}`)
    } catch (error) {
      console.error("Error starting new round:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const returnToSetup = () => {
    setView('setup')
    window.history.pushState({}, '', '/')
  }
  
  return (
    <div className="max-w-screen-lg mx-auto p-4 space-y-6">
      <header className="text-center space-y-2 mb-6">
        <h1 className="text-3xl font-bold text-green-700">Sandbagger</h1>
        <p className="text-gray-700">Track golf bets, handicaps, and scorecards</p>
      </header>
      
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
      
      {view === 'setup' ? (
        <div className="space-y-6">
          <PlayerManagement 
            players={players}
            setPlayers={setPlayers}
          />
          
          {players.length > 0 && (
            <div className="text-center mt-6">
              <button 
                className="btn btn-primary"
                onClick={startNewRound}
                disabled={loading}
              >
                Start Round
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <Scorecard 
            players={players}
            roundId={roundId}
            isConnected={isConnected}
          />
          
          <div className="text-center mt-6">
            <button 
              className="btn btn-secondary"
              onClick={returnToSetup}
            >
              Return to Setup
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
