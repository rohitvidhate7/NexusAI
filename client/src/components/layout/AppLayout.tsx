import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import FloatingAIAssistant from './FloatingAIAssistant'
import CommandPalette from '../CommandPalette'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { activeWorkspaceId, setActiveWorkspaceId } = useWorkspace()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [reducedMotion, setReducedMotion] = useState(false)

  // Fetch workspaces if no active workspace is selected
  const { data: workspaces = [] } = useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const res = await api.get('/workspaces')
      return res.data
    },
    enabled: !activeWorkspaceId
  })

  // Auto-activate first workspace or redirect to workspace manager
  useEffect(() => {
    if (!activeWorkspaceId) {
      if (workspaces && workspaces.length > 0) {
        setActiveWorkspaceId(workspaces[0]._id)
      } else if (workspaces && workspaces.length === 0 && !location.pathname.startsWith('/workspaces')) {
        navigate('/workspaces')
      }
    }
  }, [activeWorkspaceId, workspaces, setActiveWorkspaceId, navigate, location.pathname])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    
    if (mediaQuery.matches) return

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5
      const y = (e.clientY / window.innerHeight) - 0.5
      setMousePos({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      className="flex h-screen overflow-hidden animate-fade-in"
      style={{
        backgroundColor: 'var(--bg-primary)',
        position: 'relative',
      }}
    >
      {/* Subtle radial gradient orbs for depth with parallax translate */}
      <div
        style={{
          position: 'fixed',
          top: '-20%',
          left: '10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
          transform: reducedMotion ? 'none' : `translate(${mousePos.x * -35}px, ${mousePos.y * -35}px)`,
          transition: 'transform 0.1s ease-out',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '-10%',
          right: '5%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
          transform: reducedMotion ? 'none' : `translate(${mousePos.x * 50}px, ${mousePos.y * 50}px)`,
          transition: 'transform 0.1s ease-out',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '40%',
          right: '30%',
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
          transform: reducedMotion ? 'none' : `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`,
          transition: 'transform 0.1s ease-out',
        }}
      />

      <Sidebar />

      <div
        className="flex flex-col flex-1 min-w-0 overflow-hidden"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Topbar />
        <motion.main
          className="flex-1 overflow-y-auto p-6"
          style={{ backgroundColor: 'transparent' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, rotateX: 6, translateZ: -60, y: 15 }}
              animate={{ opacity: 1, rotateX: 0, translateZ: 0, y: 0 }}
              exit={{ opacity: 0, rotateX: -6, translateZ: -60, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                height: '100%',
                perspective: 1000,
                transformStyle: 'preserve-3d' as const
              }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </motion.main>
      </div>

      <FloatingAIAssistant />
      <CommandPalette />
    </div>
  )
}
