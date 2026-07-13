import type { User, Project, Task, Column, Channel, CalendarEvent, FileItem, Folder, Workspace, AIMessage, Sprint } from '../types';

export const COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#f97316', '#6366f1', '#84cc16',
];

export const mockUsers: User[] = [
  { id: '1', name: 'Sarah K.', email: 'sarah@example.com', role: 'developer', status: 'active', joinedAt: 'Jan 15, 2024', workload: 95, initials: 'SK', color: '#8b5cf6' },
  { id: '2', name: 'Marcus T.', email: 'marcus@example.com', role: 'developer', status: 'active', joinedAt: 'Feb 20, 2024', workload: 72, initials: 'MT', color: '#3b82f6' },
  { id: '3', name: 'Priya S.', email: 'priya@example.com', role: 'designer', status: 'active', joinedAt: 'Mar 10, 2024', workload: 88, initials: 'PS', color: '#10b981' },
  { id: '4', name: 'James L.', email: 'james@example.com', role: 'developer', status: 'away', joinedAt: 'Apr 5, 2024', workload: 45, initials: 'JL', color: '#f59e0b' },
  { id: '5', name: 'Nina P.', email: 'nina@example.com', role: 'qa', status: 'active', joinedAt: 'May 12, 2024', workload: 60, initials: 'NP', color: '#06b6d4' },
  { id: '6', name: 'Alex R.', email: 'alex@example.com', role: 'project_manager', status: 'offline', joinedAt: 'Jun 1, 2024', workload: 80, initials: 'AR', color: '#ec4899' },
];

export const currentUser: User = {
  id: '6', name: 'Alex Rivera', email: 'alex@nexusai.com', role: 'project_manager',
  status: 'active', joinedAt: 'Jun 1, 2024', workload: 80, initials: 'AR', color: '#8b5cf6'
};

export const mockProjects: Project[] = [
  { id: '1', name: 'Mobile App v2.0', description: 'Complete redesign with AI-powered features', status: 'on_track', progress: 68, members: [mockUsers[0], mockUsers[1], mockUsers[2]], tasksTotal: 124, tasksDone: 84, deadline: 'Dec 15', color: '#8b5cf6', icon: '📱' },
  { id: '2', name: 'API Redesign', description: 'RESTful API v3 with improved performance', status: 'at_risk', progress: 42, members: [mockUsers[1], mockUsers[2]], tasksTotal: 89, tasksDone: 37, deadline: 'Dec 8', color: '#ef4444', icon: '⚙️' },
  { id: '3', name: 'Design System', description: 'Unified component library for all products', status: 'on_track', progress: 85, members: [mockUsers[0], mockUsers[2], mockUsers[4]], tasksTotal: 67, tasksDone: 57, deadline: 'Dec 20', color: '#10b981', icon: '🎨' },
  { id: '4', name: 'Data Pipeline', description: 'ML data ingestion and transformation', status: 'behind', progress: 31, members: [mockUsers[3], mockUsers[4]], tasksTotal: 143, tasksDone: 44, deadline: 'Nov 30', color: '#f97316', icon: '🔄' },
  { id: '5', name: 'Authentication v2', description: 'OAuth 2.0 with MFA support', status: 'on_track', progress: 56, members: [mockUsers[0], mockUsers[3]], tasksTotal: 45, tasksDone: 25, deadline: 'Dec 10', color: '#06b6d4', icon: '🔐' },
  { id: '6', name: 'Analytics Dashboard', description: 'Real-time metrics and reporting', status: 'on_track', progress: 73, members: [mockUsers[1], mockUsers[5]], tasksTotal: 98, tasksDone: 72, deadline: 'Dec 25', color: '#f59e0b', icon: '📊' },
];

