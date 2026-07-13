import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Filter, SortAsc, Plus, Calendar, CheckSquare, Loader2,
  MoreVertical, Edit2, Trash2, X, ChevronDown, Check, Folder
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useWorkspace } from '../contexts/WorkspaceContext'
import toast from 'react-hot-toast'

// ─── Constants & Configuration ──────────────────────────────────────────────

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  on_track: { label: 'On Track', bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
  at_risk: { label: 'At Risk', bg: 'rgba(245,158,11,0.15)', color: '#FBBF24' },
  behind: { label: 'Behind', bg: 'rgba(239,68,68,0.15)', color: '#F87171' },
  completed: { label: 'Completed', bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
}

const PROJECT_ICONS = ['📱', '⚙️', '🎨', '🔄', '🔐', '📊', '🌐', '🚀', '🛠️']
const PROJECT_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    }
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

// ─── Project Card Component (3D Tilt & Options Popup) ───────────────────────

interface ProjectCardProps {
  project: any
  index: number
  onEdit: (project: any) => void
  onDelete: (id: string) => void
}

const ProjectCard = ({ project, index, onEdit, onDelete }: ProjectCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Handle outside click to close options menu
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [showMenu])

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

  const status = statusConfig[project.status] ?? statusConfig['on_track']

  return (
    <motion.div
      ref={cardRef}
      variants={itemVariants}
      onMouseMove={handleMouseMove}
      whileHover={{ y: -4, scale: 1.01 }}
      style={{
        background: 'rgba(22, 27, 34, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: 18,
        position: 'relative',
        cursor: 'pointer',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition: 'border-color 0.25s, box-shadow 0.25s',
        transformStyle: 'preserve-3d',
        transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.25)'
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 15px rgba(139, 92, 246, 0.2)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
        e.currentTarget.style.boxShadow = 'none'
        handleMouseLeave()
      }}
    >
      {/* Options Dot Menu */}
      <div 
        ref={menuRef}
        style={{ position: 'absolute', top: 14, right: 14, zIndex: 10 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            background: 'none', border: 'none', color: '#8b949e',
            cursor: 'pointer', padding: 4, borderRadius: '50%'
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'white'}
          onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}
        >
          <MoreVertical size={16} />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              style={{
                position: 'absolute', right: 0, marginTop: 4,
                background: '#161b22', border: '1px solid #30363d',
                borderRadius: 8, width: 120, padding: 4,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 20
              }}
            >
              <button
                onClick={() => {
                  onEdit(project);
                  setShowMenu(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                  background: 'none', border: 'none', color: '#c9d1d9',
                  padding: '6px 8px', fontSize: 12, textAlign: 'left',
                  cursor: 'pointer', borderRadius: 4
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#21262d'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Edit2 size={12} /> Edit
              </button>
              <button
                onClick={() => {
                  onDelete(project._id);
                  setShowMenu(false);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                  background: 'none', border: 'none', color: '#f85149',
                  padding: '6px 8px', fontSize: 12, textAlign: 'left',
                  cursor: 'pointer', borderRadius: 4
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,81,73,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <Trash2 size={12} /> Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card Details */}
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12, paddingRight: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${project.color}20`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: 18,
            boxShadow: `0 0 10px ${project.color}20`, flexShrink: 0
          }}>
            {project.icon || '📱'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.name}
            </div>
            <div style={{ fontSize: 11, color: '#8b949e', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.description || 'No description'}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div style={{ marginBottom: 12 }}>
          <span style={{
            background: status.bg, color: status.color,
            fontSize: 9, fontWeight: 700, padding: '2px 8px',
            borderRadius: 100, textTransform: 'uppercase'
          }}>
            {status.label}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: '#8b949e' }}>Progress</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{project.progress}%</span>
          </div>
          <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ delay: 0.2 + index * 0.05, duration: 0.8 }}
              style={{
                height: '100%', background: project.color || '#8b5cf6',
                borderRadius: 99, boxShadow: `0 0 8px ${project.color}50`,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Members */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {project.members && project.members.slice(0, 3).map((m: any, mi: number) => (
              <div
                key={mi}
                style={{
                  width: 22, height: 22, borderRadius: '50%', background: m.color || '#8b5cf6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, fontWeight: 700, color: 'white',
                  marginLeft: mi > 0 ? -6 : 0, border: '2px solid rgba(255,255,255,0.06)',
                  boxShadow: `0 0 6px ${m.color}40`,
                }}
              >
                {m.initials || 'U'}
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckSquare size={12} color="#8b949e" />
              <span style={{ fontSize: 11, color: '#8b949e' }}>{project.tasksDone || 0}/{project.tasksTotal || 0}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} color="#8b949e" />
              <span style={{ fontSize: 11, color: '#8b949e' }}>
                {project.deadline ? new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Projects Page Component ───────────────────────────────────────────

export default function Projects() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspace()

  // Filter and sort states
  const [statusFilter, setStatusFilter] = useState<'all' | 'on_track' | 'at_risk' | 'behind' | 'completed'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'deadline'>('name')
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false)

  // Modals open states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<any | null>(null)
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)

  // ─── Queries ───

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/projects?workspaceId=${activeWorkspaceId}`)
      return res.data
    },
    enabled: !!activeWorkspaceId
  })

  // ─── Forms States ───

  const [createForm, setCreateForm] = useState({
    name: '', description: '', color: '#8b5cf6', icon: '📱', deadline: ''
  })

  const [editForm, setEditForm] = useState({
    name: '', description: '', status: 'on_track', progress: 0, color: '#8b5cf6', icon: '📱', deadline: ''
  })

  // Set edit form values when project is loaded into editing state
  useEffect(() => {
    if (editingProject) {
      setEditForm({
        name: editingProject.name || '',
        description: editingProject.description || '',
        status: editingProject.status || 'on_track',
        progress: editingProject.progress || 0,
        color: editingProject.color || '#8b5cf6',
        icon: editingProject.icon || '📱',
        deadline: editingProject.deadline ? editingProject.deadline.split('T')[0] : ''
      })
    }
  }, [editingProject])

  // ─── Mutations ───

  // Create Project
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      const res = await api.post('/projects', {
        ...projectData,
        workspaceId: activeWorkspaceId
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', activeWorkspaceId] })
      toast.success('Project created successfully!')
      setIsCreateModalOpen(false)
      setCreateForm({ name: '', description: '', color: '#8b5cf6', icon: '📱', deadline: '' })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create project')
    }
  })

  // Update Project
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.put(`/projects/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', activeWorkspaceId] })
      toast.success('Project updated successfully!')
      setEditingProject(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update project')
    }
  })

  // Delete Project
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/projects/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', activeWorkspaceId] })
      toast.success('Project deleted successfully!')
      setDeletingProjectId(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete project')
    }
  })

  // ─── Filtering & Sorting Logic ───

  const filteredProjects = projects
    .filter((p: any) => statusFilter === 'all' || p.status === statusFilter)
    .sort((a: any, b: any) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'progress') {
        return b.progress - a.progress
      }
      if (sortBy === 'deadline') {
        const dateA = a.deadline ? new Date(a.deadline).getTime() : Infinity
        const dateB = b.deadline ? new Date(b.deadline).getTime() : Infinity
        return dateA - dateB
      }
      return 0
    })

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* Stagger entrance 3D Header */}
      <motion.div 
        variants={itemVariants}
        style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Poppins, sans-serif' }}>Projects Workspace</h2>
          <p style={{ fontSize: 12, color: '#8b949e', marginTop: 3 }}>
            Manage, filter, and modify active development projects.
          </p>
        </div>

        {/* Stats Summary Header */}
        <div style={{ display: 'flex', gap: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '8px 16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#c9d1d9' }}>{projects.length}</div>
            <div style={{ fontSize: 9, color: '#8b949e', textTransform: 'uppercase' }}>Total</div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', height: 26, alignSelf: 'center' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#22c55e' }}>
              {projects.filter((p: any) => p.status === 'on_track' || p.status === 'completed').length}
            </div>
            <div style={{ fontSize: 9, color: '#8b949e', textTransform: 'uppercase' }}>Healthy</div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', height: 26, alignSelf: 'center' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>
              {projects.filter((p: any) => p.status === 'behind' || p.status === 'at_risk').length}
            </div>
            <div style={{ fontSize: 9, color: '#8b949e', textTransform: 'uppercase' }}>Attention</div>
          </div>
        </div>
      </motion.div>

      {/* Filter and Sort bar */}
      <motion.div 
        variants={itemVariants}
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        {/* Status Filter Pill Rows */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(['all', 'on_track', 'at_risk', 'behind', 'completed'] as const).map((status) => {
            const isActive = statusFilter === status
            const label = status === 'all' ? 'All Projects' : status.replace('_', ' ')
            return (
              <motion.button
                key={status}
                onClick={() => setStatusFilter(status)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: isActive ? 'linear-gradient(135deg, #7c3aed, #2563eb)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid',
                  borderColor: isActive ? 'transparent' : 'rgba(255,255,255,0.06)',
                  color: isActive ? 'white' : '#8b949e',
                  fontSize: 11, fontWeight: 600, padding: '6px 12px',
                  borderRadius: 20, cursor: 'pointer', textTransform: 'capitalize',
                  boxShadow: isActive ? '0 4px 12px rgba(124, 58, 237, 0.25)' : 'none',
                  transition: 'background 0.2s, border-color 0.2s, color 0.2s'
                }}
              >
                {label}
              </motion.button>
            )
          })}
        </div>

        {/* Sort drop dropdown and Create Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
          
          {/* Sorting Controller Dropdown */}
          <div>
            <button
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#c9d1d9', fontSize: 11, fontWeight: 600,
                padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'border-color 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
            >
              <SortAsc size={13} />
              Sort: <span style={{ color: '#a78bfa' }}>{sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}</span>
              <ChevronDown size={11} />
            </button>

            <AnimatePresence>
              {isSortDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  style={{
                    position: 'absolute', right: 120, marginTop: 4, width: 140,
                    background: '#161b22', border: '1px solid #30363d',
                    borderRadius: 8, padding: 4, zIndex: 100,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                  }}
                >
                  {(['name', 'progress', 'deadline'] as const).map(option => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option)
                        setIsSortDropdownOpen(false)
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', background: 'none', border: 'none', color: '#c9d1d9',
                        padding: '6px 8px', fontSize: 11, cursor: 'pointer', borderRadius: 4,
                        textAlign: 'left'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#21262d'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                      {sortBy === option && <Check size={11} color="#a78bfa" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* New Project Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              border: 'none', color: 'white', fontSize: 11, fontWeight: 700,
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 4px 15px rgba(124,58,237,0.3)',
              transition: 'box-shadow 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.45)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 15px rgba(124,58,237,0.3)'}
          >
            <Plus size={13} />
            New Project
          </button>

        </div>
      </motion.div>

      {/* Projects Cards Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <div 
              key={idx} 
              style={{
                height: 148, background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)', borderRadius: 16
              }} 
            />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <motion.div 
          variants={itemVariants}
          style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'rgba(22, 27, 34, 0.4)', borderRadius: 16,
            border: '1px dashed rgba(255,255,255,0.08)'
          }}
        >
          <Folder size={32} color="#8b949e" style={{ marginBottom: 12, opacity: 0.5 }} />
          <p style={{ color: '#8b949e', fontSize: 13, margin: 0 }}>No projects found matching the criteria.</p>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filteredProjects.map((project: any, idx: number) => (
            <ProjectCard
              key={project._id || project.id}
              project={project}
              index={idx}
              onEdit={(p) => setEditingProject(p)}
              onDelete={(id) => setDeletingProjectId(id)}
            />
          ))}
        </div>
      )}

      {/* ─── MODAL DIALOGS ─── */}
      <AnimatePresence>
        
        {/* 1. Create Project Modal */}
        {isCreateModalOpen && (
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
                borderRadius: 16, width: '100%', maxWidth: 420, padding: 20,
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.15)',
                color: '#e6edf3'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Create New Project</span>
                <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                createProjectMutation.mutate(createForm);
              }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Project Name</label>
                  <input
                    type="text" required
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white', minHeight: 60 }}
                  />
                </div>

                {/* Color & Icon Grid Selector */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Icon</label>
                    <select
                      value={createForm.icon}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, icon: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(22,27,34,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white' }}
                    >
                      {PROJECT_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Theme Color</label>
                    <select
                      value={createForm.color}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, color: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(22,27,34,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white' }}
                    >
                      {PROJECT_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Deadline</label>
                  <input
                    type="date" required
                    value={createForm.deadline}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, deadline: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white' }}
                  />
                </div>

                <button
                  type="submit" disabled={createProjectMutation.isPending}
                  style={{
                    marginTop: 10, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                    border: 'none', color: 'white', padding: '8px 0', borderRadius: 8,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* 2. Edit Project Modal */}
        {editingProject && (
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
                background: 'rgba(22, 27, 34, 0.92)', border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: 16, width: '100%', maxWidth: 420, padding: 20,
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.15)',
                color: '#e6edf3'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Edit Project Settings</span>
                <button onClick={() => setEditingProject(null)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                updateProjectMutation.mutate({ id: editingProject._id, data: editForm });
              }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Project Name</label>
                  <input
                    type="text" required
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white', minHeight: 60 }}
                  />
                </div>

                {/* Status & Progress Slider */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(22,27,34,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white' }}
                    >
                      <option value="on_track">On Track</option>
                      <option value="at_risk">At Risk</option>
                      <option value="behind">Behind</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Progress ({editForm.progress}%)</label>
                    <input
                      type="range" min="0" max="100"
                      value={editForm.progress}
                      onChange={(e) => setEditForm(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                      style={{ width: '100%', height: 26, accentColor: editForm.color }}
                    />
                  </div>
                </div>

                {/* Color & Icon Grid Selector */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Icon</label>
                    <select
                      value={editForm.icon}
                      onChange={(e) => setEditForm(prev => ({ ...prev, icon: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(22,27,34,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white' }}
                    >
                      {PROJECT_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Theme Color</label>
                    <select
                      value={editForm.color}
                      onChange={(e) => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(22,27,34,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white' }}
                    >
                      {PROJECT_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Deadline</label>
                  <input
                    type="date" required
                    value={editForm.deadline}
                    onChange={(e) => setEditForm(prev => ({ ...prev, deadline: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white' }}
                  />
                </div>

                <button
                  type="submit" disabled={updateProjectMutation.isPending}
                  style={{
                    marginTop: 10, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                    border: 'none', color: 'white', padding: '8px 0', borderRadius: 8,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {updateProjectMutation.isPending ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* 3. Delete Confirmation Modal */}
        {deletingProjectId && (
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
                background: 'rgba(22, 27, 34, 0.92)', border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 16, width: '100%', maxWidth: 360, padding: 20,
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(239, 68, 68, 0.15)',
                color: '#e6edf3', textAlign: 'center'
              }}
            >
              <Trash2 size={36} color="#ef4444" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 8px 0' }}>Delete Project?</h3>
              <p style={{ fontSize: 12, color: '#8b949e', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Are you sure you want to delete this project? This will permanently remove all tasks and data associated with it. This action cannot be undone.
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  onClick={() => setDeletingProjectId(null)}
                  style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    color: '#c9d1d9', fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 8, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteProjectMutation.mutate(deletingProjectId)}
                  disabled={deleteProjectMutation.isPending}
                  style={{
                    background: '#ef4444', border: 'none',
                    color: 'white', fontSize: 12, fontWeight: 700, padding: '7px 16px', borderRadius: 8, cursor: 'pointer'
                  }}
                >
                  {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

    </motion.div>
  )
}
