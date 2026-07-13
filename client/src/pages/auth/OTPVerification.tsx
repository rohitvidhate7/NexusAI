import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, CheckCircle, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import api from '../../lib/api'

export default function OTPVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(60)
  const [verified, setVerified] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || 'user@nexusai.com' // Fallback for direct navigation

  const { mutate: verifyOtp, isPending } = useMutation({
    mutationFn: async (otpCode: string) => {
      const res = await api.post('/auth/verify-otp', { email, otp: otpCode })
      return res.data
    },
    onSuccess: () => {
      setVerified(true)
      setTimeout(() => navigate('/dashboard'), 1500)
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Verification failed')
    }
  })

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [countdown])

  const handleChange = (idx: number, val: string) => {
    if (!/^[0-9]?$/.test(val)) return
    const next = [...otp]
    next[idx] = val
    setOtp(next)
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus()
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = [...otp]
    pasted.split('').forEach((char, i) => { next[i] = char })
    setOtp(next)
    const lastIdx = Math.min(pasted.length, 5)
    inputRefs.current[lastIdx]?.focus()
  }

  const handleVerify = () => {
    const code = otp.join('')
    if (code.length === 6) {
      verifyOtp(code)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050B1A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes blob { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(20px,-20px) scale(1.05)} 66%{transform:translate(-15px,10px) scale(0.97)} }
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800&display=swap');
      `}</style>

      {/* Animated blobs */}
      <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'blob 10s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '-15%', right: '-10%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', filter: 'blur(80px)', animation: 'blob 13s ease-in-out infinite 4s' }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#7C3AED,#2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}>
            <Zap size={26} color="white" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Poppins, sans-serif', background: 'linear-gradient(135deg, #A78BFA, #60A5FA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NexusAI</h1>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: 40, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)', textAlign: 'center' }}>
          {verified ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={32} color="#22C55E" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: 'white', marginBottom: 8 }}>Email Verified!</h2>
              <p style={{ fontSize: 13, color: '#94A3B8' }}>Redirecting to dashboard...</p>
            </motion.div>
          ) : (
            <>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: 'white', marginBottom: 8 }}>Verify your email</h2>
              <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 4 }}>We sent a 6-digit code to</p>
              <p style={{ fontSize: 13, color: '#7C3AED', marginBottom: 32, fontWeight: 600 }}>{email}</p>

              {/* OTP Inputs */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    style={{
                      width: 44,
                      height: 52,
                      background: digit ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${digit ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.12)'}`,
                      borderRadius: 12,
                      color: 'white',
                      fontSize: 20,
                      fontWeight: 700,
                      textAlign: 'center',
                      outline: 'none',
                      padding: 0,
                      transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(124,58,237,0.6)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'
                      e.target.style.background = 'rgba(124,58,237,0.08)'
                    }}
                    onBlur={e => {
                      e.target.style.boxShadow = 'none'
                      if (!digit) {
                        e.target.style.borderColor = 'rgba(255,255,255,0.12)'
                        e.target.style.background = 'rgba(255,255,255,0.06)'
                      }
                    }}
                  />
                ))}
              </div>

              <motion.button
                whileHover={{ opacity: 0.9 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleVerify}
                disabled={isPending || otp.join('').length < 6}
                style={{ width: '100%', background: 'linear-gradient(135deg,#7C3AED,#2563EB)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, padding: '12px 0', borderRadius: 10, cursor: isPending ? 'wait' : 'pointer', marginBottom: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, opacity: otp.join('').length < 6 ? 0.5 : 1, boxShadow: '0 0 20px rgba(124,58,237,0.35)' }}
              >
                {isPending && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                Verify Email
              </motion.button>

              <div style={{ fontSize: 13, color: '#94A3B8' }}>
                Didn't receive code?{' '}
                {countdown > 0 ? (
                  <span style={{ color: '#64748B' }}>Resend in {countdown}s</span>
                ) : (
                  <button onClick={() => setCountdown(60)} style={{ background: 'none', border: 'none', color: '#7C3AED', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>Resend</button>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
