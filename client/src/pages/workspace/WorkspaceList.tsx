import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, MoreHorizontal, Users, Search, Zap, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { useWorkspace } from '../../contexts/WorkspaceContext'

export default function WorkspaceList() {
  const navigate = useNavigate()
  const { setActiveWorkspaceId } = useWorkspace()
  
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces');
      return res.data;
    }
  });

  const handleWorkspaceClick = (id: string) => {
    setActiveWorkspaceId(id);
    navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0d1117', padding: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#e6edf3' }}>My Workspaces</h1>
            <p style={{ fontSize: 12, color: '#8b949e' }}>Select or create a workspace to continue</p>
          </div>
        </div>
        <motion.button
          whileHover={{ y: -2 }}
          onClick={() => navigate('/workspaces/create')}
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, padding: '10px 18px', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        ><Plus size={15} />Create Workspace</motion.button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 24 }}>
        <Search size={14} color="#484f58" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input placeholder="Search workspaces..." style={{ width: '100%', background: '#161b22', border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3', fontSize: 13, padding: '9px 12px 9px 36px', outline: 'none' }} onFocus={e => (e.target.style.borderColor = '#8b5cf6')} onBlur={e => (e.target.style.borderColor = '#30363d')} />
      </div>

      {/* Workspaces Grid */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader2 size={24} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : workspaces.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#1c2128', borderRadius: 16, border: '1px dashed #30363d' }}>
          <p style={{ color: '#8b949e' }}>You don't have any workspaces yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {workspaces.map((ws: any, i: number) => (
            <motion.div
              key={ws._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4, boxShadow: '0 0 0 1px rgba(139,92,246,0.3), 0 8px 24px rgba(0,0,0,0.4)' }}
            onClick={() => handleWorkspaceClick(ws._id)}
            style={{
              background: '#1c2128', border: '1px solid #30363d', borderRadius: 14,
              padding: 20, cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
              opacity: ws.status === 'archived' ? 0.6 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `linear-gradient(135deg, ${ws.color}, ${ws.color}aa)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 800, color: 'white',
                }}>{ws.initials}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>{ws.name}</div>
                  <div style={{ fontSize: 12, color: '#8b949e' }}>{ws.slug}</div>
                </div>
              </div>
              <button onClick={e => e.stopPropagation()} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', padding: 4 }}><MoreHorizontal size={16} /></button>
            </div>

            {ws.description && <p style={{ fontSize: 12, color: '#8b949e', marginBottom: 14, lineHeight: 1.5 }}>{ws.description}</p>}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Users size={13} color="#8b949e" />
                <span style={{ fontSize: 12, color: '#8b949e' }}>{ws.members.length} members</span>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100,
                background: ws.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(72,79,88,0.3)',
                color: ws.status === 'active' ? '#34d399' : '#8b949e',
              }}>{ws.status === 'active' ? 'Active' : 'Archived'}</span>
            </div>
          </motion.div>
        ))}
        </div>
      )}
    </div>
  )
}
