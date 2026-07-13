import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, User, Filter, SortAsc, UserPlus, MoreHorizontal, Loader2, X, Shield, Mail } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useWorkspace } from '../contexts/WorkspaceContext'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

// ─── Constants & Configurations ──────────────────────────────────────────────

const STATUS_CONFIG = {
  active: { label: 'active', color: '#22C55E', dot: '#22C55E' },
  away: { label: 'away', color: '#FBBF24', dot: '#FBBF24' },
  offline: { label: 'offline', color: '#64748B', dot: '#64748B' },
}

const WORKLOAD_CONFIG = (w: number) => {
  if (w >= 85) return { label: 'high', bg: 'rgba(239,68,68,0.15)', color: '#F87171' }
  if (w >= 60) return { label: 'medium', bg: 'rgba(245,158,11,0.15)', color: '#FBBF24' }
  return { label: 'low', bg: 'rgba(34,197,94,0.15)', color: '#22C55E' }
}

const ROLE_LABELS: Record<string, string> = {
  developer: 'Software Engineer',
  designer: 'Product Designer',
  qa: 'QA Engineer',
  project_manager: 'Product Manager',
  admin: 'Administrator',
  owner: 'Workspace Owner',
  member: 'Workspace Member',
  viewer: 'Guest Viewer',
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 }
  }
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring' as const, stiffness: 350, damping: 25 }
  }
} as const

// ─── MemberCard Component (3D Tilt Effect) ───────────────────────────────────

interface MemberCardProps {
  user: any
  index: number
  onViewProfile: (user: any) => void
  onMessage: (user: any) => void
}

const MemberCard = ({ user, index, onViewProfile, onMessage }: MemberCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const xc = rect.width / 2
    const yc = rect.height / 2
    const maxRot = 5
    const rotateX = ((yc - y) / yc) * maxRot
    const rotateY = ((x - xc) / xc) * maxRot
    setTilt({ rx: rotateX, ry: rotateY })
  }

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0 })
  }

  const statusCfg = STATUS_CONFIG[user.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.offline

  return (
    <motion.div
      ref={cardRef}
      variants={itemVariants}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ y: -3, scale: 1.01 }}
      style={{
        background: 'rgba(22, 27, 34, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: 18,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'border-color 0.25s, box-shadow 0.25s',
        transformStyle: 'preserve-3d',
        transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.25)'
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 15px rgba(139, 92, 246, 0.2)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
        e.currentTarget.style.boxShadow = 'none'
        handleMouseLeave()
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: user.color || 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: 'white',
            boxShadow: `0 0 12px ${user.color || '#8b5cf6'}40`
          }}>
            {user.initials || 'U'}
          </div>
          <div style={{
            position: 'absolute', bottom: 1, right: 1, width: 12, height: 12,
            borderRadius: '50%', background: statusCfg.dot, border: '2px solid rgba(8,12,28,0.9)',
            boxShadow: `0 0 6px ${statusCfg.dot}`
          }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'white', fontFamily: 'Poppins, sans-serif' }}>
            {user.name}
          </div>
          <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>
            {ROLE_LABELS[user.workspaceRole || user.role] || user.workspaceRole}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusCfg.dot }} />
          <span style={{ fontSize: 12, color: statusCfg.color, textTransform: 'capitalize' }}>
            {statusCfg.label}
          </span>
        </div>
        <span style={{ fontSize: 11, color: '#8b949e' }}>
          Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button 
          onClick={() => onMessage(user)}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#CBD5E1', fontSize: 11, fontWeight: 600, padding: '7px 0', borderRadius: 8,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        >
          <MessageSquare size={13} /> Message
        </button>
        <button 
          onClick={() => onViewProfile(user)}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#CBD5E1', fontSize: 11, fontWeight: 600, padding: '7px 0', borderRadius: 8,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
        >
          <User size={13} /> Profile
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main Team Page Component ────────────────────────────────────────────────

