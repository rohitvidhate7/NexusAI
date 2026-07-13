import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, Link as LinkIcon, Paperclip, MessageSquare, ArrowLeft, Send, Loader2, Calendar } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  backlog: { bg: 'rgba(139,148,158,0.15)', color: '#8b949e' },
  todo: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  in_progress: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  review: { bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6' },
  done: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
}

export default function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('subtasks')
  const [comment, setComment] = useState('')
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [showSubtaskInput, setShowSubtaskInput] = useState(false)

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const res = await api.get(`/tasks/${id}`)
      return res.data
    },
    enabled: !!id
  })

  const { mutate: addSubtask, isPending: addingSubtask } = useMutation({
    mutationFn: async (title: string) => {
      const res = await api.post(`/tasks/${id}/subtasks`, { title })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] })
      setNewSubtaskTitle('')
      setShowSubtaskInput(false)
    }
  })

  const { mutate: toggleSubtask } = useMutation({
    mutationFn: async (subtaskId: string) => {
      const res = await api.patch(`/tasks/${id}/subtasks/${subtaskId}/toggle`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] })
    }
  })

  if (isLoading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="lucide-spin" color="#8b5cf6" size={32} /></div>
  }

  if (!task) {
    return <div style={{ color: '#e6edf3', padding: 40, textAlign: 'center' }}>Task not found</div>
  }

  const statusCfg = STATUS_COLORS[task.status] || STATUS_COLORS.todo

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 60 }}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: 12, marginBottom: 20, padding: 0 }}><ArrowLeft size={13} />Back</button>
      
      {/* Header Info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#8b949e', fontWeight: 600 }}>Project Task</span>
            <span style={{ color: '#484f58' }}>/</span>
            <span style={{ fontSize: 12, color: '#8b949e' }}>{task._id}</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#e6edf3', marginBottom: 16 }}>{task.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ background: statusCfg.bg, color: statusCfg.color, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6, textTransform: 'capitalize' }}>
              {task.status.replace('_', ' ')}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#10b981' }} />
              <span style={{ fontSize: 12, color: '#e6edf3', textTransform: 'capitalize' }}>{task.priority} Priority</span>
            </div>
            {task.dueDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#8b949e', fontSize: 12 }}>
                <Clock size={14} /> Due {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
        
        {/* Assignee / Reporter Box */}
        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, padding: '14px 18px', minWidth: 200 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Assignee</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {task.assignee ? (
                <>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: task.assignee.color || '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>{task.assignee.initials || task.assignee.name.substring(0,2).toUpperCase()}</div>
                  <span style={{ fontSize: 13, color: '#e6edf3', fontWeight: 500 }}>{task.assignee.name}</span>
                </>
              ) : (
                <span style={{ fontSize: 13, color: '#8b949e' }}>Unassigned</span>
              )}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Reporter</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {task.reporter ? (
                <>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: task.reporter.color || '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>{task.reporter.initials || task.reporter.name.substring(0,2).toUpperCase()}</div>
                  <span style={{ fontSize: 13, color: '#e6edf3', fontWeight: 500 }}>{task.reporter.name}</span>
                </>
              ) : (
                <span style={{ fontSize: 13, color: '#8b949e' }}>Unknown</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 12 }}>Description</h3>
        <p style={{ fontSize: 13, color: '#8b949e', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {task.description || "No description provided for this task."}
        </p>
        {task.labels && task.labels.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
            {task.labels.map((l: string) => (
              <span key={l} style={{ background: '#21262d', border: '1px solid #30363d', color: '#8b949e', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100 }}>{l}</span>
            ))}
          </div>
        )}
      </div>

      {/* Detail Tabs */}
      <div style={{ display: 'flex', gap: 20, borderBottom: '1px solid #21262d', marginBottom: 24 }}>
        {[
          { id: 'subtasks', label: 'Subtasks', icon: CheckCircle },
          { id: 'dependencies', label: 'Dependencies', icon: LinkIcon },
          { id: 'timeline', label: 'Timeline (Gantt)', icon: Calendar },
          { id: 'comments', label: 'Comments', icon: MessageSquare },
          { id: 'attachments', label: 'Attachments', icon: Paperclip },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 0 12px 0',
              fontSize: 13, fontWeight: 600,
              color: activeTab === tab.id ? '#8b5cf6' : '#8b949e',
              borderBottom: activeTab === tab.id ? '2px solid #8b5cf6' : '2px solid transparent',
            }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: 300 }}>
        {activeTab === 'subtasks' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {task.subtasks?.map((st: any) => (
                <div key={st._id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#1c2128', border: '1px solid #30363d', padding: '12px 16px', borderRadius: 8 }}>
                  <div 
                    onClick={() => toggleSubtask(st._id)}
                    style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${st.done ? '#10b981' : '#484f58'}`, background: st.done ? '#10b981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    {st.done && <CheckCircle size={12} color="white" />}
                  </div>
                  <span style={{ fontSize: 13, color: st.done ? '#8b949e' : '#e6edf3', textDecoration: st.done ? 'line-through' : 'none' }}>{st.title}</span>
                </div>
              ))}
              
              {showSubtaskInput ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    autoFocus
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSubtaskTitle) addSubtask(newSubtaskTitle)
                      if (e.key === 'Escape') setShowSubtaskInput(false)
                    }}
                    placeholder="Subtask title..."
                    style={{ flex: 1, background: '#1c2128', border: '1px solid #8b5cf6', color: '#e6edf3', padding: '10px 12px', borderRadius: 8, outline: 'none' }}
                  />
                  <button 
                    disabled={!newSubtaskTitle || addingSubtask}
                    onClick={() => addSubtask(newSubtaskTitle)}
                    style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}
                  >
                    {addingSubtask ? <Loader2 size={16} className="lucide-spin" /> : 'Add'}
                  </button>
                  <button onClick={() => setShowSubtaskInput(false)} style={{ background: 'none', color: '#8b949e', border: 'none', cursor: 'pointer' }}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setShowSubtaskInput(true)} style={{ background: 'none', border: '1px dashed #30363d', color: '#8b949e', padding: '12px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginTop: 8 }}>+ Add Subtask</button>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'dependencies' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ background: '#1c2128', border: '1px solid #30363d', borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Blocking (Depends On)</div>
              {task.dependencies?.length > 0 ? (
                task.dependencies.map((dep: any) => (
                  <div key={dep._id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#161b22', padding: '10px 14px', borderRadius: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#8b949e' }}>{dep._id.substring(0,6)}...</span>
                    <span style={{ fontSize: 13, color: '#e6edf3', flex: 1 }}>{dep.title}</span>
                    <span style={{ background: STATUS_COLORS[dep.status]?.bg || STATUS_COLORS.todo.bg, color: STATUS_COLORS[dep.status]?.color || STATUS_COLORS.todo.color, fontSize: 11, padding: '2px 8px', borderRadius: 4, textTransform: 'capitalize' }}>
                      {dep.status?.replace('_', ' ')}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 13, color: '#484f58', fontStyle: 'italic' }}>No dependencies for this task.</div>
              )}
              <button style={{ background: 'none', border: 'none', color: '#8b5cf6', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 10, padding: 0 }}>+ Link Task</button>
            </div>
          </motion.div>
        )}

        {activeTab === 'timeline' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3', marginBottom: 20 }}>Task Timeline (Gantt)</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 16, alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: '#e6edf3' }}>{task.title}</div>
                <div style={{ position: 'relative', height: 40, background: '#0d1117', borderRadius: 8, overflow: 'hidden' }}>
                  {/* Pseudo Gantt Bar */}
                  <div style={{ position: 'absolute', left: '20%', width: '40%', height: '100%', background: 'linear-gradient(90deg, rgba(139,92,246,0.2) 0%, rgba(99,102,241,0.2) 100%)', border: '1px solid rgba(139,92,246,0.4)', borderRadius: 6 }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${task.progress || 0}%`, background: 'rgba(139,92,246,0.5)', borderRadius: 5 }}></div>
                  </div>
                </div>
              </div>

              {task.dependencies?.map((dep: any) => (
                <div key={dep._id} style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 16, alignItems: 'center', marginTop: 12 }}>
                  <div style={{ fontSize: 13, color: '#8b949e', paddingLeft: 12, borderLeft: '2px solid #30363d' }}>↳ {dep.title}</div>
                  <div style={{ position: 'relative', height: 30, background: '#0d1117', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: '5%', width: '15%', height: '100%', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6 }}></div>
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 24, display: 'flex', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4, textTransform: 'uppercase' }}>Start Date</div>
                  <div style={{ fontSize: 13, color: '#e6edf3', fontWeight: 500 }}>
                    {task.startDate ? new Date(task.startDate).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4, textTransform: 'uppercase' }}>Due Date</div>
                  <div style={{ fontSize: 13, color: '#e6edf3', fontWeight: 500 }}>
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'comments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div style={{ color: '#8b949e', fontSize: 13, fontStyle: 'italic' }}>No comments yet.</div>
            </div>
            
            {/* Comment Input */}
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>ME</div>
              <div style={{ flex: 1, background: '#1c2128', border: '1px solid #30363d', borderRadius: 12, padding: 12 }}>
                <textarea
                  value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  style={{ width: '100%', background: 'none', border: 'none', color: '#e6edf3', fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 60, boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', border: 'none', color: 'white', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Send size={12}/>Comment</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'attachments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
            <Paperclip size={32} color="#484f58" style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 14, color: '#e6edf3', fontWeight: 600, marginBottom: 4 }}>No attachments yet</div>
            <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 16 }}>Upload files, images, or documents related to this task.</div>
            <button style={{ background: '#21262d', border: '1px solid #30363d', color: '#e6edf3', fontSize: 13, padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Upload File</button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
