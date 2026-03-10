import React, { useState, useEffect, useRef } from 'react'
import { supabase } from './lib/supabase'
import { BriefcaseBusiness, LogIn, Loader2, Play, Square, Activity } from 'lucide-react'
import axios from 'axios'

// Replace with your actual local network IP or production URL of the Next.js web application
const NEXT_PUBLIC_API_URL = 'http://localhost:3000'

function App(): React.JSX.Element {
  const [session, setSession] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Tracking State
  const [isTracking, setIsTracking] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [timeElapsed, setTimeElapsed] = useState(0) // in seconds

  // Ref for the 10-minute interval (600,000 ms)
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  // Ref for the UI ticking clock
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Timer Tick
  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isTracking])

  // Handle taking a screenshot and uploading it
  const takeAndUploadScreenshot = async (sessionId: string) => {
    if (!session?.access_token) return

    try {
      // 1. Invoke Electrons main process to capture the screen
      // @ts-ignore
      const base64Image = await window.electron.ipcRenderer.invoke('capture-screen')
      if (!base64Image) {
        console.error("Failed to capture screen.")
        return
      }

      // Hardcode an employer ID for demonstration (In a real app, you'd fetch active contracts)
      // Usually, the candidate selects the employer/job they are working on from a dropdown before hitting "Start".
      const employerId = "replace-with-valid-employer-uuid-or-fetch-from-db" // Bypassing strictly for MVP.

      // 2. Post to Next.js API
      await axios.post(`${NEXT_PUBLIC_API_URL}/api/tracker/upload`, {
        sessionId,
        employerId,
        imageBase64: base64Image,
        keyboardStrokes: Math.floor(Math.random() * 500), // Simulated
        mouseClicks: Math.floor(Math.random() * 200) // Simulated
      }, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })
      console.log('Screenshot uploaded successfully!')
    } catch (err) {
      console.error("Error uploading screenshot:", err)
    }
  }

  const handleStartTracking = async () => {
    if (!session?.access_token) return
    setLoading(true)
    setError('')

    try {
      const res = await axios.post(`${NEXT_PUBLIC_API_URL}/api/tracker/session/start`, {
        employerId: session.user.id // MVP bypass
      }, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      const sessionId = res.data.sessionId
      setActiveSessionId(sessionId)
      setIsTracking(true)
      setTimeElapsed(0)

      // Immediately take the first screenshot
      takeAndUploadScreenshot(sessionId)

      // Set up the interval for every 10 minutes (600,000 ms)
      // We will use 10 seconds for testing right now (10,000 ms)
      trackingIntervalRef.current = setInterval(() => {
        takeAndUploadScreenshot(sessionId)
      }, 10000) // Change to 600000 for 10 minutes

    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
    }

    setLoading(false)
  }

  const handleStopTracking = async () => {
    if (!session?.access_token || !activeSessionId) return
    setIsTracking(false)

    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current)
    }

    try {
      await axios.post(`${NEXT_PUBLIC_API_URL}/api/tracker/session/stop`, {
        sessionId: activeSessionId
      }, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })
    } catch (err) {
      console.error("Error stopping session", err)
    }

    setActiveSessionId(null)
    setTimeElapsed(0)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (session) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-slate-100 flex flex-col relative overflow-hidden">

          {/* Tracking Pulse Background */}
          {isTracking && (
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-pulse"></div>
          )}

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BriefcaseBusiness className="w-5 h-5 text-blue-600" />
              TeamoraPH
            </h1>
            <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md">
              {session.user.email}
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className={`text-6xl font-black mb-8 transition-colors ${isTracking ? 'text-blue-600' : 'text-slate-300'}`}>
              {formatTime(timeElapsed)}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg w-full mb-6 font-medium border border-red-100">
                {error}
              </div>
            )}

            {!isTracking ? (
              <button
                onClick={handleStartTracking}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 px-4 rounded-2xl shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] mb-4 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5 fill-white" /> Start Shift</>}
              </button>
            ) : (
              <button
                onClick={handleStopTracking}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-4 rounded-2xl shadow-lg shadow-red-500/30 transition-all active:scale-[0.98] mb-4 flex items-center justify-center gap-2"
              >
                <Square className="w-5 h-5 fill-white" /> Stop Tracking
              </button>
            )}

            {isTracking && (
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 bg-slate-50 px-4 py-2 rounded-full mt-4">
                <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                Recording screens every 10s (Test Mode)
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              disabled={isTracking}
              className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border border-slate-100">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <BriefcaseBusiness className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Work Time Tracker</h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Log in with your TeamoraPH account</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 font-medium border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-6"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-5 h-5" /> Sign In</>}
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
