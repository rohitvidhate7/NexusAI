import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import api from '../../lib/api'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'One number', ok: /[0-9]/.test(password) },
    { label: 'One special character', ok: /[^a-zA-Z0-9]/.test(password) },
  ]

  const allValid = checks.every(c => c.ok) && confirmPassword === password && confirmPassword.length > 0

  const { mutate: resetPassword, isPending } = useMutation({
    mutationFn: async () => {
      const res = await api.post('/auth/reset-password', { token, newPassword: password })
      return res.data
    },
    onSuccess: () => {
      setSubmitted(true)
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to reset password')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      alert('Invalid or missing reset token')
      return
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    resetPassword()
  }

  const inputBase: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10,
    color: 'white',
    fontSize: 13,
    outline: 'none',
    transition: 'border 0.15s, box-shadow 0.15s',
    boxSizing: 'border-box',
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
      <div style={{ position: 'absolute', top: '30%', right: '5%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'blob 9s ease-in-out infinite 7s' }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
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
              <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: 'white', marginBottom: 8 }}>Password Reset Successful</h2>
              <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, marginBottom: 24 }}>
                Your password has been successfully updated.
              </p>
              <button
                onClick={() => navigate('/auth/login')}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#CBD5E1', fontSize: 13, fontWeight: 600, padding: '12px 0', borderRadius: 10, cursor: 'pointer' }}
              >
                Back to Login
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: 'white', marginBottom: 8 }}>Set new password</h2>
                <p style={{ fontSize: 13, color: '#64748B' }}>Please enter your new password below.</p>
              </div>

              {/* New Password */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="#64748B" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    required
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Create new password"
                    style={{ ...inputBase, padding: '11px 40px 11px 36px' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)' }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; e.target.style.boxShadow = 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Validation checklist */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                {checks.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < checks.length - 1 ? 8 : 0 }}>
                    <CheckCircle size={13} color={c.ok ? '#22C55E' : 'rgba(255,255,255,0.15)'} />
                    <span style={{ fontSize: 12, color: c.ok ? '#22C55E' : '#64748B', transition: 'color 0.2s' }}>{c.label}</span>
                  </div>
                ))}
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6 }}>Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} color="#64748B" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    required
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    style={{
                      ...inputBase,
                      padding: '11px 40px 11px 36px',
                      borderColor: confirmPassword && confirmPassword !== password ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.10)',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = confirmPassword !== password ? 'rgba(239,68,68,0.6)' : 'rgba(124,58,237,0.6)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = confirmPassword && confirmPassword !== password ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.10)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <div style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>Passwords do not match</div>
                )}
                {confirmPassword && confirmPassword === password && checks.every(c => c.ok) && (
                  <div style={{ fontSize: 11, color: '#22C55E', marginTop: 4 }}>Passwords match ✓</div>
                )}
              </div>

              <motion.button
                whileHover={{ opacity: allValid ? 0.9 : 1 }}
                whileTap={{ scale: allValid ? 0.98 : 1 }}
                disabled={isPending || !allValid}
                type="submit"
                style={{
                  width: '100%',
                  background: allValid ? 'linear-gradient(135deg,#7C3AED,#2563EB)' : 'rgba(255,255,255,0.06)',
                  border: allValid ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  color: allValid ? 'white' : '#64748B',
                  fontSize: 14,
                  fontWeight: 700,
                  padding: '12px 0',
                  borderRadius: 10,
                  cursor: allValid ? (isPending ? 'wait' : 'pointer') : 'not-allowed',
                  marginBottom: 16,
                  transition: 'background 0.2s, color 0.2s',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
                  boxShadow: allValid ? '0 0 20px rgba(124,58,237,0.35)' : 'none',
                }}
              >
                {isPending && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                Reset Password
              </motion.button>

              <div style={{ textAlign: 'center', fontSize: 13, color: '#64748B' }}>
                <Link to="/auth/login" style={{ color: '#7C3AED', textDecoration: 'none', fontWeight: 500 }}>Back to login</Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
