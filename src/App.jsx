import React, { useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import PlayerManagement from './components/PlayerManagement'
import Scorecard from './components/Scorecard'
import Dashboard from './components/Dashboard'
import { createRound, getRound } from './firebase'
import { useAuth } from './contexts/AuthContext'

function MainApp() {
  const { currentUser, userProfile } = useAuth();
  const [players, setPlayers] = useState([])
  const [roundId, setRoundId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(navigator.onLine)
  const [view, setView] = useState('setup') // 'setup', 'round', or 'dashboard'
  
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
  
  // Check for roundId in URL
  useEffect(() => {
    const url = new URL(window.location)
    const pathSegments = url.pathname.split('/')
    
    if (pathSegments.includes('dashboard')) {
      setView('dashboard')
    } else if (pathSegments.includes('round') && pathSegments.length > 2) {
      const urlRoundId = pathSegments[pathSegments.indexOf('round') + 1]
      if (urlRoundId) {
        loadExistingRound(urlRoundId)
      }
    }
  }, [])
  
  // Initialize players from user profile if available
  useEffect(() => {
    if (view === 'setup' && currentUser && userProfile) {
      setPlayers([
        {
          name: userProfile.displayName || currentUser.email,
          handicap: userProfile.handicap || 0
        }
      ])
    }
  }, [currentUser, userProfile, view])
  
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
        createdBy: currentUser ? currentUser.uid : null,
        course: {
          name: 'Sample Golf Course',
          par: [4, 5, 3, 4, 4, 5, 3, 4, 4, 4, 5, 3, 4, 4, 5, 3, 4, 4],
          handicap: [7, 1, 15, 5, 11, 3, 17, 13, 9, 8, 2, 16, 6, 12, 4, 18, 14, 10]
        }
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
  
  const navigateToDashboard = () => {
    setView('dashboard')
    window.history.pushState({}, '', '/dashboard')
  }
  
  return (
    <div className="max-w-screen-lg mx-auto p-4 space-y-6">
      <header className="text-center space-y-2 mb-6">
        <h1 className="text-3xl font-bold text-green-700">Sandbagger</h1>
        <p className="text-gray-700">Track golf bets, handicaps, and scorecards</p>
        
        <nav className="flex justify-center space-x-4 mt-4">
          <button 
            onClick={returnToSetup}
            className={`px-3 py-1 rounded ${view === 'setup' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            New Round
          </button>
          <button 
            onClick={navigateToDashboard}
            className={`px-3 py-1 rounded ${view === 'dashboard' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            Dashboard
          </button>
        </nav>
      </header>
      
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
      
      {view === 'dashboard' ? (
        <Dashboard />
      ) : view === 'setup' ? (
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

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}

export default App