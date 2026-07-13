import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import api from '../../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const navigate = useNavigate()

  const { mutate: sendResetLink, isPending } = useMutation({
    mutationFn: async (emailAddress: string) => {
      const res = await api.post('/auth/forgot-password', { email: emailAddress })
      return res.data
    },
    onSuccess: () => {
      setSubmitted(true)
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to send reset link')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    sendResetLink(email)
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
      <div style={{ position: 'absolute', top: '50%', left: '60%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'blob 9s ease-in-out infinite 7s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#7C3AED,#2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}>
            <Zap size={26} color="white" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Poppins, sans-serif', background: 'linear-gradient(135deg, #A78BFA, #60A5FA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>NexusAI</h1>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, padding: 40, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.45)' }}>
          {submitted ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={32} color="#22C55E" />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: 'white', marginBottom: 8 }}>Check your email</h2>
              <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, marginBottom: 24 }}>
                We've sent a password reset link to <br />
                <strong style={{ color: 'white' }}>{email}</strong>
              </p>
              <button
                onClick={() => navigate('/auth/login')}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#CBD5E1', fontSize: 13, fontWeight: 600, padding: '12px 0', borderRadius: 10, cursor: 'pointer' }}
              >
                Back to Login
              </button>
            </motion.div>
          ) : (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: 'white', marginBottom: 8 }}>Reset your password</h2>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>Enter your email and we'll send you a link to reset your password.</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94A3B8', marginBottom: 8 }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#64748B" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, color: 'white', fontSize: 14, padding: '11px 14px 11px 44px', outline: 'none', boxSizing: 'border-box', transition: 'border 0.15s, box-shadow 0.15s' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)' }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; e.target.style.boxShadow = 'none' }}
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ opacity: 0.9 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isPending}
                  type="submit"
                  style={{ width: '100%', background: 'linear-gradient(135deg,#7C3AED,#2563EB)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, padding: '12px 0', borderRadius: 10, cursor: isPending ? 'wait' : 'pointer', marginBottom: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, boxShadow: '0 0 20px rgba(124,58,237,0.35)' }}
                >
                  {isPending && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  Send Reset Link
                </motion.button>

                <div style={{ textAlign: 'center' }}>
                  <Link to="/auth/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
                    <ArrowLeft size={14} />
                    Back to Login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
