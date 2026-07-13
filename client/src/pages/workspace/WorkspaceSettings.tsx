import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Settings, Users, CreditCard, Zap, Shield, AlertTriangle, Upload, ArrowLeft, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'integrations', label: 'Integrations', icon: Zap },
  { id: 'security', label: 'Security', icon: Shield },
]

export default function WorkspaceSettings() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState('general')
  const [wsName, setWsName] = useState('')
  const [wsDescription, setWsDescription] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace', id],
    queryFn: async () => {
      const res = await api.get(`/workspaces/${id}`)
      return res.data
    },
    enabled: !!id
  })

  useEffect(() => {
    if (workspace) {
      setWsName(workspace.name || '')
      setWsDescription(workspace.description || '')
    }
  }, [workspace])

  const updateMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await api.put(`/workspaces/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      toast.success('Workspace updated')
      queryClient.invalidateQueries({ queryKey: ['workspace', id] })
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update workspace')
    }
  })

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="lucide-spin" color="#8b5cf6" />
      </div>
    )
  }

  if (!workspace) {
    return <div style={{ color: 'white', padding: 40 }}>Workspace not found.</div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0d1117', display: 'flex' }}>
      {/* Left sidebar */}
      <div style={{ width: 220, background: '#161b22', borderRight: '1px solid #21262d', padding: '20px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 8px 20px' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${workspace.color}, ${workspace.color}aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={16} color="white" /></div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>{workspace.name}</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 6 }}>Workspace Settings</div>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeTab === tab.id ? 'rgba(139,92,246,0.12)' : 'transparent',
              color: activeTab === tab.id ? '#a78bfa' : '#8b949e',
              fontSize: 13, fontWeight: 500, marginBottom: 2, textAlign: 'left',
            }}
          >
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 40, overflowY: 'auto' }}>
        <button onClick={() => navigate('/workspaces')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: 12, marginBottom: 24, padding: 0 }}><ArrowLeft size={13} />Back to workspaces</button>

        {activeTab === 'general' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3', marginBottom: 4 }}>General</h2>
            <p style={{ fontSize: 13, color: '#8b949e', marginBottom: 28 }}>Manage your workspace settings</p>

            <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 16 }}>Workspace Details</h3>
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${workspace.color}, ${workspace.color}aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: 'white' }}>{workspace.initials}</div>
                <button style={{ background: '#21262d', border: '1px solid #30363d', color: '#e6edf3', fontSize: 12, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Upload size={13} />Upload Logo</button>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', display: 'block', marginBottom: 6 }}>Workspace Name</label>
                <input value={wsName} onChange={e => setWsName(e.target.value)}
                  style={{ width: '100%', maxWidth: 400, background: '#1c2128', border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3', fontSize: 13, padding: '10px 12px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
                  onBlur={e => (e.target.style.borderColor = '#30363d')}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', display: 'block', marginBottom: 6 }}>Description</label>
                <textarea value={wsDescription} onChange={e => setWsDescription(e.target.value)}
                  rows={3}
                  style={{ width: '100%', maxWidth: 400, background: '#1c2128', border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3', fontSize: 13, padding: '10px 12px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                  onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
                  onBlur={e => (e.target.style.borderColor = '#30363d')}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setWsName(workspace.name); setWsDescription(workspace.description); }} style={{ background: '#21262d', border: '1px solid #30363d', color: '#e6edf3', fontSize: 13, fontWeight: 500, padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
                <motion.button 
                  onClick={() => updateMutation.mutate({ name: wsName, description: wsDescription })}
                  disabled={updateMutation.isPending}
                  whileHover={{ opacity: 0.9 }} 
                  style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, padding: '8px 20px', borderRadius: 8, cursor: 'pointer', opacity: updateMutation.isPending ? 0.7 : 1 }}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            </div>

            {/* Allow settings toggles */}
            <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 16 }}>Permissions</h3>
              {[
                { label: 'Allow members to invite others', defaultOn: true },
                { label: 'Allow public link sharing', defaultOn: false },
              ].map((perm, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i === 0 ? '1px solid #21262d' : 'none' }}>
                  <span style={{ fontSize: 13, color: '#e6edf3' }}>{perm.label}</span>
                  <ToggleSwitch defaultOn={perm.defaultOn} />
                </div>
              ))}
            </div>

            {/* Danger Zone */}
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><AlertTriangle size={16} color="#ef4444" /><h3 style={{ fontSize: 14, fontWeight: 600, color: '#ef4444' }}>Danger Zone</h3></div>
              <p style={{ fontSize: 13, color: '#8b949e', marginBottom: 14 }}>Permanently delete this workspace and all its data. This action cannot be undone.</p>
              <button style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Delete Workspace</button>
            </div>
          </motion.div>
        )}

        {activeTab !== 'general' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🚧</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e6edf3', marginBottom: 8, textTransform: 'capitalize' }}>{activeTab} Settings</h3>
            <p style={{ fontSize: 13, color: '#8b949e' }}>This section is coming soon.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function ToggleSwitch({ defaultOn }: { defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div
      onClick={() => setOn(!on)}
      style={{
        width: 36, height: 20, borderRadius: 10, cursor: 'pointer', position: 'relative',
        background: on ? '#8b5cf6' : '#30363d', transition: 'background 0.2s',
      }}
    >
      <div style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
    </div>
  )
}
