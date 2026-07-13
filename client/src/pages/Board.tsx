import { useState, useRef, useEffect, memo } from 'react'
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MoreHorizontal, Filter, Layers, X, Calendar, UserPlus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useWorkspace } from '../contexts/WorkspaceContext'
import toast from 'react-hot-toast'

// ─── Constants & Configuration ──────────────────────────────────────────────

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  UI: { bg: 'rgba(59,130,246,0.15)', color: '#60A5FA' },
  'v2.0': { bg: 'rgba(59,130,246,0.15)', color: '#60A5FA' },
  Feature: { bg: 'rgba(124,58,237,0.15)', color: '#A78BFA' },
  Docs: { bg: 'rgba(6,182,212,0.15)', color: '#22D3EE' },
  Bug: { bg: 'rgba(239,68,68,0.15)', color: '#F87171' },
  High: { bg: 'rgba(239,68,68,0.15)', color: '#F87171' },
  Performance: { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
  Backend: { bg: 'rgba(245,158,11,0.15)', color: '#FBBF24' },
  Design: { bg: 'rgba(244,63,94,0.15)', color: '#FB7185' },
  Review: { bg: 'rgba(99,102,241,0.15)', color: '#818CF8' },
  Ready: { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
}

const COLUMN_COLORS: Record<string, string> = {
  backlog: '#64748B',
  todo: '#3B82F6',
  in_progress: '#F59E0B',
  review: '#7C3AED',
  done: '#10B981',
}

const COLUMN_TITLES: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

// ─── Sortable TaskCard Component ─────────────────────────────────────────────

const TaskCard = memo(function TaskCard({ task, isDragging }: { task: any; isDragging?: boolean }) {
  const taskId = task._id || task.id;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: taskId })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <motion.div 
      ref={setNodeRef} 
      style={style} 
      layoutId={taskId} 
      layout 
      {...attributes} 
      {...listeners}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: 12,
          cursor: 'grab',
          marginBottom: 8,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)'
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 8, lineHeight: 1.4, fontFamily: 'Poppins, sans-serif' }}>
          {task.title}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          {task.assignee ? (
            <div
              style={{
                width: 22, height: 22, borderRadius: '50%',
                background: task.assignee.color || '#7c3aed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 700, color: 'white',
                boxShadow: `0 0 6px ${task.assignee.color}40`,
              }}
            >
              {task.assignee.initials || 'U'}
            </div>
          ) : (
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#8b949e' }}>
              ?
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
              background: task.priority === 'high' ? 'rgba(239,68,68,0.15)' : task.priority === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
              color: task.priority === 'high' ? '#f87171' : task.priority === 'medium' ? '#f59e0b' : '#22c55e',
              textTransform: 'uppercase'
            }}>
              {task.priority}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
})

// ─── Main Kanban Board Page Component ────────────────────────────────────────