export const mockTasks: Task[] = [
  { id: 't1', title: 'Implement dark mode', status: 'backlog', priority: 'medium', assignee: mockUsers[0], project: 'Mobile App v2.0', projectId: '1', labels: ['UI', 'v2.0'], progress: 0, dueDate: 'Dec 15', createdAt: '2024-12-01', comments: 3 },
  { id: 't2', title: 'Add push notifications', status: 'backlog', priority: 'high', assignee: mockUsers[1], project: 'Mobile App v2.0', projectId: '1', labels: ['Feature'], progress: 50, dueDate: 'Dec 20', createdAt: '2024-12-01', comments: 1 },
  { id: 't3', title: 'Update user documentation', status: 'todo', priority: 'low', assignee: mockUsers[2], project: 'API Redesign', projectId: '2', labels: ['Docs'], progress: 33, dueDate: 'Dec 10', createdAt: '2024-12-01', comments: 0 },
  { id: 't4', title: 'Fix login flow', status: 'todo', priority: 'high', assignee: mockUsers[0], project: 'Mobile App v2.0', projectId: '1', labels: ['Bug', 'High'], progress: 0, dueDate: 'Dec 5', createdAt: '2024-12-01', comments: 5 },
  { id: 't5', title: 'Optimize database queries', status: 'todo', priority: 'medium', assignee: mockUsers[1], project: 'API Redesign', projectId: '2', labels: ['Performance'], progress: 40, dueDate: 'Dec 12', createdAt: '2024-12-01', comments: 2 },
  { id: 't6', title: 'Design mobile layout', status: 'in_progress', priority: 'high', assignee: mockUsers[2], project: 'Mobile App v2.0', projectId: '1', labels: ['Design'], progress: 50, dueDate: 'Dec 8', createdAt: '2024-12-01', comments: 4 },
  { id: 't7', title: 'API authentication integration', status: 'in_progress', priority: 'high', assignee: mockUsers[1], project: 'API Redesign', projectId: '2', labels: ['Backend'], progress: 75, dueDate: 'Dec 6', createdAt: '2024-12-01', comments: 7 },
  { id: 't8', title: 'PR #2341: Search improvements', status: 'review', priority: 'medium', assignee: mockUsers[0], project: 'Mobile App v2.0', projectId: '1', labels: ['Review'], progress: 0, dueDate: 'Dec 4', createdAt: '2024-12-01', comments: 2 },
  { id: 't9', title: 'Component library v2', status: 'review', priority: 'low', assignee: mockUsers[2], project: 'Design System', projectId: '3', labels: ['Ready'], progress: 100, dueDate: 'Dec 3', createdAt: '2024-12-01', comments: 8 },
  { id: 't10', title: 'Fix search performance bug', status: 'backlog', priority: 'high', assignee: mockUsers[3], project: 'Mobile App v2.0', projectId: '1', labels: ['Bug'], progress: 60, dueDate: 'Dec 1', createdAt: '2024-11-28', comments: 3 },
  { id: 't11', title: 'Review API PR #2341', status: 'todo', priority: 'high', assignee: mockUsers[4], project: 'API Redesign', projectId: '2', labels: [], progress: 0, dueDate: 'Dec 5', createdAt: '2024-12-01', comments: 1 },
  { id: 't12', title: 'Design sprint retrospective', status: 'todo', priority: 'medium', assignee: mockUsers[2], project: 'Design System', projectId: '3', labels: [], progress: 0, dueDate: 'Dec 8', createdAt: '2024-12-01', comments: 0 },
  { id: 't13', title: 'Implement dark mode toggle', status: 'todo', priority: 'medium', assignee: mockUsers[0], project: 'Mobile App v2.0', projectId: '1', labels: [], progress: 0, dueDate: 'Dec 10', createdAt: '2024-12-01', comments: 0 },
  { id: 't14', title: 'Deploy to staging environment', status: 'todo', priority: 'low', assignee: mockUsers[1], project: 'API Redesign', projectId: '2', labels: [], progress: 0, dueDate: 'Dec 15', createdAt: '2024-12-01', comments: 0 },
];

export const mockColumns: Column[] = [
  { id: 'backlog', title: 'Backlog', tasks: mockTasks.filter(t => t.status === 'backlog'), color: '#8b949e' },
  { id: 'todo', title: 'To Do', tasks: mockTasks.filter(t => t.status === 'todo'), color: '#3b82f6' },
  { id: 'in_progress', title: 'In Progress', tasks: mockTasks.filter(t => t.status === 'in_progress'), color: '#f59e0b' },
  { id: 'review', title: 'Review', tasks: mockTasks.filter(t => t.status === 'review'), color: '#8b5cf6' },
];

export const mockChannels: Channel[] = [
  {
    id: 'general', name: 'general', unread: 0,
    messages: [
      { id: 'm1', sender: mockUsers[0], content: "Hey everyone, weekly standup in 10 minutes!", timestamp: '9:00 AM' },
      { id: 'm2', sender: mockUsers[1], content: "On my way!", timestamp: '9:01 AM' },
    ]
  },
  {
    id: 'mobile-app', name: 'mobile-app', unread: 3,
    messages: [
      { id: 'm3', sender: mockUsers[0], content: "Hey team, I've started on the mobile redesign", timestamp: '10:23 AM' },
      { id: 'm4', sender: mockUsers[1], content: "Nice! Looking forward to seeing it. When's the first draft?", timestamp: '10:25 AM' },
      { id: 'm5', sender: mockUsers[0], content: "Should have wireframes by end of day tomorrow", timestamp: '10:26 AM' },
      { id: 'm6', sender: mockUsers[5], content: "Perfect! Can you present in the design review on Friday?", timestamp: '10:28 AM', isSelf: true },
      { id: 'm7', sender: mockUsers[0], content: "Absolutely. That should give me enough time to get feedback.", timestamp: '10:29 AM' },
      { id: 'm8', sender: mockUsers[2], content: "I can also take a look earlier and give some input", timestamp: '10:31 AM' },
      { id: 'm9', sender: mockUsers[5], content: "Awesome! Let's sync Monday morning then", timestamp: '10:32 AM', isSelf: true },
    ]
  },
  { id: 'design-review', name: 'design-review', unread: 0, messages: [] },
  { id: 'api-development', name: 'api-development', unread: 5, messages: [] },
  { id: 'random', name: 'random', unread: 0, messages: [] },
];

