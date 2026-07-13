import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Users, Layers, DollarSign, Activity, Shield, Settings, LogOut, Zap, Server, Database, Mail, Cpu, TrendingUp, CheckCircle, AlertTriangle, Clock, Search, Plus, MoreHorizontal, Filter, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'

const adminNav = [
  { id: 'dashboard', label: 'Admin Dashboard', icon: Layers },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'workspaces', label: 'Workspaces', icon: Layers },
  { id: 'health', label: 'System Health', icon: Server },
  { id: 'subscriptions', label: 'Subscriptions', icon: DollarSign },
  { id: 'payments', label: 'Payments', icon: DollarSign },
  { id: 'logs', label: 'Activity Logs', icon: Activity },
  { id: 'settings', label: 'System Settings', icon: Settings },
]

const revenueData = [
  { month: 'May 27', value: 24000 }, { month: 'May 28', value: 26000 },
  { month: 'May 29', value: 23000 }, { month: 'May 30', value: 28000 },
  { month: 'May 31', value: 31000 }, { month: 'Jun 1', value: 29000 },
]

const userDistribution = [
  { name: 'Free', value: 1208, color: '#484f58' },
  { name: 'Pro', value: 892, color: '#3b82f6' },
  { name: 'Business', value: 325, color: '#8b5cf6' },
  { name: 'Enterprise', value: 118, color: '#10b981' },
]


const services = [
  { name: 'API Service', status: 'Operational', uptime: '99.9%', icon: Server, color: '#10b981' },
  { name: 'Database', status: 'Operational', uptime: '100%', icon: Database, color: '#10b981' },
  { name: 'File Storage', status: 'Degraded', uptime: '98.2%', icon: Layers, color: '#f59e0b' },
  { name: 'AI Service', status: 'Operational', uptime: '99.5%', icon: Cpu, color: '#10b981' },
  { name: 'Email', status: 'Operational', uptime: '99.8%', icon: Mail, color: '#10b981' },
]