export default function Board() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspace()
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [activeTask, setActiveTask] = useState<any | null>(null)

  // ─── Queries ───

  // Projects list (for filter selection and form dropdown)
  const { data: projects = [] } = useQuery({
    queryKey: ['projects', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/projects?workspaceId=${activeWorkspaceId}`)
      return res.data
    },
    enabled: !!activeWorkspaceId
  })

  // Tasks list matching active workspace
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/tasks?workspaceId=${activeWorkspaceId}`)
      return res.data
    },
    enabled: !!activeWorkspaceId
  })

  // Members list (for task assignees)
  const { data: members = [] } = useQuery({
    queryKey: ['members', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/workspaces/${activeWorkspaceId}/members`)
      return res.data
    },
    enabled: !!activeWorkspaceId
  })

  // ─── Mutations ───

  // Update status (dnd drop)
  const { mutate: updateTaskStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/tasks/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', activeWorkspaceId] })
    },
    onError: (err: any) => {
      toast.error('Failed to update task status')
      queryClient.invalidateQueries({ queryKey: ['tasks', activeWorkspaceId] })
    }
  })

  // Create Task
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
      toast.success('Task created successfully!');
      setIsTaskModalOpen(false);
      setTaskForm({ title: '', description: '', projectId: projects[0]?._id || '', assignee: '', priority: 'medium', status: 'todo', dueDate: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create task');
    }
  })

  // ─── Form State ───
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', projectId: '', assignee: '', priority: 'medium', status: 'todo', dueDate: ''
  })

  useEffect(() => {
    if (projects.length > 0 && !taskForm.projectId) {
      setTaskForm(prev => ({ ...prev, projectId: projects[0]._id }))
    }
  }, [projects])

  // Filter tasks based on selectedProjectId
  const filteredTasks = tasks.filter((t: any) => {
    if (selectedProjectId === 'all') return true
    return t.projectId?._id === selectedProjectId || t.projectId === selectedProjectId
  })

  // Group columns
  const columns = [
    { id: 'backlog', title: 'Backlog', tasks: filteredTasks.filter((t: any) => t.status === 'backlog') },
    { id: 'todo', title: 'To Do', tasks: filteredTasks.filter((t: any) => t.status === 'todo') },
    { id: 'in_progress', title: 'In Progress', tasks: filteredTasks.filter((t: any) => t.status === 'in_progress') },
    { id: 'review', title: 'Review', tasks: filteredTasks.filter((t: any) => t.status === 'review') },
    { id: 'done', title: 'Done', tasks: filteredTasks.filter((t: any) => t.status === 'done') },
  ]

  // ─── Drag & Drop Event Handlers ───

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = filteredTasks.find(t => (t._id || t.id) === active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeCol = columns.find(c => c.tasks.some(t => (t._id || t.id) === activeId))
    const overCol = columns.find(
      c => c.id === overId || c.tasks.some(t => (t._id || t.id) === overId)
    )

    if (!activeCol || !overCol || activeCol.id === overCol.id) return

    // Optimistically update query client cache
    queryClient.setQueryData(['tasks', activeWorkspaceId], (oldTasks: any[] | undefined) => {
      if (!oldTasks) return []
      return oldTasks.map(t => {
        if ((t._id || t.id) === activeId) {
          return { ...t, status: overCol.id }
        }
        return t
      })
    })

    // Perform mutation
    updateTaskStatus({ id: activeId, status: overCol.id })
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Dynamic Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Poppins, sans-serif' }}>Sprint Kanban Board</h2>
          <p style={{ fontSize: 12, color: '#8b949e', marginTop: 3 }}>
            Drag and drop tasks to update sprint progress.
          </p>
        </div>

        {/* Filter selection & action triggers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          
          {/* Project Filtering Dropdown */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#c9d1d9', fontSize: 11, fontWeight: 600,
              padding: '7px 12px', borderRadius: 8, cursor: 'pointer', outline: 'none'
            }}
          >
            <option value="all" style={{ background: '#161b22' }}>All Projects</option>
            {projects.map((p: any) => (
              <option key={p._id} value={p._id} style={{ background: '#161b22' }}>{p.name}</option>
            ))}
          </select>

          {/* Add Task Card Trigger */}
          <button
            onClick={() => setIsTaskModalOpen(true)}
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
            Add Task
          </button>
        </div>
      </div>

      {/* Dnd Board */}
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCorners}
      >
        <div style={{
          display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16, alignItems: 'flex-start'
        }}>
          {columns.map(column => (
            <div
              key={column.id}
              id={column.id}
              style={{
                background: 'rgba(22, 27, 34, 0.45)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 14, minWidth: 250, flex: 1, display: 'flex', flexDirection: 'column',
                maxHeight: 'calc(100vh - 160px)', overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLUMN_COLORS[column.id] }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'white', fontFamily: 'Poppins, sans-serif' }}>{column.title}</span>
                  <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 100, color: '#8b949e' }}>{column.tasks.length}</span>
                </div>
              </div>

              {/* Tasks List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 0' }}>
                <SortableContext
                  items={column.tasks.map((t: any) => t._id || t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {column.tasks.map((task: any) => (
                    <TaskCard
                      key={task._id || task.id}
                      task={task}
                      isDragging={activeTask?._id === task._id}
                    />
                  ))}
                </SortableContext>

                {column.tasks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 10px', color: '#8b949e', fontSize: 11 }}>
                    No tasks yet
                  </div>
                )}
              </div>

              {/* Column Footer Trigger */}
              <button
                onClick={() => {
                  setTaskForm(prev => ({ ...prev, status: column.id }))
                  setIsTaskModalOpen(true)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: 'none',
                  border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 8,
                  color: '#8b949e', fontSize: 11, padding: '6px 12px', margin: 10,
                  cursor: 'pointer', transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'
                  e.currentTarget.style.background = 'rgba(139,92,246,0.06)'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.background = 'none'
                  e.currentTarget.style.color = '#8b949e'
                }}
              >
                <Plus size={12} /> Add Card
              </button>
            </div>
          ))}
        </div>

        {/* Drag Overlay card */}
        <DragOverlay>
          {activeTask && (
            <div style={{
              background: 'rgba(22, 27, 34, 0.95)', border: '1px solid rgba(139,92,246,0.5)',
              borderRadius: 10, padding: 12, opacity: 0.9, transform: 'rotate(2deg)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(139,92,246,0.2)',
              width: 230, backdropFilter: 'blur(16px)'
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'white', marginBottom: 8, fontFamily: 'Poppins, sans-serif' }}>
                {activeTask.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                  background: 'rgba(139,92,246,0.15)', color: '#a78bfa', textTransform: 'uppercase'
                }}>
                  {activeTask.priority}
                </span>
                {activeTask.assignee && (
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', background: activeTask.assignee.color || '#7c3aed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: 'white'
                  }}>
                    {activeTask.assignee.initials || 'U'}
                  </div>
                )}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Create Task Modal Dialog */}
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
                <span style={{ fontSize: 14, fontWeight: 700 }}>Create New Task</span>
                <button onClick={() => setIsTaskModalOpen(false)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                createTaskMutation.mutate(taskForm);
              }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#8b949e', display: 'block', marginBottom: 4 }}>Task Title</label>
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
                  {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