export const mockCalendarEvents: CalendarEvent[] = [
  { id: 'e1', title: 'Sprint Planning', date: '2024-12-01', color: '#8b5cf6', time: '9:00 AM', type: 'sprint' },
  { id: 'e2', title: 'Design review', date: '2024-12-03', color: '#3b82f6', time: '2:00 PM', type: 'review' },
  { id: 'e3', title: 'Team standup', date: '2024-12-04', color: '#10b981', time: '9:30 AM', type: 'meeting' },
  { id: 'e4', title: 'User testing', date: '2024-12-05', color: '#f59e0b', time: '1:00 PM', type: 'meeting' },
  { id: 'e5', title: 'API review', date: '2024-12-05', color: '#06b6d4', time: '3:00 PM', type: 'review' },
  { id: 'e6', title: '1:1 Meeting', date: '2024-12-07', color: '#3b82f6', time: '10:00 AM', type: 'meeting' },
  { id: 'e7', title: 'Sprint Review', date: '2024-12-08', color: '#8b5cf6', time: '2:00 PM', type: 'review' },
  { id: 'e8', title: 'Retrospective', date: '2024-12-08', color: '#f59e0b', time: '4:00 PM', type: 'sprint' },
  { id: 'e9', title: 'Deadline: API v3', date: '2024-12-10', color: '#ef4444', time: '5:00 PM', type: 'deadline' },
  { id: 'e10', title: 'Design System', date: '2024-12-12', color: '#10b981', time: '11:00 AM', type: 'review' },
  { id: 'e11', title: 'Discussion', date: '2024-12-12', color: '#6366f1', time: '2:00 PM', type: 'meeting' },
  { id: 'e12', title: 'Product Sync', date: '2024-12-14', color: '#3b82f6', time: '3:00 PM', type: 'meeting' },
  { id: 'e13', title: 'Release v2.0', date: '2024-12-15', color: '#10b981', time: '9:00 AM', type: 'sprint' },
  { id: 'e14', title: 'User Feedback', date: '2024-12-17', color: '#f59e0b', time: '1:00 PM', type: 'meeting' },
  { id: 'e15', title: 'Sprint 13 starts', date: '2024-12-20', color: '#8b5cf6', time: '9:00 AM', type: 'sprint' },
  { id: 'e16', title: 'Q4 Planning', date: '2024-12-23', color: '#ec4899', time: '10:00 AM', type: 'meeting' },
  { id: 'e17', title: 'Holiday Party', date: '2024-12-26', color: '#f97316', time: '6:00 PM', type: 'other' },
  { id: 'e18', title: 'Year-end review', date: '2024-12-31', color: '#06b6d4', time: '2:00 PM', type: 'review' },
];

export const mockFiles: FileItem[] = [
  { id: 'f1', name: 'Design System v2.0.pdf', type: 'pdf', size: '2.4 MB', uploadedBy: mockUsers[0], uploadedAt: 'Dec 5, 2:30 PM', folder: 'Design System' },
  { id: 'f2', name: 'Mobile Wireframes.sketch', type: 'sketch', size: '8.1 MB', uploadedBy: mockUsers[2], uploadedAt: 'Dec 4, 11:45 AM', folder: 'Mobile App v2.0' },
  { id: 'f3', name: 'API Specification.doc', type: 'doc', size: '1.2 MB', uploadedBy: mockUsers[1], uploadedAt: 'Dec 3, 4:45 PM', folder: 'API Documentation' },
  { id: 'f4', name: 'User Testing Results.xlsx', type: 'xlsx', size: '3.5 MB', uploadedBy: mockUsers[5], uploadedAt: 'Dec 2, 10:20 AM', folder: 'Mobile App v2.0' },
  { id: 'f5', name: 'Sprint Demo Video.mp4', type: 'mp4', size: '87 MB', uploadedBy: mockUsers[3], uploadedAt: 'Dec 1, 3:00 PM', folder: 'Team Resources' },
  { id: 'f6', name: 'Performance Metrics.csv', type: 'csv', size: '0.5 MB', uploadedBy: mockUsers[0], uploadedAt: 'Nov 30, 9:30 AM', folder: 'Mobile App v2.0' },
  { id: 'f7', name: 'Design Assets.zip', type: 'zip', size: '45 MB', uploadedBy: mockUsers[2], uploadedAt: 'Nov 29, 2:15 PM', folder: 'Design System' },
  { id: 'f8', name: 'Presentation Slides.pptx', type: 'pptx', size: '5.2 MB', uploadedBy: mockUsers[4], uploadedAt: 'Nov 28, 1:45 PM', folder: 'Team Resources' },
];