const plans = [
  { name: 'Free', users: '1,208', revenue: '$0', color: '#484f58', bg: 'rgba(72,79,88,0.15)' },
  { name: 'Pro', users: '892', revenue: '$13,380', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  { name: 'Business', users: '325', revenue: '$8,125', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  { name: 'Enterprise', users: '118', revenue: '$11,800', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
]

const payments = [
  { user: 'Acme Corp', plan: 'Business', amount: '$250', date: 'May 29, 2024', status: 'Succeeded' },
  { user: 'TechNova Inc', plan: 'Enterprise', amount: '$100', date: 'May 29, 2024', status: 'Succeeded' },
  { user: 'Design Studio', plan: 'Pro', amount: '$15', date: 'May 29, 2024', status: 'Succeeded' },
  { user: 'DevOps Team', plan: 'Business', amount: '$250', date: 'May 29, 2024', status: 'Failed' },
  { user: 'Alpha Labs', plan: 'Enterprise', amount: '$100', date: 'May 29, 2024', status: 'Pending' },
]

const logs = [
  { user: 'SK', name: 'Sarah K.', action: 'Created workspace NexusAI Dev', time: 'May 29, 5:30 PM', status: 'Success', ip: '192.168.1.1', color: '#8b5cf6' },
  { user: 'MT', name: 'Marcus T.', action: 'Updated API rate limiting', time: 'May 29, 4:25 PM', status: 'Success', ip: '192.168.1.2', color: '#3b82f6' },
  { user: 'PS', name: 'Priya S.', action: 'Upgraded plan to Business', time: 'May 29, 3:10 PM', status: 'Success', ip: '192.168.1.3', color: '#10b981' },
  { user: 'AR', name: 'Alex R.', action: 'Changed user role', time: 'May 29, 2:05 PM', status: 'Failed', ip: '192.168.1.4', color: '#f59e0b' },
  { user: 'JL', name: 'James L.', action: 'Deleted project Data Pipeline', time: 'May 29, 1:00 PM', status: 'Warning', ip: '192.168.1.5', color: '#ef4444' },
]

const statusBadge = (status: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    Success: { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
    Failed: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
    Pending: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
    Warning: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
    Succeeded: { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
    Suspended: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
    Active: { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
    Operational: { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
    Degraded: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
  }
  const cfg = map[status] || { bg: '#21262d', color: '#8b949e' }
  return <span style={{ background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>{status}</span>
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users')
      return res.data
    },
    enabled: activeTab === 'users'
  })

  const { mutate: changeRole } = useMutation({
    mutationFn: async ({ id, role }: { id: string, role: string }) => {
      const res = await api.patch(`/admin/users/${id}/role`, { role })
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to update role')
  })

  const { mutate: changeStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await api.patch(`/admin/users/${id}/status`, { status })
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    onError: (err: any) => alert(err.response?.data?.message || 'Failed to update status')
  })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#0d1117' }}>
      {/* Admin Sidebar */}
      <aside style={{ width: 200, minWidth: 200, background: '#161b22', borderRight: '1px solid #21262d', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ padding: '16px 12px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#ef4444,#f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={14} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#e6edf3' }}>NexusAI Admin</div>
            <div style={{ fontSize: 10, color: '#484f58' }}>System Management</div>
          </div>
        </div>
        <div style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
          {adminNav.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px',
                borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                marginBottom: 2, textAlign: 'left',
                background: activeTab === item.id ? 'rgba(239,68,68,0.12)' : 'transparent',
                color: activeTab === item.id ? '#f87171' : '#8b949e',
              }}
            ><item.icon size={13} />{item.label}</button>
          ))}
        </div>
        <div style={{ padding: '10px 8px', borderTop: '1px solid #21262d' }}>
          <button onClick={() => navigate('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'none', color: '#8b949e', fontSize: 12 }}><LogOut size={13} />Exit Admin</button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Admin topbar */}
        <div style={{ height: 52, background: '#161b22', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e6edf3' }}>Admin Dashboard</div>
          <div style={{ fontSize: 12, color: '#484f58' }}>May 29, May 31, 2024</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {/* ====== DASHBOARD TAB ====== */}
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
                {[
                  { label: 'Workspaces', value: '2,543', change: '+12', icon: Layers, color: '#8b5cf6' },
                  { label: 'Users', value: '1,284', change: '+89', icon: Users, color: '#3b82f6' },
                  { label: 'Monthly Revenue', value: '$28,660', change: '+15%', icon: DollarSign, color: '#10b981' },
                  { label: 'Transactions', value: '1,672', change: '+23', icon: TrendingUp, color: '#f59e0b' },
                ].map((card, i) => (
                  <div key={i} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: '#8b949e' }}>{card.label}</span>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <card.icon size={14} color={card.color} />
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#e6edf3' }}>{card.value}</div>
                    <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginTop: 4 }}>{card.change}</div>
                    <div style={{ fontSize: 11, color: '#484f58' }}>vs last month</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {/* System Health */}
                <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: 14 }}>System Health</div>
                  {services.map((svc, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < services.length - 1 ? '1px solid #21262d' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svc.icon size={13} color={svc.color} />
                        <span style={{ fontSize: 12, color: '#e6edf3' }}>{svc.name}</span>
                      </div>
                      {statusBadge(svc.status)}
                    </div>
                  ))}
                </div>

                {/* Users Overview */}
                <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: 14 }}>Users Overview</div>
                  <div style={{ position: 'relative', height: 140 }}>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={userDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={0}>
                          {userDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#e6edf3' }}>2,543</div>
                      <div style={{ fontSize: 10, color: '#8b949e' }}>Total</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                    {userDistribution.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} /><span style={{ fontSize: 11, color: '#8b949e' }}>{d.name}</span></div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#e6edf3' }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue chart */}
                <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: 4 }}>Revenue (Stripe)</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#e6edf3' }}>$28,660</div>
                  <div style={{ fontSize: 12, color: '#10b981', fontWeight: 600, marginBottom: 14 }}>+15.2% vs last month</div>
                  <ResponsiveContainer width="100%" height={100}>
                    <LineChart data={revenueData}>
                      <Tooltip contentStyle={{ background: '#1c2128', border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3', fontSize: 11 }} formatter={(v: any) => `$${(v/1000).toFixed(0)}k`} />
                      <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* ====== USERS TAB ====== */}
          {activeTab === 'users' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="#484f58" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input placeholder="Search users..." style={{ background: '#21262d', border: '1px solid #30363d', borderRadius: 8, color: '#e6edf3', fontSize: 12, padding: '8px 12px 8px 32px', outline: 'none', width: 240, boxSizing: 'border-box' }} />
                </div>
                <button style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', border: 'none', color: 'white', fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={13} />Add User</button>
              </div>
              <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid #21262d' }}>
                    {['User', 'Email', 'Role', 'Plan', 'Status', 'Joined', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#484f58', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {isLoadingUsers ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="lucide-spin" color="#8b5cf6" size={24} style={{ animation: 'spin 1s linear infinite' }} /></td></tr>
                    ) : (
                      (usersData || []).map((u: any, i: number) => (
                        <tr key={u._id || i} style={{ borderBottom: '1px solid #21262d', cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#1c2128')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {u.avatar ? (
                                <img src={u.avatar} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: 30, height: 30, borderRadius: '50%', background: u.color || '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white' }}>{u.initials || u.name?.substring(0, 2).toUpperCase()}</div>
                              )}
                              <span style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>{u.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: '#8b949e' }}>{u.email}</td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: '#8b949e' }}>
                            <select 
                              value={u.role} 
                              onChange={(e) => changeRole({ id: u._id, role: e.target.value })}
                              style={{ background: '#0d1117', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 4, padding: '4px' }}
                            >
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                              <option value="project_manager">PM</option>
                              <option value="developer">Developer</option>
                              <option value="qa">QA</option>
                              <option value="designer">Designer</option>
                              <option value="client">Client</option>
                              <option value="guest">Guest</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: '#8b949e' }}>Enterprise</td>
                          <td style={{ padding: '12px 16px' }}>
                            <select 
                              value={u.status} 
                              onChange={(e) => changeStatus({ id: u._id, status: e.target.value })}
                              style={{ background: '#0d1117', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 4, padding: '4px', appearance: 'none', cursor: 'pointer' }}
                            >
                              <option value="active">Active</option>
                              <option value="away">Away</option>
                              <option value="offline">Offline</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: '#484f58' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td style={{ padding: '12px 16px' }}><button style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}><MoreHorizontal size={14} /></button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ====== HEALTH TAB ====== */}
          {activeTab === 'health' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3', marginBottom: 20 }}>System Health</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {services.map((svc, i) => (
                  <div key={i} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${svc.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svc.icon size={16} color={svc.color} />
                      </div>
                      <div><div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>{svc.name}</div><div style={{ fontSize: 11, color: '#8b949e' }}>Uptime: {svc.uptime}</div></div>
                    </div>
                    {statusBadge(svc.status)}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ====== SUBSCRIPTIONS TAB ====== */}
          {activeTab === 'subscriptions' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3', marginBottom: 20 }}>Subscriptions & Plans</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {plans.map((plan, i) => (
                  <div key={i} style={{ background: plan.bg, border: `1px solid ${plan.color}40`, borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: plan.color, marginBottom: 4 }}>{plan.name}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#e6edf3', marginBottom: 2 }}>{plan.users}</div>
                    <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 8 }}>users</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>{plan.revenue}</div>
                    <div style={{ fontSize: 11, color: '#8b949e' }}>revenue</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ====== PAYMENTS TAB ====== */}
          {activeTab === 'payments' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3' }}>Payments (Stripe)</h2>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>Total: <span style={{ color: '#10b981' }}>$28,660</span></div>
              </div>
              <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid #21262d' }}>
                    {['User/Workspace', 'Plan', 'Amount', 'Date', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#484f58', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {payments.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #21262d' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#1c2128')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>{p.user}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#8b949e' }}>{p.plan}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#e6edf3' }}>{p.amount}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#484f58' }}>{p.date}</td>
                        <td style={{ padding: '12px 16px' }}>{statusBadge(p.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ====== LOGS TAB ====== */}
          {activeTab === 'logs' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3', marginBottom: 20 }}>Activity Logs</h2>
              <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ borderBottom: '1px solid #21262d' }}>
                    {['User', 'Action', 'IP', 'Time', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: '#484f58', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #21262d' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#1c2128')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: log.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white' }}>{log.user}</div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#e6edf3' }}>{log.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: '#8b949e' }}>{log.action}</td>
                        <td style={{ padding: '12px 16px', fontSize: 11, color: '#484f58' }}>{log.ip}</td>
                        <td style={{ padding: '12px 16px', fontSize: 11, color: '#484f58' }}>{log.time}</td>
                        <td style={{ padding: '12px 16px' }}>{statusBadge(log.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ====== OTHER TABS ====== */}
          {!['dashboard', 'users', 'health', 'subscriptions', 'payments', 'logs'].includes(activeTab) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🚧</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#e6edf3', marginBottom: 8, textTransform: 'capitalize' }}>{activeTab}</h3>
              <p style={{ fontSize: 13, color: '#8b949e' }}>This admin section is coming soon.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
