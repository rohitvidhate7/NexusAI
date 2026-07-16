import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, FolderOpen, CheckSquare, Kanban, Calendar,
  MessageSquare, Users, BarChart3, FolderClosed, ChevronDown,
  Search, FileBarChart, ChevronRight, Plus, Zap, Brain, LogOut
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderOpen, label: 'Projects', badge: 12 },
  { to: '/tasks', icon: CheckSquare, label: 'My Tasks', badge: 8 },
  { to: '/board', icon: Kanban, label: 'Board' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/chat', icon: MessageSquare, label: 'Chat', badge: 2 },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/files', icon: FolderClosed, label: 'Files' },
]

const recentProjects = [
  { name: 'Mobile App v2.0', progress: 68, color: '#7C3AED' },
  { name: 'API Redesign', progress: 42, color: '#EF4444' },
  { name: 'Design System', progress: 85, color: '#22C55E' },
]

const sectionLabelStyle = {
  fontSize: 10,
  fontWeight: 700,
  color: 'var(--text-muted)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { activeWorkspaceId } = useWorkspace()

  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces')
      return res.data
    }
  })

  const activeWorkspace = workspaces.find((w: any) => w._id === activeWorkspaceId)
  const workspaceName = activeWorkspace?.name || 'Select Workspace'
  const workspaceInitials = activeWorkspace?.initials || '??'
  const workspaceColor = activeWorkspace?.color || '#7C3AED'

  // Fetch projects count
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/projects?workspaceId=${activeWorkspaceId}`)
      return res.data
    },
    enabled: !!activeWorkspaceId
  })

  // Fetch tasks count
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/tasks?workspaceId=${activeWorkspaceId}`)
      return res.data
    },
    enabled: !!activeWorkspaceId
  })

  // Fetch chat channels count
  const { data: channels = [] } = useQuery({
    queryKey: ['channels', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/chat/channels?workspaceId=${activeWorkspaceId}`)
      return res.data
    },
    enabled: !!activeWorkspaceId
  })

  const getBadgeValue = (label: string) => {
    if (label === 'Projects') return projects.length
    if (label === 'My Tasks') {
      const currentUserId = user?.id || (user as any)?._id || ''
      return tasks.filter((t: any) => {
        const assigneeId = (t.assignee?._id || t.assignee?.id || t.assignee || '').toString().toLowerCase()
        return assigneeId === currentUserId.toLowerCase() && t.status !== 'done'
      }).length
    }
    if (label === 'Chat') return channels.length
    return undefined
  }

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setCollapsed(true)
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 220 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      style={{
        minWidth: collapsed ? 64 : 220,
        backgroundColor: 'var(--bg-nav)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 12px', borderBottom: '1px solid var(--border)', minHeight: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: 28, height: 28, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
              boxShadow: '0 4px 12px rgba(124,58,237,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Zap size={14} color="white" strokeWidth={2.5} />
          </motion.div>
          {!collapsed && (
            <span style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 800,
              fontSize: 16,
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              NexusAI
            </span>
          )}
        </div>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', padding: 4, borderRadius: 4, flexShrink: 0,
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-hover)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            (e.currentTarget as HTMLButtonElement).style.background = 'none';
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronRight size={14} style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }} />
        </motion.button>
      </div>

      {/* Workspace selector */}
      {!collapsed && (
        <div style={{ padding: '8px 8px 4px' }}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate('/workspaces')
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
              transition: 'background 0.15s', color: 'var(--text-secondary)',
              outline: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            className="focus-visible:ring-1 focus-visible:ring-purple-500/40"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: `linear-gradient(135deg, ${workspaceColor}, ${workspaceColor}dd)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: 'white',
              }}>{workspaceInitials}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{workspaceName}</span>
            </div>
            <ChevronDown size={12} color="var(--text-muted)" />
          </motion.div>
        </div>
      )}

      {/* Search */}
      {!collapsed && (
        <div style={{ padding: '4px 8px 8px' }}>
          <motion.div 
            whileTap={{ scale: 0.99 }}
            tabIndex={0}
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-command-palette'))}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                window.dispatchEvent(new CustomEvent('toggle-command-palette'))
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(15, 23, 42, 0.03)', borderRadius: 8, padding: '6px 10px',
              border: '1px solid var(--border)', cursor: 'pointer',
              outline: 'none',
            }}
            className="focus-visible:ring-1 focus-visible:ring-purple-500/40"
          >
            <Search size={13} color="var(--text-muted)" />
            <span style={{ fontSize: 13, color: 'var(--text-muted)', flex: 1 }}>Search...</span>
            <span style={{
              fontSize: 10, color: 'var(--text-muted)',
              background: 'rgba(124, 58, 237, 0.08)', padding: '1px 5px', borderRadius: 4,
            }}>⌘K</span>
          </motion.div>
        </div>
      )}

      {/* Nav - MAIN */}
      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 8 }}>
        {!collapsed && (
          <div style={{ padding: '8px 16px 4px', ...sectionLabelStyle }}>
            MAIN
          </div>
        )}
        {navItems.map(({ to, icon: Icon, label }) => {
          const badgeValue = getBadgeValue(label)
          return (
            <motion.div
              key={to}
              whileHover={{ scale: 1.02, x: 2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              style={{ width: '100%', outline: 'none' }}
            >
              <NavLink
                to={to}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', margin: '1px 8px', borderRadius: 8,
                  color: isActive ? '#7C3AED' : 'var(--text-muted)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.06))'
                    : 'transparent',
                  borderRight: isActive ? '2px solid #7C3AED' : '2px solid transparent',
                  textDecoration: 'none', fontSize: 13, fontWeight: 500,
                  transition: 'all 0.15s', position: 'relative',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  outline: 'none',
                })}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  if (!el.classList.contains('active') && !el.getAttribute('aria-current')) {
                    el.style.background = 'var(--bg-hover)'
                    el.style.color = 'var(--text-secondary)'
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  if (!el.classList.contains('active') && !el.getAttribute('aria-current')) {
                    el.style.background = 'transparent'
                    el.style.color = 'var(--text-muted)'
                  }
                }}
                className="focus-visible:ring-1 focus-visible:ring-purple-500/40"
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div style={{
                        position: 'absolute', left: 0, top: 4, bottom: 4,
                        width: 3,
                        background: 'linear-gradient(180deg, #7C3AED, #2563EB)',
                        borderRadius: '0 3px 3px 0',
                      }} />
                    )}
                    <Icon size={15} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0, color: isActive ? '#7C3AED' : 'inherit' }} />
                    {!collapsed && (
                      <>
                        <span style={{ flex: 1 }}>{label}</span>
                        {badgeValue !== undefined && badgeValue > 0 && (
                          <span style={{
                            background: isActive ? 'rgba(124,58,237,0.15)' : 'rgba(15, 23, 42, 0.05)',
                            color: isActive ? '#7C3AED' : 'var(--text-muted)',
                            fontSize: 10, fontWeight: 600, padding: '1px 6px',
                            borderRadius: 100, minWidth: 20, textAlign: 'center',
                          }}>{badgeValue}</span>
                        )}
                      </>
                    )}
                  </>
                )}
              </NavLink>
            </motion.div>
          )
        })}

        {/* AI Features */}
        {!collapsed && (
          <div style={{ padding: '12px 16px 4px', ...sectionLabelStyle }}>
            AI FEATURES
          </div>
        )}
        <motion.div
          whileHover={{ scale: 1.02, x: 2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          style={{ width: '100%', outline: 'none' }}
        >
          <NavLink to="/ai"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 10px', margin: '1px 8px', borderRadius: 8,
              color: isActive ? '#7C3AED' : 'var(--text-muted)',
              background: isActive
                ? 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.06))'
                : 'transparent',
              borderRight: isActive ? '2px solid #7C3AED' : '2px solid transparent',
              textDecoration: 'none', fontSize: 13, fontWeight: 500,
              transition: 'all 0.15s', position: 'relative', whiteSpace: 'nowrap',
              outline: 'none',
            })}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              if (!el.classList.contains('active') && !el.getAttribute('aria-current')) {
                el.style.background = 'var(--bg-hover)'
                el.style.color = 'var(--text-secondary)'
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              if (!el.classList.contains('active') && !el.getAttribute('aria-current')) {
                el.style.background = 'transparent'
                el.style.color = 'var(--text-muted)'
              }
            }}
            className="focus-visible:ring-1 focus-visible:ring-purple-500/40"
          >
            {({ isActive }) => (
              <>
                {isActive && <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 3, background: 'linear-gradient(180deg, #7C3AED, #2563EB)', borderRadius: '0 3px 3px 0' }} />}
                <Brain size={15} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0, color: isActive ? '#7C3AED' : 'inherit' }} />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1 }}>AI Assistant</span>
                    <span style={{ background: 'linear-gradient(135deg,#7C3AED,#2563EB)', color: 'white', fontSize: 9, fontWeight: 800, padding: '2px 5px', borderRadius: 4, boxShadow: '0 2px 8px rgba(124,58,237,0.2)' }}>NEW</span>
                  </>
                )}
              </>
            )}
          </NavLink>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, x: 2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          style={{ width: '100%', outline: 'none' }}
        >
          <NavLink to="/reports"
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 10px', margin: '1px 8px', borderRadius: 8,
              color: isActive ? '#7C3AED' : 'var(--text-muted)',
              background: isActive
                ? 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(37,99,235,0.06))'
                : 'transparent',
              borderRight: isActive ? '2px solid #7C3AED' : '2px solid transparent',
              textDecoration: 'none', fontSize: 13, fontWeight: 500,
              transition: 'all 0.15s', position: 'relative', whiteSpace: 'nowrap',
              outline: 'none',
            })}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLAnchorElement
              if (!el.classList.contains('active') && !el.getAttribute('aria-current')) {
                el.style.background = 'var(--bg-hover)'
                el.style.color = 'var(--text-secondary)'
              }
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLAnchorElement
              if (!el.classList.contains('active') && !el.getAttribute('aria-current')) {
                el.style.background = 'transparent'
                el.style.color = 'var(--text-muted)'
              }
            }}
            className="focus-visible:ring-1 focus-visible:ring-purple-500/40"
          >
            {({ isActive }) => (
              <>
                {isActive && <div style={{ position: 'absolute', left: 0, top: 4, bottom: 4, width: 3, background: 'linear-gradient(180deg, #7C3AED, #2563EB)', borderRadius: '0 3px 3px 0' }} />}
                <FileBarChart size={15} strokeWidth={isActive ? 2.5 : 2} style={{ flexShrink: 0, color: isActive ? '#7C3AED' : 'inherit' }} />
                {!collapsed && <span>AI Reports</span>}
              </>
            )}
          </NavLink>
        </motion.div>


      </div>

      {/* User Profile */}
      <div style={{
        borderTop: '1px solid var(--border)', padding: '10px 8px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          style={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
            background: user?.color || 'linear-gradient(135deg, #7C3AED, #2563EB)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'white',
          }}
        >
          <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            {user?.initials || 'U'}
          </div>
        </motion.div>
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user?.role ? user.role.replace('_', ' ') : 'Member'}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => logout()}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, transition: 'color 0.15s', display: 'flex', alignItems: 'center', outline: 'none' }}
              title="Logout"
              onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              className="focus-visible:ring-1 focus-visible:ring-red-500/40 rounded"
            >
              <LogOut size={14} />
            </motion.button>
          </>
        )}
      </div>
    </motion.aside>
  )
}
