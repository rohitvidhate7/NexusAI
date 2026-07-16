import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock, Plus, X, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useWorkspace } from '../contexts/WorkspaceContext'
import toast from 'react-hot-toast'

// ─── Constants & Calculations ────────────────────────────────────────────────

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()
  const days: { date: number; month: 'prev' | 'current' | 'next'; fullDate: string }[] = []

  // Add previous month filler days
  for (let i = firstDay - 1; i >= 0; i--) {
    const prevMonth = month === 0 ? 12 : month
    const prevYear = month === 0 ? year - 1 : year
    days.push({
      date: daysInPrev - i,
      month: 'prev',
      fullDate: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(daysInPrev - i).padStart(2, '0')}`,
    })
  }

  // Add current month days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: d,
      month: 'current',
      fullDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    })
  }

  // Add next month filler days
  let nextDay = 1
  while (days.length < 35) {
    const nextMonth = month === 11 ? 1 : month + 2
    const nextYear = month === 11 ? year + 1 : year
    days.push({
      date: nextDay,
      month: 'next',
      fullDate: `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`,
    })
    nextDay++
  }

  return days
}

// ─── Main Calendar Page Component ───────────────────────────────────────────

export default function Calendar() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspace()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const days = getMonthDays(year, month)
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })

  // ─── Queries ───

  // Fetch active workspace tasks
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/tasks?workspaceId=${activeWorkspaceId}`)
      return res.data
    },
    enabled: !!activeWorkspaceId
  })

  // Projects list (for form dropdown)
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/projects?workspaceId=${activeWorkspaceId}`)
      return res.data
    },
    enabled: !!activeWorkspaceId
  })

  // Members list (for form dropdown)
  const { data: members = [] } = useQuery({
    queryKey: ['members', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/workspaces/${activeWorkspaceId}/members`)
      return res.data
    },
    enabled: !!activeWorkspaceId
  })

  // Create Task Mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const res = await api.post('/tasks', {
        ...taskData,
        workspaceId: activeWorkspaceId
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', activeWorkspaceId] });
      toast.success('Event task created successfully!');
      setIsTaskModalOpen(false);
      setTaskForm({ title: '', description: '', projectId: projects[0]?._id || '', assignee: '', priority: 'medium', status: 'todo', dueDate: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create event');
    }
  })

  // ─── Forms States ───
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', projectId: '', assignee: '', priority: 'medium', status: 'todo', dueDate: ''
  })

  useEffect(() => {
    if (projects.length > 0 && !taskForm.projectId) {
      setTaskForm(prev => ({ ...prev, projectId: projects[0]._id }))
    }
  }, [projects])

  // Get tasks matching calendar date
  const getEventsForDate = (fullDate: string) => {
    return tasks.filter((t: any) => {
      if (!t.dueDate) return false
      const formattedDueDate = t.dueDate.split('T')[0]
      return formattedDueDate === fullDate
    })
  }

  // Next 5 upcoming deadlines
  const upcomingEvents = [...tasks]
    .filter((t: any) => t.dueDate && t.status !== 'done')
    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5)

  const todayStr = new Date().toISOString().split('T')[0]

  const navBtnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 8,
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '6px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Loader2 size={32} className="animate-spin" color="#8b5cf6" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      
      {/* Calendar layout card */}
      <div style={{
        background: 'rgba(22, 27, 34, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        overflow: 'hidden', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', gap: 12
        }}>
          {/* Calendar Month Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              style={navBtnStyle}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            >
              <ChevronLeft size={16} />
            </motion.button>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: 0, minWidth: 160, textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>
              {monthName}
            </h2>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              style={navBtnStyle}
              onMouseEnter={e => e.currentTarget.style.color = 'white'}
              onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
            >
              <ChevronRight size={16} />
            </motion.button>
          </div>

          {/* Quick Actions */}
          <motion.button
            onClick={() => setIsTaskModalOpen(true)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              border: 'none', borderRadius: 8, color: 'white',
              fontSize: 11, fontWeight: 700, padding: '7px 14px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              boxShadow: '0 4px 15px rgba(124,58,237,0.3)',
            }}
          >
            <Plus size={13} />
            Add Event
          </motion.button>
        </div>

        {/* Days of Week headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {DAYS.map(d => (
            <div key={d} style={{ padding: '10px', fontSize: 10, fontWeight: 700, color: '#8b949e', textAlign: 'center', letterSpacing: '0.08em' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.06)' }}>
          {days.map((day, idx) => {
            const dateEvents = day.month === 'current' ? getEventsForDate(day.fullDate) : []
            const isToday = day.fullDate === todayStr

            return (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.02, zIndex: 10 }}
                onClick={() => {
                  setTaskForm(prev => ({ ...prev, dueDate: day.fullDate }))
                  setIsTaskModalOpen(true)
                }}
                style={{
                  minHeight: 100, padding: 8,
                  background: isToday ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.1))' : '#161b22',
                  border: isToday ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                  position: 'relative', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4
                }}
              >
                {/* Date indicator */}
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: isToday ? 700 : 400,
                  color: day.month !== 'current' ? 'rgba(255,255,255,0.2)' : isToday ? 'white' : '#CBD5E1',
                  background: isToday ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'transparent',
                }}>
                  {day.date}
                </div>

                {/* Date tasks events */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                  {dateEvents.slice(0, 3).map((event: any) => {
                    const color = PRIORITY_COLORS[event.priority] || '#8b5cf6'
                    return (
                      <div
                        key={event._id}
                        style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 5px',
                          borderRadius: 4, background: `${color}15`, color,
                          borderLeft: `2px solid ${color}`, whiteSpace: 'nowrap',
                          overflow: 'hidden', textOverflow: 'ellipsis'
                        }}
                      >
                        {event.title}
                      </div>
                    )
                  })}
                  {dateEvents.length > 3 && (
                    <div style={{ fontSize: 9, color: '#8b949e', marginTop: 2, paddingLeft: 4 }}>
                      +{dateEvents.length - 3} more
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Upcoming events sidebar card */}
      <div style={{
        background: 'rgba(22, 27, 34, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16, padding: 16, backdropFilter: 'blur(12px)',
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: '0 0 12px 0', fontFamily: 'Poppins, sans-serif' }}>
          Upcoming Deadlines
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
          {upcomingEvents.length === 0 ? (
            <div style={{ fontSize: 12, color: '#8b949e' }}>No upcoming deadlines.</div>
          ) : (
            upcomingEvents.map((event: any) => {
              const color = PRIORITY_COLORS[event.priority] || '#8b5cf6'
              return (
                <motion.div
                  key={event._id}
                  whileHover={{ x: 3 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 10, padding: '8px 12px', borderLeft: `3px solid ${color}`
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10, color: '#8b949e' }}>
                      <Clock size={10} />
                      <span>{new Date(event.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>
      </div>

      {/* Create Task Dialog */}
      <AnimatePresence>
        {isTaskModalOpen && (
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
                borderRadius: 16, width: '100%', maxWidth: 450, padding: 20,
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.15)',
                color: '#e6edf3'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Create Calendar Event Task</span>
                <button onClick={() => setIsTaskModalOpen(false)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const submitData = { ...taskForm };
                if (!submitData.projectId && projects.length > 0) {
                  submitData.projectId = projects[0]._id || projects[0].id;
                }
                createTaskMutation.mutate(submitData);
              }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Event Title</label>
                  <input
                    type="text" required
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white', minHeight: 60 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Project</label>
                    <select
                      value={taskForm.projectId}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, projectId: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(22,27,34,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white' }}
                    >
                      {projects.map((p: any) => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Assignee</label>
                    <select
                      value={taskForm.assignee}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, assignee: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(22,27,34,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white' }}
                    >
                      <option value="">Unassigned</option>
                      {members.map((m: any) => (
                        <option key={m._id} value={m._id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(22,27,34,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white' }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Due Date</label>
                    <input
                      type="date" required
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: 'white' }}
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={createTaskMutation.isPending}
                  style={{
                    marginTop: 10, background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                    border: 'none', color: 'white', padding: '8px 0', borderRadius: 8,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {createTaskMutation.isPending ? 'Creating...' : 'Create Event'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}