export const mockFolders: Folder[] = [
  { id: 'fl1', name: 'Mobile App v2.0', fileCount: 24, color: '#8b5cf6', icon: '📱' },
  { id: 'fl2', name: 'Design System', fileCount: 16, color: '#3b82f6', icon: '🎨' },
  { id: 'fl3', name: 'API Documentation', fileCount: 12, color: '#10b981', icon: '📄' },
  { id: 'fl4', name: 'Team Resources', fileCount: 8, color: '#f59e0b', icon: '👥' },
];

export const mockWorkspaces: Workspace[] = [
  { id: 'w1', name: 'Acme Corporation', slug: 'acme-corp', description: 'Main workspace for Acme Corp projects', type: 'organization', members: mockUsers, status: 'active', createdAt: '2024-01-01', initials: 'AC', color: '#8b5cf6' },
  { id: 'w2', name: 'Design Studio', slug: 'design-studio', description: 'Creative design team workspace', type: 'team', members: mockUsers.slice(0, 3), status: 'active', createdAt: '2024-02-15', initials: 'DS', color: '#3b82f6' },
  { id: 'w3', name: 'Technova Inc.', slug: 'technova-inc', description: 'Tech innovation projects', type: 'organization', members: mockUsers.slice(1, 5), status: 'active', createdAt: '2024-03-01', initials: 'TI', color: '#10b981' },
  { id: 'w4', name: 'DevOps Team', slug: 'devops-team', description: 'Infrastructure and DevOps', type: 'team', members: mockUsers.slice(2), status: 'archived', createdAt: '2024-04-10', initials: 'DT', color: '#f59e0b' },
];

export const mockSprints: Sprint[] = [
  { id: 's1', name: 'S1', startDate: '2024-10-01', endDate: '2024-10-14', velocity: 32, target: 40, status: 'completed' },
  { id: 's2', name: 'S2', startDate: '2024-10-15', endDate: '2024-10-28', velocity: 45, target: 40, status: 'completed' },
  { id: 's3', name: 'S3', startDate: '2024-10-29', endDate: '2024-11-11', velocity: 38, target: 42, status: 'completed' },
  { id: 's4', name: 'S4', startDate: '2024-11-12', endDate: '2024-11-25', velocity: 43, target: 42, status: 'completed' },
  { id: 's5', name: 'S5', startDate: '2024-11-26', endDate: '2024-12-09', velocity: 55, target: 45, status: 'completed' },
  { id: 's6', name: 'S6', startDate: '2024-12-10', endDate: '2024-12-23', velocity: 58, target: 50, status: 'completed' },
  { id: 's7', name: 'S7', startDate: '2024-12-24', endDate: '2025-01-06', velocity: 64, target: 55, status: 'completed' },
  { id: 's8', name: 'S8', startDate: '2025-01-07', endDate: '2025-01-20', velocity: 68, target: 60, status: 'completed' },
  { id: 's9', name: 'S9', startDate: '2025-01-21', endDate: '2025-02-03', velocity: 61, target: 65, status: 'completed' },
  { id: 's10', name: 'S10', startDate: '2025-02-04', endDate: '2025-02-17', velocity: 62, target: 65, status: 'completed' },
];

export const mockAIMessages: AIMessage[] = [
  {
    id: 'ai1',
    role: 'assistant',
    content: 'I notice Sprint 12 is ending in 3 days. Would you like me to:\n• Prepare a sprint retrospective summary\n• Identify incomplete high-priority tasks\n• Suggest Sprint 13 improvements based on velocity',
    timestamp: '7:34 PM'
  },
  {
    id: 'ai2',
    role: 'user',
    content: 'Yes, please prepare all three and send them to my email. Also, what\'s the current team workload looking like?',
    timestamp: '7:35 PM'
  },
  {
    id: 'ai3',
    role: 'assistant',
    content: "Perfect! I've prepared everything. Here's your team workload summary:",
    timestamp: '7:37 PM',
    data: {
      type: 'workload',
      items: [
        { name: 'Sarah K.', workload: 95, color: '#ef4444' },
        { name: 'Marcus T.', workload: 72, color: '#f59e0b' },
        { name: 'Priya S.', workload: 88, color: '#ef4444' },
      ],
      recommendation: 'Consider moving 2-3 tasks from Sarah or Priya to balance the load.'
    }
  }
];
