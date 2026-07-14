import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Eye, EyeOff, Zap, Mail, Lock, User, ChevronLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useSignIn as useClerkSignIn } from '@clerk/clerk-react'
import toast from 'react-hot-toast'

const isClerkEnabled = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.includes('Zm9vYmFy') && !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.includes('disabled');

const useSignIn = isClerkEnabled
  ? useClerkSignIn
  : () => ({ signIn: null, isLoaded: false });

interface LoginProps {
  initialTab?: 'login' | 'signup'
}

export default function Login({ initialTab }: LoginProps) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login, register, oauthLogin } = useAuth()
  const { signIn, isLoaded: isSignInLoaded } = useSignIn()
  
  // Detect tab from props or URL
  const queryTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login'
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab || queryTab)
  
  // Forms states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthModal, setOauthModal] = useState<{
    isOpen: boolean;
    provider: 'google' | 'github';
    email: string;
    name: string;
  }>({
    isOpen: false,
    provider: 'google',
    email: '',
    name: ''
  });

  // Canvas ref for high-tech particles network
  const canvasRef = useRef<HTMLCanvasElement>(null)



  // Sync tab status
  useEffect(() => {
    const tab = searchParams.get('tab') === 'signup' ? 'signup' : 'login'
    setActiveTab(initialTab || tab)
  }, [searchParams, initialTab])

  // HTML5 Interactive Particle Network backdrop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      color: string
    }> = []

    // Populate particles
    const particleCount = Math.min(60, Math.floor((width * height) / 25000))
    const colors = ['rgba(168, 85, 247, 0.45)', 'rgba(6, 182, 212, 0.45)', 'rgba(59, 130, 246, 0.35)']
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)]
      })
    }

    let mouse = { x: -1000, y: -1000 }

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)'
      ctx.lineWidth = 1
      const gridSize = 60
      for (let i = 0; i < width; i += gridSize) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, height)
        ctx.stroke()
      }
      for (let j = 0; j < height; j += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, j)
        ctx.lineTo(width, j)
        ctx.stroke()
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i]
        
        // Move particle
        p1.x += p1.vx
        p1.y += p1.vy

        // Bounce edges
        if (p1.x < 0 || p1.x > width) p1.vx *= -1
        if (p1.y < 0 || p1.y > height) p1.vy *= -1

        // Connect particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)
          
          if (dist < 120) {
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.15 * (1 - dist / 120)})`
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }

        // Connect to mouse cursor
        const mouseDist = Math.hypot(p1.x - mouse.x, p1.y - mouse.y)
        if (mouseDist < 180) {
          ctx.strokeStyle = `rgba(6, 182, 212, ${0.25 * (1 - mouseDist / 180)})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.stroke()
        }

        // Draw particle dot
        ctx.fillStyle = p1.color
        ctx.beginPath()
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2)
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])



  const handleToggleTab = (tab: 'login' | 'signup') => {
    setActiveTab(tab)
    navigate(`/auth/login?tab=${tab}`, { replace: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    if (activeTab === 'signup') {
      if (!fullName.trim()) return toast.error("Full name is required")
      if (!email.trim()) return toast.error("Email address is required")
      if (password.length < 6) return toast.error("Password must be at least 6 characters")
      if (password !== confirmPassword) return toast.error("Passwords do not match")
      
      setLoading(true)
      try {
        await register({ name: fullName, email, password })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    } else {
      if (!email.trim()) return toast.error("Email address is required")
      if (!password) return toast.error("Password is required")
      
      setLoading(true)
      try {
        await login({ email, password })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleGoogleLogin = async () => {
    // Redirect to backend Google OAuth endpoint
    const backendUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '') 
      : 'http://localhost:5000';
      
    window.location.href = `${backendUrl}/api/auth/google`;
  }

  const handleGitHubLogin = async () => {
    if (isSignInLoaded && import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.includes('Zm9vYmFy') && signIn) {
      const useClerk = window.confirm("Use Clerk GitHub SSO redirect? (Select 'Cancel' to simulate sign-in instantly in your sandbox)")
      if (useClerk) {
        try {
          await signIn.authenticateWithRedirect({
            strategy: 'oauth_github',
            redirectUrl: '/sso-callback',
            redirectUrlComplete: '/dashboard'
          })
        } catch (err) {
          console.error("Clerk GitHub Login error:", err)
        }
        return
      }
    }

    setOauthModal({
      isOpen: true,
      provider: 'github',
      email: 'you@github.com',
      name: 'GitHub User'
    });
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#03020A',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      {/* Network Particles Backdrop */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Futuristic Gradients & Glows */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '1200px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 65%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'rgba(6, 182, 212, 0.04)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '20%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'rgba(168, 85, 247, 0.05)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Premium Authentication Card Wrapper */}
      <div style={{ zIndex: 1, width: '100%', maxWidth: '460px' }}>
        <motion.div
          style={{
            width: '100%',
            maxWidth: '460px',
            background: 'rgba(12, 10, 24, 0.65)',
            border: '1px solid rgba(168, 85, 247, 0.15)',
            borderRadius: '28px',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 40px rgba(168, 85, 247, 0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
            padding: '36px',
            boxSizing: 'border-box',
            position: 'relative'
          }}
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Back Button */}
          <button
            onClick={handleBack}
            style={{
              position: 'absolute',
              left: 20,
              top: 20,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              color: '#94A3B8',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              transform: 'translateZ(10px)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)'
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
              e.currentTarget.style.color = '#94A3B8'
            }}
          >
            <ChevronLeft size={14} />
          </button>

          {/* App Logo with translateZ */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18, transform: 'translateZ(30px)' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #A855F7, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(168, 85, 247, 0.45)'
            }}>
              <Zap size={22} color="white" strokeWidth={2.5} className="animate-pulse" />
            </div>
          </div>

          {/* Title Header with translateZ */}
          <div style={{ textAlign: 'center', marginBottom: 28, transform: 'translateZ(25px)' }}>
            <h2 style={{
              fontSize: '34px',
              fontWeight: 800,
              color: 'white',
              margin: '0 0 6px',
              fontFamily: 'Sora, sans-serif',
              letterSpacing: '-0.03em',
              background: 'linear-gradient(to right, #FFFFFF, #E2E8F0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p style={{
              fontSize: '15px',
              color: '#8A8A9A',
              margin: 0,
              fontFamily: 'Space Grotesk, sans-serif',
              letterSpacing: '-0.01em'
            }}>
              {activeTab === 'login' ? 'Sign in to continue where you left off' : 'Join NexusAI and start managing projects'}
            </p>
          </div>

          {/* Segment Control Toggle */}
          <div style={{
            position: 'relative',
            display: 'flex',
            width: '100%',
            height: '50px',
            backgroundColor: '#0A0815',
            borderRadius: '25px',
            padding: '3px',
            boxSizing: 'border-box',
            marginBottom: 24,
            border: '1px solid rgba(168, 85, 247, 0.1)',
            transform: 'translateZ(15px)'
          }}>
            {/* Sliding Pill Indicator */}
            <motion.div
              style={{
                position: 'absolute',
                top: 3,
                bottom: 3,
                left: activeTab === 'login' ? '3px' : 'calc(50% + 1.5px)',
                width: 'calc(50% - 4.5px)',
                borderRadius: '22px',
                background: 'linear-gradient(135deg, #A855F7, #06B6D4)',
                zIndex: 1,
                boxShadow: '0 4px 12px rgba(168, 85, 247, 0.35)'
              }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              layout
            />
            
            <button
              type="button"
              onClick={() => handleToggleTab('login')}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                color: activeTab === 'login' ? 'white' : '#71717A',
                zIndex: 2,
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'color 0.2s',
                fontFamily: 'Space Grotesk, sans-serif',
                outline: 'none'
              }}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => handleToggleTab('signup')}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                color: activeTab === 'signup' ? 'white' : '#71717A',
                zIndex: 2,
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'color 0.2s',
                fontFamily: 'Space Grotesk, sans-serif',
                outline: 'none'
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Form input containers */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', transform: 'translateZ(10px)' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: -8 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                {/* Full Name (Sign Up Mode) */}
                {activeTab === 'signup' && (
                  <div style={{ position: 'relative' }}>
                    <User size={18} color="#A855F7" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Full Name"
                      style={{
                        width: '100%',
                        height: '54px',
                        background: '#090714',
                        border: '1px solid rgba(168, 85, 247, 0.12)',
                        borderRadius: '14px',
                        color: 'white',
                        fontSize: '13.5px',
                        padding: '0 16px 0 46px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'all 0.22s',
                        fontFamily: 'Space Grotesk, sans-serif'
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#A855F7'
                        e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.25), inset 0 1px 0 rgba(168,85,247,0.05)'
                        e.target.style.background = '#0F0C21'
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = 'rgba(168, 85, 247, 0.12)'
                        e.target.style.boxShadow = 'none'
                        e.target.style.background = '#090714'
                      }}
                    />
                  </div>
                )}

                {/* Email Field */}
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="#A855F7" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email address"
                    autoComplete="email"
                    style={{
                      width: '100%',
                      height: '54px',
                      background: '#090714',
                      border: '1px solid rgba(168, 85, 247, 0.12)',
                      borderRadius: '14px',
                      color: 'white',
                      fontSize: '13.5px',
                      padding: '0 16px 0 46px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.22s',
                      fontFamily: 'Space Grotesk, sans-serif'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#A855F7'
                      e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.25), inset 0 1px 0 rgba(168,85,247,0.05)'
                      e.target.style.background = '#0F0C21'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(168, 85, 247, 0.12)'
                      e.target.style.boxShadow = 'none'
                      e.target.style.background = '#090714'
                    }}
                  />
                </div>

                {/* Password Field */}
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="#A855F7" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                    style={{
                      width: '100%',
                      height: '54px',
                      background: '#090714',
                      border: '1px solid rgba(168, 85, 247, 0.12)',
                      borderRadius: '14px',
                      color: 'white',
                      fontSize: '13.5px',
                      padding: '0 44px 0 46px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'all 0.22s',
                      fontFamily: 'Space Grotesk, sans-serif'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#A855F7'
                      e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.25), inset 0 1px 0 rgba(168,85,247,0.05)'
                      e.target.style.background = '#0F0C21'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(168, 85, 247, 0.12)'
                      e.target.style.boxShadow = 'none'
                      e.target.style.background = '#090714'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#64748B',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Confirm Password (Sign Up Mode) */}
                {activeTab === 'signup' && (
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} color="#A855F7" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      style={{
                        width: '100%',
                        height: '54px',
                        background: '#090714',
                        border: '1px solid rgba(168, 85, 247, 0.12)',
                        borderRadius: '14px',
                        color: 'white',
                        fontSize: '13.5px',
                        padding: '0 44px 0 46px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'all 0.22s',
                        fontFamily: 'Space Grotesk, sans-serif'
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = '#A855F7'
                        e.target.style.boxShadow = '0 0 0 3px rgba(168, 85, 247, 0.25), inset 0 1px 0 rgba(168,85,247,0.05)'
                        e.target.style.background = '#0F0C21'
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = 'rgba(168, 85, 247, 0.12)'
                        e.target.style.boxShadow = 'none'
                        e.target.style.background = '#090714'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Forgot Password Link (Login only) */}
            {activeTab === 'login' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -3 }}>
                <Link
                  to="/auth/forgot-password"
                  style={{
                    fontSize: '12.5px',
                    color: '#06B6D4',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontFamily: 'Space Grotesk, sans-serif',
                    letterSpacing: '-0.01em',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Primary Action Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02, boxShadow: '0 0 32px rgba(6, 182, 212, 0.55)' }}
              whileTap={{ scale: 0.97 }}
              disabled={loading}
              style={{
                width: '100%',
                height: '54px',
                borderRadius: '27px',
                background: 'linear-gradient(135deg, #A855F7, #06B6D4)',
                border: 'none',
                color: 'white',
                fontSize: '15.5px',
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
                fontFamily: 'Space Grotesk, sans-serif',
                transform: 'translateZ(20px)'
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                activeTab === 'login' ? 'Authenticate' : 'Register Workspace'
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '22px 0',
            transform: 'translateZ(10px)'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(168, 85, 247, 0.12)' }} />
            <span style={{ fontSize: '12.5px', color: '#71717A', fontFamily: 'Space Grotesk, sans-serif' }}>
              or continue with
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(168, 85, 247, 0.12)' }} />
          </div>

          {/* Symmetrical Social Authentication */}
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: 24, transform: 'translateZ(15px)' }}>
            {/* Google */}
            <motion.button
              onClick={handleGoogleLogin}
              whileHover={{ scale: 1.1, borderColor: '#06B6D4', boxShadow: '0 0 14px rgba(6, 182, 212, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#090714',
                border: '1px solid rgba(168, 85, 247, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fillOpacity="0.8" />
                <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fillOpacity="0.8" />
                <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </motion.button>

            {/* GitHub */}
            <motion.button
              onClick={handleGitHubLogin}
              whileHover={{ scale: 1.1, borderColor: '#A855F7', boxShadow: '0 0 14px rgba(168, 85, 247, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: '#090714',
                border: '1px solid rgba(168, 85, 247, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </motion.button>
          </div>

          {/* Footer Text */}
          <div style={{ textAlign: 'center', fontSize: '13.5px', color: '#71717A', fontFamily: 'Space Grotesk, sans-serif', transform: 'translateZ(10px)' }}>
            {activeTab === 'login' ? (
              <>
                New to NexusAI?{' '}
                <button
                  type="button"
                  onClick={() => handleToggleTab('signup')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#06B6D4',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: 'Space Grotesk, sans-serif'
                  }}
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleToggleTab('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#06B6D4',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: 'Space Grotesk, sans-serif'
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {oauthModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(3, 2, 10, 0.8)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 24,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              style={{
                width: '100%',
                maxWidth: 440,
                background: 'rgba(15, 14, 26, 0.85)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: 20,
                padding: '28px 24px',
                boxShadow: '0 24px 64px rgba(0, 0, 0, 0.8), 0 0 32px rgba(168, 85, 247, 0.1)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '-30%',
                left: '20%',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
                zIndex: 0,
                pointerEvents: 'none'
              }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: oauthModal.provider === 'google'
                      ? 'rgba(66, 133, 244, 0.15)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: oauthModal.provider === 'google'
                      ? '1px solid rgba(66, 133, 244, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 700
                  }}>
                    {oauthModal.provider === 'google' ? 'G' : '🐙'}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: 18,
                      fontWeight: 800,
                      fontFamily: 'Sora, sans-serif',
                      background: 'linear-gradient(135deg, #A855F7, #06B6D4)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                      Simulate {oauthModal.provider === 'google' ? 'Google' : 'GitHub'} Sign-In
                    </h3>
                    <p style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)', marginTop: 2, fontFamily: 'Space Grotesk, sans-serif' }}>
                      Local Sandbox Authenticator
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'Space Grotesk, sans-serif' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={oauthModal.email}
                      onChange={(e) => setOauthModal(prev => ({ ...prev, email: e.target.value }))}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 10,
                        color: 'white',
                        padding: '10px 14px',
                        fontSize: 14,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        fontFamily: 'Space Grotesk, sans-serif'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#A855F7'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'Space Grotesk, sans-serif' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={oauthModal.name}
                      onChange={(e) => setOauthModal(prev => ({ ...prev, name: e.target.value }))}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 10,
                        color: 'white',
                        padding: '10px 14px',
                        fontSize: 14,
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        fontFamily: 'Space Grotesk, sans-serif'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#A855F7'}
                      onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setOauthModal(prev => ({ ...prev, isOpen: false }))}
                    style={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.10)',
                      borderRadius: 10,
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: 13,
                      fontWeight: 700,
                      padding: '12px 0',
                      cursor: 'pointer',
                      fontFamily: 'Space Grotesk, sans-serif',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setOauthModal(prev => ({ ...prev, isOpen: false }));
                      setLoading(true);
                      try {
                        await oauthLogin({
                          email: oauthModal.email,
                          name: oauthModal.name,
                          provider: oauthModal.provider
                        });
                      } catch (error) {
                        console.error(error);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #A855F7, #06B6D4)',
                      border: 'none',
                      borderRadius: 10,
                      color: 'white',
                      fontSize: 13,
                      fontWeight: 700,
                      padding: '12px 0',
                      cursor: 'pointer',
                      fontFamily: 'Space Grotesk, sans-serif',
                      boxShadow: '0 8px 24px rgba(168, 85, 247, 0.35)',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    Authenticate
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
