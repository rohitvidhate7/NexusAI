import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, Grid, List, SortAsc, MoreHorizontal, FileText, FileSpreadsheet, Film, Archive, File, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { useWorkspace } from '../contexts/WorkspaceContext'
import toast from 'react-hot-toast'

// ─── Constants & Configuration ──────────────────────────────────────────────

const FILE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  pdf:    { icon: FileText,        color: '#EF4444' },
  sketch: { icon: File,            color: '#7C3AED' },
  doc:    { icon: FileText,        color: '#3B82F6' },
  docx:   { icon: FileText,        color: '#3B82F6' },
  xlsx:   { icon: FileSpreadsheet, color: '#22C55E' },
  mp4:    { icon: Film,            color: '#F97316' },
  csv:    { icon: FileText,        color: '#06B6D4' },
  zip:    { icon: Archive,         color: '#F59E0B' },
  rar:    { icon: Archive,         color: '#F59E0B' },
  pptx:   { icon: File,            color: '#EC4899' },
  png:    { icon: File,            color: '#10B981' },
  jpg:    { icon: File,            color: '#10B981' },
  jpeg:   { icon: File,            color: '#10B981' },
}

const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  backdropFilter: 'blur(16px)',
}

// ─── Main Files Page Component ───────────────────────────────────────────────

export default function Files() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspace()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // ─── Queries ───

  // Query database documents list for the active workspace
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', activeWorkspaceId],
    queryFn: async () => {
      if (!activeWorkspaceId) return []
      const res = await api.get(`/upload/documents?workspaceId=${activeWorkspaceId}`)
      return res.data
    },
    enabled: !!activeWorkspaceId
  })

  // File Upload Mutation
  const { mutate: uploadFile } = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('workspaceId', activeWorkspaceId || '')
      const res = await api.post('/upload/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data
    },
    onSuccess: (data) => {
      setUploading(false)
      toast.success(`Uploaded ${data.name || 'file'} successfully!`)
      queryClient.invalidateQueries({ queryKey: ['documents', activeWorkspaceId] })
    },
    onError: (err: any) => {
      setUploading(false)
      toast.error('File upload failed')
    }
  })

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploading(true)
      uploadFile(file)
    }
  }

  // Calculate static aggregates from documents
  const fileCount = documents.length
  const totalSize = documents.reduce((acc: number, doc: any) => {
    const sizeVal = parseFloat(doc.size) || 0
    return acc + sizeVal
  }, 0).toFixed(1)

  // Categorize folders automatically
  const categories = [
    { name: 'Documents', types: ['pdf', 'doc', 'docx', 'txt'], count: 0, color: '#3B82F6', icon: '📄' },
    { name: 'Spreadsheets', types: ['xlsx', 'csv'], count: 0, color: '#22C55E', icon: '📊' },
    { name: 'Media Assets', types: ['mp4', 'png', 'jpg', 'jpeg', 'svg'], count: 0, color: '#EF4444', icon: '🖼️' },
    { name: 'Compressed Files', types: ['zip', 'rar', 'tar', 'gz'], count: 0, color: '#F59E0B', icon: '📦' },
  ]

  documents.forEach((doc: any) => {
    const ext = (doc.type || '').toLowerCase()
    const cat = categories.find(c => c.types.includes(ext))
    if (cat) cat.count++
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Loader2 size={32} className="animate-spin" color="#8b5cf6" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: 0, fontFamily: 'Poppins, sans-serif' }}>Files & Documents</h2>
          <p style={{ fontSize: 12, color: '#8b949e', marginTop: 3 }}>
            {fileCount} files uploaded &bull; {totalSize} MB space used
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            style={{
              background: uploading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #7C3AED, #2563EB)',
              border: 'none', color: 'white', fontSize: 12, fontWeight: 600,
              padding: '7px 14px', borderRadius: 8,
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: uploading ? 'none' : '0 4px 15px rgba(124,58,237,0.3)',
              transition: 'all 0.15s',
              opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>

      {/* Folders (Automatic Categorization) */}
      <div style={{ marginBottom: 10 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 12, fontFamily: 'Poppins, sans-serif' }}>Folder Categories</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {categories.map((folder, i) => (
            <motion.div
              key={folder.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              style={{
                ...glassCard,
                padding: 18, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
              }}
              onMouseEnter={(e: any) => {
                e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
              }}
              onMouseLeave={(e: any) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${folder.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, margin: '0 auto 10px',
              }}>
                {folder.icon}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 4 }}>{folder.name}</div>
              <div style={{ fontSize: 11, color: '#8b949e' }}>{folder.count} files</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Files List */}
      <div>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'white', marginBottom: 12, fontFamily: 'Poppins, sans-serif' }}>Recent Uploads</h3>
        {documents.length === 0 ? (
          <div style={{ padding: '40px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.08)', textAlign: 'center', color: '#8b949e', fontSize: 12 }}>
            No files uploaded yet in this workspace. Upload your first document!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
            {documents.map((file: any, i: number) => {
              const fileExt = (file.type || '').toLowerCase()
              const iconCfg = FILE_ICONS[fileExt] || { icon: File, color: '#8b949e' }
              const IconComp = iconCfg.icon
              return (
                <motion.div
                  key={file._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -2 }}
                  style={{
                    ...glassCard,
                    borderRadius: 10,
                    padding: 14, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e: any) => {
                    e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                  }}
                  onMouseLeave={(e: any) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  }}
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: `${iconCfg.color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <IconComp size={18} color={iconCfg.color} />
                    </div>
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: 'white', marginBottom: 3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 6 }}>{file.size}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {file.uploadedBy && (
                      <>
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%',
                          background: file.uploadedBy.color || '#8b5cf6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 8, fontWeight: 700, color: 'white',
                        }}>
                          {file.uploadedBy.initials || 'U'}
                        </div>
                        <span style={{ fontSize: 10, color: '#8b949e' }}>
                          {new Date(file.createdAt).toLocaleDateString()}
                        </span>
                      </>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
