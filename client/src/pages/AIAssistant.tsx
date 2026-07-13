import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Sparkles, Zap, Users, CheckSquare, TrendingDown, BarChart3, FileText, Settings, Loader2, XCircle } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import api from '../lib/api'
import type { AIMessage } from '../types'

const quickActions = [
  { icon: Zap, label: 'Quick Sprint Review', desc: 'Get sprint performance summary', color: '#F59E0B' },
  { icon: Users, label: 'Team Insights', desc: 'Analyze team performance & workload', color: '#3B82F6' },
  { icon: CheckSquare, label: 'Generate Tasks', desc: 'AI-powered task creation', color: '#22C55E' },
  { icon: TrendingDown, label: 'Predict Delays', desc: 'Identify at-risk tasks', color: '#7C3AED' },
  { icon: BarChart3, label: 'Optimize Sprint', desc: 'Smart sprint planning', color: '#06B6D4' },
  { icon: FileText, label: 'Generate Report', desc: 'Automated report creation', color: '#EF4444' },
]

const TIPS = [
  'Try "Show me tasks due this week"',
  'Try "Who\'s available?"',
  'Try "Summarize sprint progress"',
]

function TypewriterText({ text, speed = 12, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
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

export default function AIAssistant() {
  const [messages, setMessages] = useState<AIMessage[]>([{
    id: '1', role: 'assistant', content: 'Hello! I am your NexusAI assistant. How can I help you today?', timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }])
  const [input, setInput] = useState('')
  const [tip] = useState(TIPS[Math.floor(Math.random() * TIPS.length)])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const { mutate: sendMessage, isPending: isTyping } = useMutation({
    mutationFn: async (chatMessages: any[]) => {
      const controller = new AbortController()
      abortControllerRef.current = controller
      const res = await api.post('/ai/chat', { messages: chatMessages }, { signal: controller.signal })
      return res.data
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: data.role,
        content: data.content,
        timestamp: new Date(data.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }])
      abortControllerRef.current = null
    },
    onError: (error: any) => {
      if (error?.name === 'CanceledError' || error?.message?.includes('aborted') || error?.code === 'ERR_CANCELED') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: '*Generation stopped by user.*',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }])
        abortControllerRef.current = null
        return
      }
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I am sorry, but I am currently unavailable. Please check the backend API configuration.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }])
      abortControllerRef.current = null
    }
  })

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }

  const handleSend = () => {
    if (!input.trim() || isTyping) return
    const userContent = input.trim()
    const userMsg: AIMessage = { id: Date.now().toString(), role: 'user', content: userContent, timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
    
    // Prepare conversation history to send
    const history = messages.map(m => ({ role: m.role, content: m.content })).concat({ role: 'user', content: userContent })
    
    setMessages(prev => [...prev, userMsg])
    setInput('')
    sendMessage(history)
  }

  const triggerQuickAction = (label: string) => {
    if (isTyping) return
    const userMsg: AIMessage = { id: Date.now().toString(), role: 'user', content: label, timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
    const history = messages.map(m => ({ role: m.role, content: m.content })).concat({ role: 'user', content: label })
    setMessages(prev => [...prev, userMsg])
    sendMessage(history)
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 60, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              fontFamily: "'Poppins', sans-serif",
              background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            AI Assistant
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>
            Your intelligent project companion
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ position: 'relative', width: 8, height: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', position: 'absolute' }} />
              <motion.div
                animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', position: 'absolute', top: 0, left: 0 }}
              />
            </div>
            <span style={{ fontSize: 12, color: '#22C55E', fontWeight: 600 }}>Online</span>
            <span style={{ fontSize: 12, color: '#64748B' }}>· Powered by NexusAI</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMessages([{
                id: '1', role: 'assistant', content: 'Hello! I am your NexusAI assistant. How can I help you today?', timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              }])}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#CBD5E1',
                fontSize: 12,
                padding: '7px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            >
              Clear
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#64748B',
                fontSize: 12,
                padding: '7px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#CBD5E1')}
              onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
            >
              <Settings size={14} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Greeting */}
      {messages.length <= 1 && (
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <motion.div
            animate={{ boxShadow: ['0 0 20px rgba(124,58,237,0.35)', '0 0 35px rgba(124,58,237,0.6)', '0 0 20px rgba(124,58,237,0.35)'] }}
            transition={{ repeat: Infinity, duration: 3 }}
            style={{
              width: 60,
              height: 60,
              borderRadius: 18,
              background: 'linear-gradient(135deg,#7C3AED,#2563EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Sparkles size={28} color="white" />
          </motion.div>
          <h2 style={{
            fontSize: 26,
            fontWeight: 700,
            fontFamily: "'Poppins', sans-serif",
            background: 'linear-gradient(135deg, #ffffff, #CBD5E1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: 8,
          }}>
            Hello, Nexus Team
          </h2>
          <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 480, margin: '0 auto' }}>
            I'm your AI-powered project assistant. I can help you with task management, sprint planning, team insights, and much more. Ask me anything!
          </p>
        </div>
      )}

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {quickActions.map((qa, i) => (
            <motion.button
              key={i}
              whileHover={{ y: -4, boxShadow: `0 12px 28px rgba(0,0,0,0.4), 0 0 0 1px ${qa.color}40` }}
              onClick={() => triggerQuickAction(qa.label)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                padding: '14px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                transition: 'all 0.2s',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${qa.color}30, ${qa.color}15)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${qa.color}30`,
                }}
              >
                <qa.icon size={17} color={qa.color} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 3, fontFamily: "'Poppins', sans-serif" }}>{qa.label}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{qa.desc}</div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Conversation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.3) }}
          >
            {msg.role === 'assistant' ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg,#7C3AED,#2563EB)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 12px rgba(124,58,237,0.35)',
                  }}
                >
                  <Sparkles size={15} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '0 16px 16px 16px',
                      padding: '12px 16px',
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {i === messages.length - 1 && msg.id !== '1' ? (
                        <TypewriterText text={msg.content} onComplete={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })} />
                      ) : (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{msg.timestamp}</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <div>
                  <div
                    style={{
                      background: 'linear-gradient(135deg,#7C3AED,#2563EB)',
                      borderRadius: '16px 16px 0 16px',
                      padding: '12px 16px',
                      maxWidth: 480,
                      marginBottom: 6,
                      boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
                    }}
                  >
                    <div style={{ fontSize: 13, color: 'white', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', textAlign: 'right' }}>{msg.timestamp}</div>
                </div>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg,#7C3AED,#2563EB)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  ME
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg,#7C3AED,#2563EB)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(124,58,237,0.35)',
              }}
            >
              <Sparkles size={15} color="white" />
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0 16px 16px 16px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: 5 }}>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, delay: i * 0.15, duration: 0.6 }}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED' }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 14,
          padding: '10px 14px',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'rgba(124,58,237,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={13} color="#7C3AED" />
          </div>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
            placeholder={'Ask me anything... (e.g., "Summarize sprint progress" or "Who\'s overloaded?")'}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: 13,
              outline: 'none',
            }}
          />
          {isTyping ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStop}
              style={{
                background: '#EF4444',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                boxShadow: '0 0 16px rgba(239,68,68,0.4)',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              <XCircle size={14} />
              Stop
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: input.trim() ? 1.05 : 1 }}
              whileTap={{ scale: input.trim() ? 0.95 : 1 }}
              onClick={handleSend}
              disabled={isTyping}
              style={{
                background: input.trim()
                  ? 'linear-gradient(135deg,#7C3AED,#2563EB)'
                  : 'rgba(255,255,255,0.06)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: 10,
                cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                boxShadow: input.trim() ? '0 0 16px rgba(124,58,237,0.4)' : 'none',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              <Send size={14} />
              Send
            </motion.button>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>Tip: {tip}</div>
      </div>
    </div>
  )
}
