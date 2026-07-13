import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Upload, ArrowLeft } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function CreateWorkspace() {
  const [form, setForm] = useState({ name: '', slug: '', description: '', type: 'team' as 'team' | 'organization' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { mutate: createWorkspace, isPending } = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await api.post('/workspaces', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      toast.success('Workspace created successfully!');
      navigate('/workspaces');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create workspace');
    }
  });

  const handleNameChange = (name: string) => {
    setForm(prev => ({ ...prev, name, slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') }))
  }

  const handleSubmit = () => {
    if (!form.name || !form.slug) return toast.error('Name and slug are required');
    createWorkspace(form);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#e6edf3' }}>NexusAI</h1>
            <p style={{ fontSize: 12, color: '#8b949e' }}>Create Workspace</p>
          </div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 16, padding: 36 }}>
          <button onClick={() => navigate('/workspaces')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', fontSize: 12, marginBottom: 20, padding: 0 }}><ArrowLeft size={13} />Back</button>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3', marginBottom: 4 }}>Create Workspace</h2>
          <p style={{ fontSize: 13, color: '#8b949e', marginBottom: 24 }}>Set up your team's project management hub.</p>

          {/* Logo Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#21262d', border: '2px dashed #30363d', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Upload size={18} color="#484f58" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>Workspace Logo</div>
              <div style={{ fontSize: 12, color: '#8b949e' }}>Upload your team logo (optional)</div>
            </div>
          </div>

          {/* Form Fields */}
          {[
            { key: 'name', label: 'Workspace Name', placeholder: 'Acme Corporation', onChange: (v: string) => handleNameChange(v) },
            { key: 'slug', label: 'Workspace Slug', placeholder: 'acme-corporation', onChange: (v: string) => setForm(prev => ({ ...prev, slug: v })) },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', display: 'block', marginBottom: 6 }}>{field.label}</label>
              <input
                value={(form as any)[field.key]}
                onChange={e => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                style={{ width: '100%', background: '#1c2128', border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3', fontSize: 13, padding: '10px 12px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
                onBlur={e => (e.target.style.borderColor = '#30363d')}
              />
            </div>
          ))}

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', display: 'block', marginBottom: 6 }}>Description (optional)</label>
            <textarea
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="This is the official workspace for Acme Corp projects."
              rows={3}
              style={{ width: '100%', background: '#1c2128', border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3', fontSize: 13, padding: '10px 12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              onFocus={e => (e.target.style.borderColor = '#8b5cf6')}
              onBlur={e => (e.target.style.borderColor = '#30363d')}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#8b949e', display: 'block', marginBottom: 10 }}>Workspace Type</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['team', 'organization'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setForm(prev => ({ ...prev, type }))}
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                    background: form.type === type ? 'rgba(139,92,246,0.12)' : '#1c2128',
                    border: `1px solid ${form.type === type ? '#8b5cf6' : '#30363d'}`,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: form.type === type ? '#a78bfa' : '#e6edf3', marginBottom: 3, textTransform: 'capitalize' }}>{type}</div>
                  <div style={{ fontSize: 11, color: '#8b949e' }}>{type === 'team' ? 'Small to mid-size team' : 'Large organization'}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('/workspaces')} style={{ flex: 1, background: '#21262d', border: '1px solid #30363d', color: '#e6edf3', fontSize: 13, fontWeight: 600, padding: '11px 0', borderRadius: 10, cursor: 'pointer' }}>Cancel</button>
            <motion.button
              whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={isPending}
              style={{ flex: 2, background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', border: 'none', color: 'white', fontSize: 13, fontWeight: 700, padding: '11px 0', borderRadius: 10, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1 }}
            >{isPending ? 'Creating...' : 'Create Workspace'}</motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
