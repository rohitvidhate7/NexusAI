  import { useState, useRef, useEffect, memo } from 'react'
import { motion } from 'framer-motion'
import { Hash, Send, Search, Settings, Plus, Smile, Paperclip, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Channel } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { getSocket } from '../lib/socket'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'

// ─── MessageItem Component (Staggered Entries) ───────────────────────────────

const MessageItem = memo(function MessageItem({ msg, index, user }: { msg: any; index: number; user: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.02, 0.25) }}
      style={{
        display: 'flex',
        flexDirection: msg.isSelf ? 'row-reverse' : 'row',
        gap: 10,
        alignItems: 'flex-end',
      }}
    >
      {/* Avatar (non-self) */}
      {!msg.isSelf && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: msg.sender?.color || '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
            boxShadow: `0 0 6px ${msg.sender?.color || '#7c3aed'}40`
          }}
        >
          {msg.sender?.initials || 'U'}
        </div>
      )}

      <div style={{ maxWidth: 420 }}>
        {!msg.isSelf && (
          <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 4 }}>
            <span style={{ fontWeight: 600, color: '#e6edf3' }}>
              {msg.sender?.name || 'User'}
            </span>{' '}
            <span style={{ color: '#8b949e' }}>{msg.timestamp}</span>
          </div>
        )}

        <div
          style={{
            padding: '10px 14px',
            borderRadius: msg.isSelf ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            background: msg.isSelf ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'rgba(255,255,255,0.06)',
            border: msg.isSelf ? 'none' : '1px solid rgba(255,255,255,0.08)',
            fontSize: 13,
            color: msg.isSelf ? 'white' : '#e6edf3',
            lineHeight: 1.55,
            wordBreak: 'break-word',
          }}
        >
          {msg.content}
        </div>

        {msg.isSelf && (
          <div style={{ fontSize: 11, color: '#8b949e', textAlign: 'right', marginTop: 4 }}>
            {msg.timestamp}
          </div>
        )}
      </div>
    </motion.div>
  )
})

// ─── Main Chat Page Component ────────────────────────────────────────────────

