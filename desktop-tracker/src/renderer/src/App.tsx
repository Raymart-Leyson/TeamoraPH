import React, { useState, useEffect, useRef } from 'react'
import { supabase, API_URL } from './lib/supabase'
import { Loader2, Play, Square, Activity, LogOut, Camera } from 'lucide-react'
import axios from 'axios'

const S = {
  // Base
  screen: { height: '100vh', background: '#0f1117', color: '#fff', display: 'flex', flexDirection: 'column' as const, fontFamily: 'Inter, system-ui, sans-serif', userSelect: 'none' as const, overflow: 'hidden' },
  center: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '24px' },
  // Login
  loginWrap: { height: '100vh', background: '#0f1117', color: '#fff', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', padding: '28px', gap: '0', fontFamily: 'Inter, system-ui, sans-serif', userSelect: 'none' as const },
  logoBox: { width: 52, height: 52, background: '#2563eb', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: '0 8px 32px rgba(37,99,235,0.4)' },
  title: { fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4, textAlign: 'center' as const },
  subtitle: { fontSize: 12, color: '#64748b', marginBottom: 24, textAlign: 'center' as const },
  googleBtn: { width: '100%', background: '#fff', border: 'none', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 12 },
  divider: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginBottom: 12 },
  divLine: { flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' },
  divText: { fontSize: 11, color: '#475569', fontWeight: 500 },
  emailBtn: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '11px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#94a3b8', marginBottom: 0 },
  input: { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '11px 14px', color: '#fff', fontSize: 13, outline: 'none', marginBottom: 8, boxSizing: 'border-box' as const },
  primaryBtn: { width: '100%', background: '#2563eb', border: 'none', borderRadius: 12, padding: '12px', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  errorBox: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 11, padding: '10px 12px', borderRadius: 10, marginBottom: 12, textAlign: 'center' as const, width: '100%' },
  // Tracker
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' },
  avatar: { width: 30, height: 30, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, border: '2px solid rgba(59,130,246,0.4)' },
  userInfo: { display: 'flex', flexDirection: 'column' as const },
  userName: { fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.2 },
  userEmail: { fontSize: 10, color: '#475569', lineHeight: 1.2 },
  indicator: { height: 2, background: 'rgba(255,255,255,0.05)' },
  indicatorActive: { height: 2, background: 'linear-gradient(90deg, #3b82f6, #6366f1, #3b82f6)' },
  timerNum: { fontSize: 40, fontWeight: 900, letterSpacing: '-2px', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' },
  liveRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 },
  liveDot: { width: 6, height: 6, borderRadius: '50%', background: '#4ade80' },
  liveText: { fontSize: 10, color: '#4ade80', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' as const },
  statsRow: { display: 'flex', gap: 8, marginTop: 16, marginBottom: 20 },
  statBox: { textAlign: 'center' as const, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '8px 14px', border: '1px solid rgba(255,255,255,0.06)' },
  statVal: { fontSize: 13, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginBottom: 2 },
  statLabel: { fontSize: 10, color: '#475569' },
  startBtn: { width: '100%', background: '#2563eb', border: 'none', borderRadius: 14, padding: '14px', cursor: 'pointer', fontWeight: 800, fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 24px rgba(37,99,235,0.25)' },
  stopBtn: { width: '100%', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 14, padding: '14px', cursor: 'pointer', fontWeight: 800, fontSize: 13, color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  hint: { fontSize: 10, color: '#334155', textAlign: 'center' as const, marginTop: 12, lineHeight: 1.7 },
  footer: { padding: '10px 16px 14px' },
  footerInner: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 12px' },
  footerDot: { width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 },
  footerText: { fontSize: 10, color: '#334155', fontWeight: 500 },
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

function App(): React.JSX.Element {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState('')
  const [isTracking, setIsTracking] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [screenshotCount, setScreenshotCount] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showEmailForm, setShowEmailForm] = useState(false)

  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    // @ts-ignore
    window.electron?.ipcRenderer.on('oauth-callback', async (_event: any, url: string) => {
      try {
        const hash = url.includes('#') ? url.split('#')[1] : url.split('?')[1] || ''
        const params = new URLSearchParams(hash)
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token })
        }
      } catch (e) { console.error('OAuth callback error:', e) }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => setTimeElapsed(p => p + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isTracking])

  const handleGoogleSignIn = async () => {
    setOauthLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'teamoraph://auth/callback', skipBrowserRedirect: true }
      })
      if (error) throw error
      if (data?.url) {
        // Opens Google login in a child Electron window — stays inside the app
        // @ts-ignore
        const callbackUrl: string | null = await window.electron?.ipcRenderer.invoke('open-oauth', data.url)
        if (callbackUrl) {
          // Parse tokens from the hash or query string
          const raw = callbackUrl.includes('#') ? callbackUrl.split('#')[1] : (callbackUrl.split('?')[1] || '')
          const params = new URLSearchParams(raw)
          const access_token = params.get('access_token')
          const refresh_token = params.get('refresh_token')
          
          if (access_token && refresh_token) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token })
            
            if (sessionError) {
              setError(`Session error: ${sessionError.message}`)
            } else if (sessionData?.session) {
              setSession(sessionData.session)
            } else {
              setError('Session could not be established. Please try again.')
            }
          } else {
            const errorDesc = params.get('error_description')
            setError(errorDesc || 'Could not retrieve sign-in tokens. Please try again.')
          }
        }
      }
    } catch (err: any) { setError(err.message || 'Google sign-in failed') }
    setOauthLoading(false)
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleLogout = async () => {
    setIsTracking(false)
    if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current)
    setActiveSessionId(null)
    setTimeElapsed(0)
    setScreenshotCount(0)
    await supabase.auth.signOut()
  }

  const takeAndUploadScreenshot = async (sessionId: string) => {
    if (!session?.access_token) return
    try {
      // @ts-ignore
      const base64Image = await window.electron?.ipcRenderer.invoke('capture-screen')
      if (!base64Image) return
      await axios.post(`${API_URL}/api/tracker/upload`, {
        sessionId, employerId: session.user.id, imageBase64: base64Image,
        keyboardStrokes: Math.floor(Math.random() * 500),
        mouseClicks: Math.floor(Math.random() * 200),
      }, { headers: { Authorization: `Bearer ${session.access_token}` } })
      setScreenshotCount(c => c + 1)
    } catch (err) { console.error('Upload error:', err) }
  }

  const handleStartTracking = async () => {
    if (!session?.access_token) return
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API_URL}/api/tracker/session/start`,
        { employerId: session.user.id },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      const sessionId = res.data.sessionId
      setActiveSessionId(sessionId)
      setIsTracking(true)
      setTimeElapsed(0)
      setScreenshotCount(0)
      takeAndUploadScreenshot(sessionId)
      trackingIntervalRef.current = setInterval(() => takeAndUploadScreenshot(sessionId), 60000)
    } catch (err: any) { setError(err.response?.data?.error || err.message) }
    setLoading(false)
  }

  const handleStopTracking = async () => {
    if (!session?.access_token || !activeSessionId) return
    setIsTracking(false)
    if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current)
    
    try {
      // Take one final screenshot right before closing the session
      await takeAndUploadScreenshot(activeSessionId)
      
      await axios.post(`${API_URL}/api/tracker/session/stop`,
        { sessionId: activeSessionId },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )
    } catch (err) { console.error('Stop error:', err) }
    
    setActiveSessionId(null)
    setTimeElapsed(0)
  }

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0')
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${h}:${m}:${sec}`
  }

  // ─────────────────────────────────────────
  // TRACKER SCREEN (logged in)
  // ─────────────────────────────────────────
  if (session) {
    const avatarUrl = session.user?.user_metadata?.avatar_url
    const name: string = session.user?.user_metadata?.full_name || session.user?.email?.split('@')[0] || 'You'
    return (
      <div style={S.screen}>
        {/* Top bar */}
        <div style={S.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {avatarUrl
              ? <img src={avatarUrl} style={{ ...S.avatar, padding: 0 }} alt="avatar" />
              : <div style={S.avatar}>{name[0].toUpperCase()}</div>}
            <div style={S.userInfo}>
              <span style={S.userName}>{name}</span>
              <span style={S.userEmail}>{session.user.email}</span>
            </div>
          </div>
          <button onClick={handleLogout} disabled={isTracking} title="Sign Out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4, borderRadius: 8, opacity: isTracking ? 0.3 : 1 }}>
            <LogOut size={15} />
          </button>
        </div>

        {/* Tracking indicator stripe */}
        <div style={isTracking ? S.indicatorActive : S.indicator} />

        {/* Timer center */}
        <div style={{ ...S.center, paddingTop: 8, paddingBottom: 8 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ ...S.timerNum, color: isTracking ? '#fff' : 'rgba(255,255,255,0.15)' }}>
              {fmt(timeElapsed)}
            </div>
            {isTracking && (
              <div style={S.liveRow}>
                <div style={S.liveDot} />
                <span style={S.liveText}>Recording</span>
              </div>
            )}
          </div>

          {isTracking && (
            <div style={S.statsRow}>
              <div style={S.statBox}>
                <div style={S.statVal}><Camera size={11} color="#60a5fa" /><span>{screenshotCount}</span></div>
                <div style={S.statLabel}>Screenshots</div>
              </div>
              <div style={S.statBox}>
                <div style={S.statVal}><Activity size={11} color="#4ade80" /><span>Active</span></div>
                <div style={S.statLabel}>Status</div>
              </div>
            </div>
          )}

          {error && <div style={S.errorBox}>{error}</div>}

          {!isTracking ? (
            <button onClick={handleStartTracking} disabled={loading} style={S.startBtn}>
              {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <><Play size={14} fill="#fff" /> Start Shift</>}
            </button>
          ) : (
            <button onClick={handleStopTracking} style={S.stopBtn}>
              <Square size={14} fill="#f87171" /> Stop Tracking
            </button>
          )}

          {!isTracking && (
            <p style={S.hint}>Screenshots every 10 min · Sent to your employer</p>
          )}
        </div>

        <div style={S.footer}>
          <div style={S.footerInner}>
            <div style={S.footerDot} />
            <span style={S.footerText}>TeamoraPH Time Tracker v1.0.0</span>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────
  return (
    <div style={S.loginWrap}>
      <div style={S.logoBox}>
        <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 style={S.title}>TeamoraPH Tracker</h1>
      <p style={S.subtitle}>Log in to start tracking your work hours</p>

      {error && <div style={S.errorBox}>{error}</div>}

      <button onClick={handleGoogleSignIn} disabled={oauthLoading || loading} style={S.googleBtn}>
        {oauthLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#64748b' }} /> : <GoogleIcon />}
        <span>{oauthLoading ? 'Opening browser…' : 'Continue with Google'}</span>
      </button>

      <div style={S.divider}>
        <div style={S.divLine} />
        <span style={S.divText}>or</span>
        <div style={S.divLine} />
      </div>

      {!showEmailForm ? (
        <button onClick={() => setShowEmailForm(true)} style={S.emailBtn}>
          Sign in with Email & Password
        </button>
      ) : (
        <form onSubmit={handleEmailSignIn} style={{ width: '100%' }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email address" required style={S.input} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" required style={S.input} />
          <button type="submit" disabled={loading} style={S.primaryBtn}>
            {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Sign In'}
          </button>
        </form>
      )}

      <p style={{ fontSize: 10, color: '#1e293b', marginTop: 20, textAlign: 'center', lineHeight: 1.6 }}>
        Screens are captured during tracked sessions<br />and shared with your employer.
      </p>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default App
