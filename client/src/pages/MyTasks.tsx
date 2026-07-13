import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MessageSquare, Paperclip, AlertTriangle, CheckSquare, Loader2, Sparkles } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'

// ─── Constants & Configuration ──────────────────────────────────────────────

const tabs = ['All', 'Assigned to me', 'Created by me']

const PRIORITY_CFG: Record<string, { label: string; bg: string; color: string }> = {
  high: { label: 'High', bg: 'rgba(239,68,68,0.15)', color: '#F87171' },
  medium: { label: 'Medium', bg: 'rgba(245,158,11,0.15)', color: '#FBBF24' },
  low: { label: 'Low', bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
}

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
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring' as const, stiffness: 350, damping: 25 }
  }
} as const

// ─── TaskCard Component (3D Tilt Mouse Coordination) ─────────────────────────

interface TaskCardProps {
  task: any
  index: number
}

const TaskCard = ({ task, index }: TaskCardProps) => {
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

  const prio = PRIORITY_CFG[task.priority] || PRIORITY_CFG.medium

  return (
    <motion.div
      ref={cardRef}
      variants={itemVariants}
      onMouseMove={handleMouseMove}
      whileHover={{ y: -3, scale: 1.01 }}
      style={{
        background: 'rgba(22, 27, 34, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
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
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.title}
          </div>
          <div style={{ fontSize: 11, color: '#8b949e' }}>
            📁 {task.projectId?.name || 'General Project'}
          </div>
        </div>
        <span style={{
          background: prio.bg, color: prio.color,
          fontSize: 9, fontWeight: 700, padding: '2px 8px',
          borderRadius: 100, textTransform: 'uppercase', flexShrink: 0
        }}>
          {prio.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 4, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 2, margin: '8px 0 10px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: task.status === 'done' ? '100%' : task.status === 'in_progress' ? '50%' : '0%',
          background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)'
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%', background: task.assignee?.color || '#7c3aed',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 700, color: 'white'
        }}>
          {task.assignee?.initials || 'U'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
            background: task.status === 'done' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
            color: task.status === 'done' ? '#22c55e' : '#60a5fa'
          }}>
            {task.status.replace('_', ' ').toUpperCase()}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={11} color="#8b949e" />
            <span style={{ fontSize: 11, color: '#8b949e' }}>
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Section Component ────────────────────────────────────────────────────────

interface SectionProps {
  title: string
  color: string
  tasks: any[]
  activeTab: string
}

const Section = ({ title, color, tasks, activeTab }: SectionProps) => {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: color, borderRadius: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'white', fontFamily: 'Poppins, sans-serif' }}>{title}</span>
        <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 100, color: '#8b949e' }}>{tasks.length}</span>
      </div>

      {tasks.length === 0 ? (
        <div style={{ padding: '20px 14px', background: 'rgba(255,255,255,0.01)', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.06)', textAlign: 'center', color: '#8b949e', fontSize: 12 }}>
          No tasks in this section.
        </div>
      ) : (
        <motion.div
          key={`${title}-${activeTab}`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}
        >
          {tasks.map((t, idx) => (
            <TaskCard key={t._id} task={t} index={idx} />
          ))}
        </motion.div>
      )}
    </div>
  )
}

// ─── Main MyTasks Page Component ──────────────────────────────────────────────

export default function MyTasks() {
  const { user } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  const [activeTab, setActiveTab] = useState('All')

  // Fetch tasks for active workspace
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/tasks?workspaceId=${activeWorkspaceId}`)
      return res.data
    },
    enabled: !!activeWorkspaceId
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Loader2 size={32} className="animate-spin" color="#8b5cf6" />
      </div>
    )
  }

  // Filter tasks based on activeTab
  const filteredTasks = tasks.filter((t: any) => {
    if (activeTab === 'Assigned to me') {
      return t.assignee?._id === user?.id || t.assignee === user?.id
    }
    if (activeTab === 'Created by me') {
      return t.reporter?._id === user?.id || t.reporter === user?.id
    }
    return true
  })

  const highPriority = filteredTasks.filter((t: any) => t.priority === 'high')
  const mediumPriority = filteredTasks.filter((t: any) => t.priority === 'medium')
  const lowPriority = filteredTasks.filter((t: any) => t.priority === 'low')

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Dynamic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Poppins, sans-serif' }}>My Tasks</h2>
          <p style={{ fontSize: 12, color: '#8b949e', marginTop: 3 }}>
            Track task progress assigned to or created by you.
          </p>
        </div>
      </motion.div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {tabs.map(tab => {
          const isActive = activeTab === tab
          return (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: isActive ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'rgba(255,255,255,0.03)',
                border: '1px solid',
                borderColor: isActive ? 'transparent' : 'rgba(255,255,255,0.06)',
                color: isActive ? 'white' : '#8b949e',
                fontSize: 11, fontWeight: 600, padding: '6px 14px',
                borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: isActive ? '0 4px 12px rgba(139, 92, 246, 0.25)' : 'none',
              }}
            >
              {tab}
            </motion.button>
          )
        })}
      </div>

      {/* Priority Sections */}
      <div>
        <Section title={`High Priority`} color="#ef4444" tasks={highPriority} activeTab={activeTab} />
        <Section title={`Medium Priority`} color="#f59e0b" tasks={mediumPriority} activeTab={activeTab} />
        <Section title={`Low Priority`} color="#22c55e" tasks={lowPriority} activeTab={activeTab} />
      </div>
    </div>
  )
}
