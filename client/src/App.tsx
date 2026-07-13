import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Board = lazy(() => import('./pages/Board'))
const Projects = lazy(() => import('./pages/Projects'))
const MyTasks = lazy(() => import('./pages/MyTasks'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Chat = lazy(() => import('./pages/Chat'))
const Team = lazy(() => import('./pages/Team'))
const Reports = lazy(() => import('./pages/Reports'))
const Files = lazy(() => import('./pages/Files'))
const AIAssistant = lazy(() => import('./pages/AIAssistant'))
const TaskDetail = lazy(() => import('./pages/TaskDetail'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const OTPVerification = lazy(() => import('./pages/auth/OTPVerification'))
const WorkspaceList = lazy(() => import('./pages/workspace/WorkspaceList'))
const CreateWorkspace = lazy(() => import('./pages/workspace/CreateWorkspace'))
const WorkspaceSettings = lazy(() => import('./pages/workspace/WorkspaceSettings'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))

const PageLoading = () => (
  <div className="w-full h-full flex flex-col gap-4 p-6 animate-pulse">
    <div className="h-8 bg-white/5 rounded-md w-1/4" />
    <div className="h-4 bg-white/5 rounded-md w-1/2" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      <div className="h-32 bg-white/5 rounded-xl" />
      <div className="h-32 bg-white/5 rounded-xl" />
      <div className="h-32 bg-white/5 rounded-xl" />
    </div>
    <div className="h-64 bg-white/5 rounded-xl mt-6" />
  </div>
)

const isClerkEnabled = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.includes('Zm9vYmFy') && !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.includes('disabled');

function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AnimatePresence mode="wait">
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/auth/verify-otp" element={<OTPVerification />} />
          <Route path="/sso-callback" element={
            isClerkEnabled ? (
              <AuthenticateWithRedirectCallback signUpForceRedirectUrl="/dashboard" signInForceRedirectUrl="/dashboard" />
            ) : (
              <Navigate to="/auth/login" replace />
            )
          } />

          {/* Workspace Routes */}
          <Route path="/workspaces" element={<WorkspaceList />} />
          <Route path="/workspaces/create" element={<CreateWorkspace />} />
          <Route path="/workspaces/:id/settings" element={<WorkspaceSettings />} />

          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminDashboard />} />

          {/* Main App Routes - Protected */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="board" element={<Board />} />
            <Route path="projects" element={<Projects />} />
            <Route path="tasks" element={<MyTasks />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="chat" element={<Chat />} />
            <Route path="team" element={<Team />} />
            <Route path="reports" element={<Reports />} />
            <Route path="files" element={<Files />} />
            <Route path="ai" element={<AIAssistant />} />
            <Route path="tasks/:id" element={<TaskDetail />} />
          </Route>

          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}

export default App
