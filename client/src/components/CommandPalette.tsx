import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FolderOpen, CheckSquare, Users, FolderClosed, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useWorkspace } from '../contexts/WorkspaceContext'
import api from '../lib/api'

export default function CommandPalette() {
  const navigate = useNavigate()
  const { activeWorkspaceId } = useWorkspace()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen to keyboard shortcut (Ctrl+K or Cmd+K) and custom toggle events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    const handleToggle = () => {
      setIsOpen((prev) => !prev)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('toggle-command-palette', handleToggle)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('toggle-command-palette', handleToggle)
    }
  }, [])

  // Auto-focus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
    }
  }, [isOpen])

  // ─── Queries ───

  // Fetch Projects in workspace
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/projects?workspaceId=${activeWorkspaceId}`)
      return res.data
    },
    enabled: isOpen && !!activeWorkspaceId
  })

  // Fetch Tasks in workspace
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/tasks?workspaceId=${activeWorkspaceId}`)
      return res.data
    },
    enabled: isOpen && !!activeWorkspaceId
  })

  // Fetch Members in workspace
  const { data: members = [] } = useQuery({
    queryKey: ['members', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/workspaces/${activeWorkspaceId}/members`)
      return res.data
    },
    enabled: isOpen && !!activeWorkspaceId
  })

  // Fetch Documents in workspace
  const { data: documents = [] } = useQuery({
    queryKey: ['documents', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/upload/documents?workspaceId=${activeWorkspaceId}`)
      return res.data
    },
    enabled: isOpen && !!activeWorkspaceId
  })

  // Filter items matching query
  const filteredProjects = query
    ? projects.filter((p: any) => p.name?.toLowerCase().includes(query.toLowerCase()))
    : projects.slice(0, 3)

  const filteredTasks = query
    ? tasks.filter((t: any) => t.title?.toLowerCase().includes(query.toLowerCase()))
    : tasks.slice(0, 3)

  const filteredMembers = query
    ? members.filter((m: any) => m.name?.toLowerCase().includes(query.toLowerCase()))
    : members.slice(0, 3)

  const filteredDocs = query
    ? documents.filter((d: any) => d.name?.toLowerCase().includes(query.toLowerCase()))
    : documents.slice(0, 3)

  const hasResults = filteredProjects.length > 0 || filteredTasks.length > 0 || filteredMembers.length > 0 || filteredDocs.length > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(10, 11, 20, 0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', zIndex: 2000, paddingTop: '15vh',
            paddingLeft: 20, paddingRight: 20
          }}
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -15 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(22, 27, 34, 0.92)', border: '1px solid rgba(139, 92, 246, 0.25)',
              borderRadius: 16, width: '100%', maxWidth: 600, maxHeight: '60vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.15)',
              overflow: 'hidden', color: '#e6edf3'
            }}
          >
            {/* Search Input Box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search anything (tasks, projects, team members, files)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ flex: 1, background: 'none', border: 'none', color: 'white', fontSize: 13, outline: 'none' }}
              />
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#8b949e', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Results Panel */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!hasResults ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#8b949e', fontSize: 12 }}>
                  No matches found for "{query}"
                </div>
              ) : (
                <>
                  {/* Projects section */}
                  {filteredProjects.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Projects</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {filteredProjects.map((p: any) => (
                          <div
                            key={p._id}
                            onClick={() => { navigate('/projects'); setIsOpen(false); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <FolderOpen size={13} color="#8b5cf6" />
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tasks section */}
                  {filteredTasks.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Tasks</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {filteredTasks.map((t: any) => (
                          <div
                            key={t._id}
                            onClick={() => { navigate('/tasks'); setIsOpen(false); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <CheckSquare size={13} color="#3b82f6" />
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{t.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Members section */}
                  {filteredMembers.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Members</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {filteredMembers.map((m: any) => (
                          <div
                            key={m._id}
                            onClick={() => { navigate('/team'); setIsOpen(false); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <Users size={13} color="#10b981" />
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Files section */}
                  {filteredDocs.length > 0 && (
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Files</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {filteredDocs.map((d: any) => (
                          <div
                            key={d._id}
                            onClick={() => { navigate('/files'); setIsOpen(false); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <FolderClosed size={13} color="#f59e0b" />
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{d.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* command footer */}
            <div style={{ background: 'rgba(0, 0, 0, 0.2)', padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#8b949e' }}>
              <span>Use arrows to navigate, Enter to select</span>
              <span>Esc to close</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
