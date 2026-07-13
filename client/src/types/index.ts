export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'project_manager' | 'developer' | 'qa' | 'designer' | 'client' | 'guest';
  status: 'active' | 'away' | 'offline';
  joinedAt: string;
  workload?: number; // percentage
  initials: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'on_track' | 'at_risk' | 'behind' | 'completed';
  progress: number;
  members: User[];
  tasksTotal: number;
  tasksDone: number;
  deadline: string;
  color: string;
  icon: string;
}

export interface Task {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'high' | 'medium' | 'low';
  assignee?: User;
  reporter?: User;
  project: string;
  projectId: string;
  storyPoints?: number;
  sprint?: string;
  labels: string[];
  subtasks?: Subtask[];
  dependencies?: string[];
  startDate?: string;
  dueDate?: string;
  createdAt: string;
  progress?: number;
  attachments?: number;
  comments?: number;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  children?: Subtask[];
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
}

export interface Message {
  id: string;
  sender: User;
  content: string;
  timestamp: string;
  isSelf?: boolean;
  reactions?: { emoji: string; count: number }[];
}

export interface Channel {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  unread?: number;
  messages: Message[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  color: string;
  time?: string;
  type: 'meeting' | 'deadline' | 'review' | 'sprint' | 'other';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  velocity: number;
  target: number;
  status: 'active' | 'completed' | 'planned';
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  data?: any;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'pdf' | 'sketch' | 'doc' | 'xlsx' | 'mp4' | 'csv' | 'zip' | 'pptx' | 'png' | 'jpg';
  size: string;
  uploadedBy: User;
  uploadedAt: string;
  folder?: string;
}

export interface Folder {
  id: string;
  name: string;
  fileCount: number;
  color: string;
  icon: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  type: 'team' | 'organization';
  members: User[];
  status: 'active' | 'archived';
  createdAt: string;
  initials: string;
  color: string;
}