export default function Team() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspace()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // ─── Queries ───

  // Fetch workspace members list
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/workspaces/${activeWorkspaceId}/members`)
      return res.data
    },
    enabled: !!activeWorkspaceId
  })

  // Fetch all system users (for invite list selection)
  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const res = await api.get('/workspaces/users/all')
      return res.data
    }
  })

  // Invite Member Mutation
  const inviteMutation = useMutation({
    mutationFn: async (inviteData: any) => {
      const res = await api.post(`/workspaces/${activeWorkspaceId}/members`, inviteData)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', activeWorkspaceId] })
      toast.success('Member invited successfully!')
      setIsInviteModalOpen(false)
      setInviteForm({ userId: allUsers[0]?._id || '', role: 'developer' })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to invite user')
    }
  })

  // ─── Form State ───
  const [inviteForm, setInviteForm] = useState({
    userId: '', role: 'developer'
  })

  // Filter out users who are already workspace members
  const nonWorkspaceUsers = allUsers.filter((u: any) => 
    !members.some((m: any) => m._id === u._id)
  )

  useEffect(() => {
    if (nonWorkspaceUsers.length > 0 && !inviteForm.userId) {
      setInviteForm(prev => ({ ...prev, userId: nonWorkspaceUsers[0]._id }))
    }
  }, [nonWorkspaceUsers])

  if (!activeWorkspaceId) {
    return <div style={{ color: '#8b949e', padding: 40, textAlign: 'center' }}>Please select a workspace first.</div>
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
        <Loader2 size={32} className="animate-spin" color="#8b5cf6" />
      </div>
    )
  }

  // Filter members based on search
  const filteredMembers = members.filter((m: any) =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = members.filter((m: any) => m.status === 'active').length

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Dynamic Header */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Poppins, sans-serif' }}>Team Members</h2>
          <p style={{ fontSize: 12, color: '#8b949e', marginTop: 3 }}>
            Manage team assignments, invites, and status indicators.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Search bar input */}
          <input
            type="text"
            placeholder="Search member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'white', outline: 'none'
            }}
          />

          {/* Invite Trigger button */}
          <button
            onClick={() => setIsInviteModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              border: 'none', color: 'white', fontSize: 11, fontWeight: 700,
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 15px rgba(124,58,237,0.3)'
            }}
          >
            <UserPlus size={13} />
            Invite
          </button>
        </div>
      </motion.div>

      {/* Counter summary */}
      <div style={{ fontSize: 12, color: '#8b949e' }}>
        {filteredMembers.length} members found &bull; {activeCount} active now
      </div>

      {/* Member cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filteredMembers.map((member: any, i: number) => (
          <MemberCard key={member._id} user={member} index={i} />
        ))}
      </div>

      {/* Detailed List Table */}
      <div style={{
        background: 'rgba(22, 27, 34, 0.45)', border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', marginTop: 10
      }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'white', fontFamily: 'Poppins, sans-serif' }}>Workspace Workloads</span>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', textAlign: 'left' }}>
                {['Member', 'Status', 'Workload Rating', 'Email'].map(h => (
                  <th key={h} style={{ padding: '10px 20px', fontSize: 10, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((user: any, i: number) => {
                const statusCfg = STATUS_CONFIG[user.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.offline
                const workloadVal = user.workload || Math.floor(Math.random() * 40) + 40
                const wlCfg = WORKLOAD_CONFIG(workloadVal)
                return (
                  <tr key={user._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', background: user.color || '#8b5cf6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: 'white'
                        }}>{user.initials || 'U'}</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>{user.name}</div>
                          <div style={{ fontSize: 11, color: '#8b949e' }}>{ROLE_LABELS[user.workspaceRole || user.role] || user.workspaceRole}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusCfg.dot }} />
                        <span style={{ fontSize: 12, color: statusCfg.color, textTransform: 'capitalize' }}>{statusCfg.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ background: wlCfg.bg, color: wlCfg.color, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, textTransform: 'uppercase' }}>
                        {wlCfg.label} ({workloadVal}%)
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 12, color: '#8b949e' }}>
                      {user.email || 'No email registered'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Member Modal Dialog */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(10, 11, 20, 0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: 20
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              style={{
                background: 'rgba(22, 27, 34, 0.92)', border: '1px solid rgba(139, 92, 246, 0.25)',
                borderRadius: 16, width: '100%', maxWidth: 400, padding: 20,
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.15)',
                color: '#e6edf3'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Invite Workspace Member</span>
                <button onClick={() => setIsInviteModalOpen(false)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                inviteMutation.mutate(inviteForm);
              }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Select User to Invite</label>
                  <select
                    value={inviteForm.userId}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, userId: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(22,27,34,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white' }}
                  >
                    {nonWorkspaceUsers.length === 0 ? (
                      <option value="">No new users to invite</option>
                    ) : (
                      nonWorkspaceUsers.map((u: any) => (
                        <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Workspace Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(22,27,34,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white' }}
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="project_manager">Project Manager</option>
                    <option value="developer">Developer</option>
                    <option value="qa">QA Engineer</option>
                    <option value="designer">Designer</option>
                    <option value="guest">Guest</option>
                  </select>
                </div>

                <button
                  type="submit" disabled={inviteMutation.isPending}
                  style={{
                    marginTop: 10, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                    border: 'none', color: 'white', padding: '8px 0', borderRadius: 8,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s'
                  }}
                >
                  {inviteMutation.isPending ? 'Inviting...' : 'Invite Member'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