export default function Chat() {
  const { user } = useAuth()
  const { activeWorkspaceId } = useWorkspace()
  const queryClient = useQueryClient()
  
  const [activeChannelId, setActiveChannelId] = useState<string>('')
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  // ─── Queries ───

  // Fetch Channels
  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ['channels', activeWorkspaceId],
    queryFn: async () => {
      const res = await api.get('/chat/channels')
      return res.data as Channel[]
    }
  })

  // Fetch workspace members (replaces hardcoded mockUsers)
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/workspaces/${activeWorkspaceId}/members`)
      return res.data
    },
    enabled: !!activeWorkspaceId
  })

  // Auto-select first channel when channels load
  useEffect(() => {
    if (channels.length > 0 && !activeChannelId) {
      setActiveChannelId(channels[0]._id || channels[0].id)
    }
  }, [channels, activeChannelId])

  // Handle start direct message from state (e.g. from Team members page redirect)
  useEffect(() => {
    const targetUserId = location.state?.startDirectMessage
    if (targetUserId && channels.length > 0 && user?.id) {
      const sortedIds = [user.id, targetUserId].sort().join('-')
      const dmChannelName = `dm-${sortedIds}`
      
      const existingDm = channels.find((c: any) => c.name === dmChannelName)
      
      if (existingDm) {
        setActiveChannelId(existingDm._id || existingDm.id)
      } else {
        // Create dm on the fly if it doesn't exist
        // Note: createChannelMutation might not be available here, but we can call api directly
        api.post('/chat/channels', {
          name: dmChannelName,
          workspaceId: activeWorkspaceId as string,
          members: [targetUserId]
        }).then(res => {
          queryClient.invalidateQueries({ queryKey: ['channels', activeWorkspaceId] })
          setActiveChannelId(res.data._id || res.data.id)
        }).catch(err => console.error("Error creating DM channel:", err))
      }
      
      // Clear the location state so we don't trigger it again on subsequent navigation/re-render
      window.history.replaceState({}, document.title)
    }
  }, [location.state, channels, user?.id, activeWorkspaceId, queryClient])

  // Fetch Messages for active channel
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', activeChannelId],
    queryFn: async () => {
      if (!activeChannelId) return []
      const res = await api.get(`/chat/channels/${activeChannelId}/messages`)
      return res.data.map((msg: any) => ({
        id: msg._id,
        content: msg.content,
        sender: msg.sender,
        timestamp: new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isSelf: msg.sender._id === user?.id
      }))
    },
    enabled: !!activeChannelId
  })

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Socket IO Setup
  useEffect(() => {
    if (!activeChannelId) return
    const socket = getSocket()
    if (!socket) return

    socket.emit('join_channel', activeChannelId)

    const handleReceive = (msg: any) => {
      if (msg.channelId === activeChannelId) {
        queryClient.setQueryData(['messages', activeChannelId], (old: any) => {
          const formattedMsg = {
            id: msg._id,
            content: msg.content,
            sender: msg.sender,
            timestamp: new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            isSelf: msg.sender._id === user?.id
          }
          if (old?.find((m: any) => m.id === formattedMsg.id)) return old;
          return [...(old || []), formattedMsg];
        })
      }
    }

    socket.on('receive_message', handleReceive)
    return () => {
      socket.off('receive_message', handleReceive)
    }
  }, [activeChannelId, user?.id, queryClient])

  // Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post(`/chat/channels/${activeChannelId}/messages`, { content })
      return res.data
    }
  })

  // Create Channel/DM Mutation
  const createChannelMutation = useMutation({
    mutationFn: async (payload: { name: string; workspaceId: string; members: string[] }) => {
      const res = await api.post('/chat/channels', payload)
      return res.data
    },
    onSuccess: (newChannel) => {
      queryClient.invalidateQueries({ queryKey: ['channels', activeWorkspaceId] })
      setActiveChannelId(newChannel._id || newChannel.id)
    }
  })

  const handleStartDM = (targetUserId: string) => {
    if (!user?.id || !targetUserId) return
    
    // Sort user IDs alphabetically to form a unique, consistent DM channel name
    const sortedIds = [user.id, targetUserId].sort().join('-')
    const dmChannelName = `dm-${sortedIds}`
    
    const existingDm = channels.find((c: any) => c.name === dmChannelName)
    
    if (existingDm) {
      setActiveChannelId(existingDm._id || existingDm.id)
    } else {
      createChannelMutation.mutate({
        name: dmChannelName,
        workspaceId: activeWorkspaceId as string,
        members: [targetUserId]
      })
    }
  }

  const handleSend = () => {
    if (!inputValue.trim() || !activeChannelId) return
    const content = inputValue.trim()
    setInputValue('')
    sendMessageMutation.mutate(content)
  }

  const activeChannel = channels.find((c: any) => (c._id || c.id) === activeChannelId)

  const publicChannels = channels.filter((ch: any) => !ch.name.startsWith('dm-'))

  const getChannelHeaderInfo = () => {
    if (!activeChannel) return { name: '', description: '', isDm: false, otherUser: null }
    
    if (activeChannel.name.startsWith('dm-')) {
      const parts = activeChannel.name.split('-')
      const otherUserId = parts.find((p: string) => p !== 'dm' && p !== user?.id)
      const otherUser = members.find((m: any) => m._id === otherUserId)
      return {
        name: otherUser ? otherUser.name : 'Direct Message',
        description: otherUser ? `Direct message with ${otherUser.name}` : 'Private conversation',
        isDm: true,
        otherUser
      }
    }
    
    return {
      name: activeChannel.name,
      description: activeChannel.description || 'Workspace discussion board',
      isDm: false,
      otherUser: null
    }
  }
  
  const headerInfo = getChannelHeaderInfo()

  const statusColor = (status: string) =>
    status === 'active' ? '#22C55E' : status === 'away' ? '#FBBF24' : '#64748B'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        display: 'flex',
        height: 'calc(100vh - 120px)',
        background: 'rgba(22, 27, 34, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        maxWidth: 1200,
        margin: '0 auto'
      }}
    >
      {/* ── Left Sidebar (Channels & Members) ── */}
      <div style={{
        width: 240, minWidth: 240, borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column', background: 'rgba(8,12,28,0.3)',
      }}>
        {/* Channels Selector */}
        <div style={{ padding: '14px 12px 10px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px' }}>
            <span>Channels</span>
            {channelsLoading && <Loader2 size={12} className="animate-spin" color="#8b5cf6" />}
          </div>

          {publicChannels.map((ch: any) => {
            const chId = ch._id || ch.id;
            const isActive = activeChannelId === chId
            return (
              <motion.div
                key={chId}
                onClick={() => setActiveChannelId(chId)}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 8,
                  cursor: 'pointer', marginBottom: 2, background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  borderRight: isActive ? '2px solid #8b5cf6' : '2px solid transparent',
                  color: isActive ? 'white' : '#8b949e', transition: 'all 0.15s',
                }}
              >
                <Hash size={13} style={{ flexShrink: 0, color: isActive ? '#a78bfa' : 'inherit' }} />
                <span style={{ fontSize: 13, flex: 1, fontWeight: isActive ? 600 : 500 }}>{ch.name}</span>
              </motion.div>
            )
          })}
        </div>

        {/* Dynamic Direct Messages (Workspace Team Members) */}
        <div style={{ padding: '12px 12px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 8px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Team Members
            </div>
            {membersLoading && <Loader2 size={11} className="animate-spin" color="#8b5cf6" />}
          </div>

          {members.map((u: any) => {
            const sortedIds = [user?.id, u._id].sort().join('-')
            const dmChannelName = `dm-${sortedIds}`
            const isActive = activeChannel && activeChannel.name === dmChannelName
            return (
              <motion.div
                key={u._id}
                onClick={() => handleStartDM(u._id)}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                  borderRadius: 8, cursor: 'pointer', marginBottom: 2, transition: 'all 0.15s',
                  background: isActive ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                  borderRight: isActive ? '2px solid #8b5cf6' : '2px solid transparent',
                  color: isActive ? 'white' : '#8b949e',
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', background: u.color || '#8b5cf6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: 'white', boxShadow: `0 0 6px ${u.color}40`
                  }}>
                    {u.initials || 'U'}
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 0, right: 0, width: 8, height: 8,
                    borderRadius: '50%', border: '2px solid rgba(8,12,28,0.9)',
                    background: statusColor(u.status || 'active'), boxShadow: `0 0 6px ${statusColor(u.status || 'active')}`
                  }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Poppins, sans-serif' }}>
                    {u.name}
                  </div>
                  <div style={{ fontSize: 10, color: statusColor(u.status || 'active'), fontWeight: 500, textTransform: 'capitalize' }}>
                    {u.status || 'Active'}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Right Panel (Chat conversation frame) ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,12,28,0.1)', backdropFilter: 'blur(16px)', height: 60,
        }}>
          {activeChannel ? (
            <>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {headerInfo.isDm ? (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: statusColor(headerInfo.otherUser?.status || 'active'),
                      boxShadow: `0 0 6px ${statusColor(headerInfo.otherUser?.status || 'active')}`
                    }} />
                  ) : (
                    <Hash size={15} color="#8b5cf6" />
                  )}
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'white', fontFamily: 'Poppins, sans-serif' }}>
                    {headerInfo.name}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#8b949e', marginTop: 1 }}>
                  {headerInfo.description}
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: '#8b949e', fontSize: 12 }}>Loading active channel...</div>
          )}
        </div>

        {/* Messages Feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(0, 0, 0, 0.15)' }}>
          {messagesLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8b949e', flexDirection: 'column', gap: 12 }}>
              <Loader2 size={24} className="animate-spin" color="#8b5cf6" />
              <span style={{ fontSize: 12 }}>Loading message log...</span>
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8b949e' }}>
              <span style={{ fontSize: 12 }}>No messages in this board. Let's make an entry!</span>
            </div>
          ) : (
            messages.map((msg: any, i: number) => (
              <MessageItem key={msg.id || i} msg={msg} index={i} user={user} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer */}
        <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,12,28,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '8px 12px' }}>
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              disabled={sendMessageMutation.isPending || !activeChannelId}
              placeholder={activeChannel ? `Message #${activeChannel.name}...` : 'Select channel...'}
              style={{ flex: 1, background: 'none', border: 'none', color: 'white', fontSize: 13, outline: 'none' }}
            />

            <motion.button
              onClick={handleSend}
              whileHover={inputValue.trim() ? { scale: 1.03 } : {}}
              whileTap={inputValue.trim() ? { scale: 0.97 } : {}}
              disabled={sendMessageMutation.isPending || !inputValue.trim() || !activeChannelId}
              style={{
                background: inputValue.trim() ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'rgba(255,255,255,0.05)',
                border: 'none', color: 'white', padding: '6px 14px', borderRadius: 8,
                cursor: inputValue.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 700, transition: 'all 0.2s', flexShrink: 0,
                opacity: (sendMessageMutation.isPending || !inputValue.trim()) ? 0.6 : 1,
                boxShadow: inputValue.trim() ? '0 0 12px rgba(139,92,246,0.3)' : 'none'
              }}
            >
              {sendMessageMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Send
            </motion.button>
          </div>
        </div>
      </div>

    </motion.div>
  )
}
