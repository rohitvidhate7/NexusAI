import { useState, useEffect, useRef } from 'react'
import { Bell, Command, Sparkles, LogOut, Settings } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'

export default function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { activeWorkspaceId } = useWorkspace()

  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [askAiLoading, setAskAiLoading] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Click outside listener to close dropdowns
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [])

  const getPageInfo = () => {
    const greeting = user ? `Good morning, ${user.name.split(' ')[0]}!` : 'Good morning!'
    const pageTitles: Record<string, { title: string; subtitle: string }> = {
      '/dashboard': { title: 'Dashboard', subtitle: `${greeting} Here's what's happening today.` },
      '/board': { title: 'Board', subtitle: 'Sprint 12 · Task Board' },
      '/projects': { title: 'Projects', subtitle: 'Manage and track all active projects' },
      '/tasks': { title: 'My Tasks', subtitle: 'Track and manage your work' },
      '/calendar': { title: 'Calendar', subtitle: 'December 2024' },
      '/chat': { title: 'Chat', subtitle: 'Team collaboration' },
      '/team': { title: 'Team', subtitle: 'Manage team members and roles' },
      '/reports': { title: 'Reports', subtitle: 'Analytics and performance metrics' },
      '/files': { title: 'Files', subtitle: 'Manage project files and assets' },
      '/ai': { title: 'AI Assistant', subtitle: 'Powered by NexusAI · Always learning' },
    }
    return pageTitles[location.pathname] || { title: 'NexusAI', subtitle: '' }
  }

  const page = getPageInfo()

  const mockNotifications = [
    { id: '1', title: 'Task Assigned', message: 'Sarah K. assigned you "Implement dark mode"', time: '5m ago' },
    { id: '2', title: 'Sprint Started', message: 'Sprint 12 has been officially launched', time: '1h ago' },
    { id: '3', title: 'New Comment', message: 'Marcus commented on "Optimize database queries"', time: '2h ago' }
  ]

  const handleAskAi = () => {
    window.dispatchEvent(new CustomEvent('toggle-ai-assistant'))
  }

  return (
    <header
      style={{
        height: 56,
        backgroundColor: 'var(--bg-nav)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 50,
      }}
    >
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <h1
          style={{
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1,
            fontFamily: 'Poppins, sans-serif',
            background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {page.title}
        </h1>
        {page.subtitle && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, fontFamily: 'Inter, sans-serif' }}>
            {page.subtitle}
          </p>
        )}
      </motion.div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Ask AI Button */}
        <motion.button
          whileHover={{ scale: askAiLoading ? 1 : 1.03 }}
          whileTap={{ scale: askAiLoading ? 1 : 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          onClick={handleAskAi}
          disabled={askAiLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
            border: 'none',
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            padding: '6px 14px',
            borderRadius: 10,
            cursor: askAiLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(124,58,237,0.25)',
            transition: 'opacity 0.2s',
            fontFamily: 'Inter, sans-serif',
            opacity: askAiLoading ? 0.8 : 1,
            outline: 'none',
          }}
          className="focus-visible:ring-2 focus-visible:ring-purple-500/50"
        >
          {askAiLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Sparkles size={13} />
          )}
          {askAiLoading ? 'Analyzing...' : 'Ask AI'}
        </motion.button>
        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowProfileMenu(false)
            }}
            style={{
              position: 'relative',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-hover)'
              e.currentTarget.style.color = 'var(--text-primary)'
              e.currentTarget.style.borderColor = 'var(--border-hover)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
            aria-label="Notifications"
            aria-expanded={showNotifications}
            className="focus-visible:ring-2 focus-visible:ring-purple-500/50"
          >
            <Bell size={17} />
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 7,
                height: 7,
                background: '#EF4444',
                borderRadius: '50%',
                border: '1.5px solid var(--bg-primary)',
                boxShadow: '0 0 6px rgba(239,68,68,0.4)',
              }}
            />
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                style={{
                  position: 'absolute', right: 0, top: 40, width: 320,
                  backgroundColor: 'var(--bg-nav)', backdropFilter: 'blur(28px)',
                  WebkitBackdropFilter: 'blur(28px)',
                  border: '1px solid var(--border)', borderRadius: 12, padding: 12,
                  boxShadow: 'var(--shadow-lg)', zIndex: 100
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', fontFamily: 'Poppins, sans-serif' }}>Notifications</span>
                  <button style={{ background: 'none', border: 'none', fontSize: 11, color: '#7C3AED', fontWeight: 600, cursor: 'pointer' }}>Mark all read</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {mockNotifications.map(n => (
                    <div 
                      key={n.id} 
                      style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s' }} 
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} 
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      tabIndex={0}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>{n.title}</span>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{n.time}</span>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar & Profile Dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setShowProfileMenu(!showProfileMenu)
              setShowNotifications(false)
            }}
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                setShowProfileMenu(!showProfileMenu)
                setShowNotifications(false)
              }
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: user?.color || 'linear-gradient(135deg, #7C3AED, #2563EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 0 0 2px rgba(124,58,237,0)',
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
            }}
            className="focus-visible:ring-2 focus-visible:ring-purple-500/50"
          >
            {user?.initials || 'U'}
          </motion.div>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                style={{
                  position: 'absolute', right: 0, top: 40, width: 200,
                  backgroundColor: 'var(--bg-nav)', backdropFilter: 'blur(28px)',
                  WebkitBackdropFilter: 'blur(28px)',
                  border: '1px solid var(--border)', borderRadius: 12, padding: 8,
                  boxShadow: 'var(--shadow-lg)', zIndex: 100
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 8px 8px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <button 
                    onClick={() => {
                      setShowProfileMenu(false)
                      navigate('/workspaces')
                    }} 
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', textAlign: 'left', padding: '6px 8px', borderRadius: 6, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', transition: 'background 0.2s', width: '100%', outline: 'none' }} 
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} 
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    className="focus-visible:bg-[var(--bg-hover)]"
                  >
                    <Settings size={13} />
                    Workspaces
                  </button>
                  <button 
                    onClick={() => {
                      setShowProfileMenu(false)
                      logout()
                    }} 
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', textAlign: 'left', padding: '6px 8px', borderRadius: 6, color: '#EF4444', fontSize: 12, cursor: 'pointer', transition: 'background 0.2s', width: '100%', outline: 'none' }} 
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'} 
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    className="focus-visible:bg-[var(--bg-hover)]"
                  >
                    <LogOut size={13} />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
