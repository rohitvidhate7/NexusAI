import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Send, Bot, Loader2, Calendar, CheckSquare, AlertTriangle, User, ExternalLink, HelpCircle } from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import api from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  action?: any
}

function TypewriterText({ text, speed = 10, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState('')

  useEffect(() => {
    let index = 0
    setDisplayedText('')
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index))
        index++
      } else {
        clearInterval(interval)
        if (onComplete) onComplete()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed])

  return <ReactMarkdown>{displayedText}</ReactMarkdown>
}

export default function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi, I'm NexusAI, your docked co-pilot. I can create or assign tasks, query workloads, flag risks, summarize projects, and set reminders. Ask me anything!",
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const location = useLocation()
  const queryClient = useQueryClient()

  // Custom Event Listener to toggle drawer from Topbar or elsewhere
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev)
    window.addEventListener('toggle-ai-assistant', handleToggle)
    return () => window.removeEventListener('toggle-ai-assistant', handleToggle)
  }, [])

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Extract page context parameters to pass to LLM
  const getContext = () => {
    const context: any = { pathname: location.pathname }
    
    // If on task details, extract taskId
    if (location.pathname.startsWith('/tasks/')) {
      const parts = location.pathname.split('/')
      context.taskId = parts[parts.length - 1]
    }
    
    // If on projects/board, we can extract from search params or set general context
    return context
  }

  const handleSend = async (contentToSend: string) => {
    if (!contentToSend.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: contentToSend,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setMessage('')
    setLoading(true)

    // Prepare history
    const history = messages.map(m => ({ role: m.role, content: m.content })).concat({ role: 'user', content: contentToSend })

    try {
      const response = await api.post('/ai/chat', { 
        messages: history,
        context: getContext()
      })

      const aiReply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.content || "I'm here to assist you.",
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
        action: response.data.action
      }

      setMessages(prev => [...prev, aiReply])

      // Realtime Sync: Invalidate queries if backend performed an action successfully
      if (response.data.action && response.data.action.status === 'success') {
        console.log('[AI Assistant] Action success, invalidating queries...');
        queryClient.invalidateQueries({ queryKey: ['tasks'] })
        queryClient.invalidateQueries({ queryKey: ['projects'] })
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        queryClient.invalidateQueries({ queryKey: ['reports'] })
      }
    } catch (err) {
      console.error('Co-pilot API error:', err)
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I ran into a connection issue. Please make sure the server is running and check your API keys.",
        timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend(message)
  }

  // Quick Action Chips
  const chips = [
    { label: "What's overdue?", prompt: "Check for overdue tasks in the current project" },
    { label: "Summarize my week", prompt: "Summarize my sprint progress and workload this week" },
    { label: "Create a task", prompt: "Create a task to review landing page copy" }
  ]

  return (
    <>
      {/* Floating Toggle FAB Button (bottom-right) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1, rotate: 3 }}
        whileTap={{ scale: 0.9 }}
        style={{
          position: 'fixed',
          right: 24,
          bottom: 24,
          width: 50,
          height: 50,
          borderRadius: '50%',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
          boxShadow: '0 0 20px rgba(124, 58, 237, 0.35)',
        }}
      >
        {isOpen ? <X size={20} /> : <Sparkles size={20} />}
      </motion.button>

      {/* Docked Slide-out Right Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              width: 380,
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              background: 'rgba(8,12,28,0.95)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(124,58,237,0.3)',
                }}>
                  <Bot size={16} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'white', fontFamily: 'Poppins, sans-serif' }}>
                    NexusAI Co-Pilot
                  </div>
                  <div style={{ fontSize: 10, color: '#22C55E', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', display: 'inline-block', boxShadow: '0 0 6px #22C55E' }} />
                    Active & Context Aware
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
              >
                <X size={15} />
              </motion.button>
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              background: 'rgba(0, 0, 0, 0.15)'
            }}>
              {messages.map((msg, i) => {
                const isAI = msg.role === 'assistant'
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignSelf: isAI ? 'flex-start' : 'flex-end',
                      flexDirection: isAI ? 'row' : 'row-reverse',
                      maxWidth: '90%'
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: isAI ? 'linear-gradient(135deg, #7C3AED, #2563EB)' : (user?.color || '#3B82F6'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      fontWeight: 700,
                      color: 'white',
                      flexShrink: 0
                    }}>
                      {isAI ? <Bot size={12} /> : (user?.initials || 'U')}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div
                        style={{
                          background: isAI ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #7C3AED, #2563EB)',
                          border: isAI ? '1px solid rgba(255,255,255,0.08)' : 'none',
                          borderRadius: isAI ? '0 12px 12px 12px' : '12px 0 12px 12px',
                          padding: '10px 14px',
                          color: '#E2E8F0',
                          fontSize: 13,
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap'
                        }}
                        className="markdown-body"
                      >
                        {isAI && i === messages.length - 1 && msg.id !== 'welcome' ? (
                          <TypewriterText text={msg.content} onComplete={() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })} />
                        ) : isAI ? (
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        ) : (
                          msg.content
                        )}

                        {/* Inline Action Confirmation Card */}
                        {isAI && msg.action && msg.action.status === 'success' && (
                          <div style={{
                            background: 'rgba(124,58,237,0.12)',
                            border: '1px solid rgba(124,58,237,0.25)',
                            borderRadius: 10,
                            padding: 10,
                            marginTop: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#A78BFA', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              <Sparkles size={10} />
                              Action Confirmed
                            </div>
                            
                            {msg.action.type === 'create_task' && (
                              <>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{msg.action.data.title}</div>
                                <div style={{ fontSize: 10, color: '#94A3B8' }}>
                                  Project: <span style={{ color: '#CBD5E1' }}>{msg.action.data.project}</span>
                                </div>
                                <div style={{ fontSize: 10, color: '#94A3B8' }}>
                                  Assignee: <span style={{ color: '#CBD5E1' }}>{msg.action.data.assignee}</span>
                                </div>
                                <Link 
                                  to={`/tasks/${msg.action.data.id}`}
                                  style={{
                                    fontSize: 10,
                                    color: '#60A5FA',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    marginTop: 2
                                  }}
                                >
                                  View Task <ExternalLink size={10} />
                                </Link>
                              </>
                            )}

                            {msg.action.type === 'update_task' && (
                              <>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{msg.action.data.title}</div>
                                <div style={{ fontSize: 10, color: '#94A3B8' }}>
                                  Update: <span style={{ color: '#FBBF24', fontWeight: 600 }}>{msg.action.data.status || msg.action.data.priority}</span>
                                </div>
                                <Link 
                                  to={`/tasks/${msg.action.data.id}`}
                                  style={{
                                    fontSize: 10,
                                    color: '#60A5FA',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    marginTop: 2
                                  }}
                                >
                                  View Task <ExternalLink size={10} />
                                </Link>
                              </>
                            )}

                            {msg.action.type === 'assign_task' && (
                              <>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{msg.action.data.title}</div>
                                <div style={{ fontSize: 10, color: '#94A3B8' }}>
                                  Assignee: <span style={{ color: '#CBD5E1' }}>{msg.action.data.assignee}</span>
                                </div>
                                <Link 
                                  to={`/tasks/${msg.action.data.id}`}
                                  style={{
                                    fontSize: 10,
                                    color: '#60A5FA',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    marginTop: 2
                                  }}
                                >
                                  View Task <ExternalLink size={10} />
                                </Link>
                              </>
                            )}

                            {msg.action.type === 'create_project' && (
                              <>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{msg.action.data.name}</div>
                                <Link 
                                  to="/projects"
                                  style={{
                                    fontSize: 10,
                                    color: '#60A5FA',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    marginTop: 2
                                  }}
                                >
                                  View Projects <ExternalLink size={10} />
                                </Link>
                              </>
                            )}

                            {msg.action.type === 'set_reminder' && (
                              <>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>Reminder set for "{msg.action.data.title}"</div>
                                <div style={{ fontSize: 10, color: '#94A3B8' }}>
                                  Time: <span style={{ color: '#CBD5E1' }}>{new Date(msg.action.data.datetime).toLocaleString()}</span>
                                </div>
                                <Link 
                                  to={`/tasks/${msg.action.data.taskId}`}
                                  style={{
                                    fontSize: 10,
                                    color: '#60A5FA',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3,
                                    marginTop: 2
                                  }}
                                >
                                  View Task <ExternalLink size={10} />
                                </Link>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <span style={{
                        fontSize: 9,
                        color: '#64748B',
                        alignSelf: isAI ? 'flex-start' : 'flex-end'
                      }}>
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                )
              })}

              {loading && (
                <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start' }}>
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <Bot size={12} />
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '0 12px 12px 12px',
                    padding: '10px 14px',
                    color: '#CBD5E1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <Loader2 size={12} className="animate-spin" color="#7C3AED" />
                    <span style={{ fontSize: 11, color: '#64748B' }}>Processing Tool...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Action Chips */}
            <div style={{
              padding: '8px 16px 0',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              background: 'rgba(8,12,28,0.80)',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none'
            }}>
              {chips.map((c, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleSend(c.prompt)}
                  whileHover={{ scale: 1.03, background: 'rgba(124,58,237,0.12)', borderColor: 'rgba(124,58,237,0.25)' }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 100,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: '#94A3B8',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {c.label}
                </motion.button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleFormSubmit}
              style={{
                padding: '12px 16px 16px',
                borderTop: '1px solid rgba(255,255,255,0.07)',
                background: 'rgba(8,12,28,0.80)',
                display: 'flex',
                gap: 8,
                alignItems: 'center'
              }}
            >
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Message co-pilot..."
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: '8px 16px',
                  color: 'white',
                  fontSize: 13,
                  outline: 'none'
                }}
              />
              <motion.button
                type="submit"
                whileHover={message.trim() ? { scale: 1.08 } : {}}
                whileTap={message.trim() ? { scale: 0.92 } : {}}
                disabled={!message.trim() || loading}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 'none',
                  background: message.trim() ? 'linear-gradient(135deg, #7C3AED, #2563EB)' : 'rgba(255,255,255,0.06)',
                  color: message.trim() ? 'white' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: message.trim() ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  boxShadow: message.trim() ? '0 0 10px rgba(124,58,237,0.3)' : 'none',
                }}
              >
                <Send size={13} />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
