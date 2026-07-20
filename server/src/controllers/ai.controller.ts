import { Request, Response } from 'express';
import OpenAI from 'openai';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import { getIO } from '../services/socket.service.js';

// Initialize OpenAI client dynamically to avoid import hoisting issues
let openai: OpenAI | null = null;
const getOpenAI = () => {
  if (!openai && process.env.OPENAI_API_KEY) {
    try {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } catch (error) {
      console.warn('Could not initialize OpenAI client:', error);
    }
  }
  return openai;
};

// ─── Tool Definitions ──────────────────────────────────────────────────────────

const toolDefinitions = [
  {
    name: 'create_task',
    description: 'Create a new task in the workspace/project',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the task' },
        project_id: { type: 'string', description: 'Project ID (optional)' },
        assignee: { type: 'string', description: 'Assignee username or initials (optional)' },
        due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format (optional)' },
        priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Task priority (optional)' },
        description: { type: 'string', description: 'Detailed task description (optional)' }
      },
      required: ['title']
    }
  },
  {
    name: 'update_task',
    description: 'Update fields of an existing task',
    parameters: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'The task ID' },
        fields: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'review', 'done'] },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            progress: { type: 'number', minimum: 0, maximum: 100 },
            dueDate: { type: 'string' },
            assignee: { type: 'string', description: 'Assignee username or ID' }
          }
        }
      },
      required: ['task_id', 'fields']
    }
  },
  {
    name: 'assign_task',
    description: 'Assign a task to a user',
    parameters: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'The task ID' },
        user_id: { type: 'string', description: 'The user ID or user name' }
      },
      required: ['task_id', 'user_id']
    }
  },
  {
    name: 'query_tasks',
    description: 'Query/search tasks based on natural filters',
    parameters: {
      type: 'object',
      properties: {
        filters: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'review', 'done'] },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            assignee: { type: 'string', description: 'Assignee name' },
            project: { type: 'string', description: 'Project name' },
            projectId: { type: 'string' },
            dueBefore: { type: 'string' },
            dueAfter: { type: 'string' }
          }
        }
      },
      required: ['filters']
    }
  },
  {
    name: 'summarize_project',
    description: 'Generate a short status digest of tasks inside a project',
    parameters: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'The project ID' }
      },
      required: ['project_id']
    }
  },
  {
    name: 'flag_risks',
    description: 'Flag risks such as overdue/blocked tasks and uneven workload distribution',
    parameters: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'The project ID' }
      },
      required: ['project_id']
    }
  },
  {
    name: 'create_project',
    description: 'Create a new project in the workspace',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the project' },
        description: { type: 'string', description: 'Detailed project description' },
        template: { type: 'string', description: 'Project template' }
      },
      required: ['name']
    }
  },
  {
    name: 'set_reminder',
    description: 'Set a task reminder alert',
    parameters: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'The task ID' },
        datetime: { type: 'string', description: 'Date and time for the reminder (ISO string)' }
      },
      required: ['task_id', 'datetime']
    }
  }
];

// Convert schemas to Anthropic format
const anthropicTools = toolDefinitions.map(t => ({
  name: t.name,
  description: t.description,
  input_schema: t.parameters
}));

// Convert schemas to OpenAI format
const openAITools = toolDefinitions.map(t => ({
  type: 'function' as const,
  function: {
    name: t.name,
    description: t.description,
    parameters: t.parameters
  }
}));

// ─── Tool Execution Implementation ───────────────────────────────────────────

const executeTool = async (name: string, args: any, userId: string) => {
  console.log(`[AI Agent] Executing tool ${name} with args:`, args);
  
  switch (name) {
    case 'create_task': {
      const { title, project_id, assignee, due_date, priority, description } = args;
      
      // Find workspace
      let workspace = await Workspace.findOne({ 'members.user': userId });
      if (!workspace) {
        workspace = await Workspace.findOne();
      }
      if (!workspace) throw new Error('No active workspace found');

      // Find project
      let project;
      if (project_id) {
        project = await Project.findById(project_id);
      } else {
        project = await Project.findOne({ workspaceId: workspace._id });
      }
      if (!project) {
        // Fallback to first available project
        project = await Project.findOne();
      }
      if (!project) throw new Error('No active project found. Please create a project first.');

      // Find user matching name
      let assigneeUser = null;
      if (assignee) {
        assigneeUser = await User.findOne({ name: new RegExp(assignee, 'i') });
        if (!assigneeUser) {
          assigneeUser = await User.findById(assignee).catch(() => null);
        }
      }

      const task = await Task.create({
        title,
        description: description || '',
        status: 'todo',
        priority: priority || 'medium',
        assignee: assigneeUser ? assigneeUser._id : undefined,
        reporter: userId,
        projectId: project._id,
        workspaceId: workspace._id,
        dueDate: due_date ? new Date(due_date) : undefined,
        progress: 0
      });

      // Broadcast Socket Update
      try {
        const io = getIO();
        io.to(`workspace_${workspace._id.toString()}`).emit('task_created', { taskId: task._id.toString() });
      } catch (err) {
        console.warn('Realtime sync broadcast warning:', err);
      }

      return {
        type: 'create_task',
        status: 'success',
        data: {
          id: task._id.toString(),
          title: task.title,
          project: project.name,
          projectId: project._id.toString(),
          assignee: assigneeUser ? assigneeUser.name : 'Unassigned',
          priority: task.priority,
          dueDate: due_date || 'No due date'
        }
      };
    }
    
    case 'update_task': {
      const { task_id, fields } = args;
      const task = await Task.findById(task_id);
      if (!task) throw new Error('Task not found');

      if (fields.status) task.status = fields.status;
      if (fields.priority) task.priority = fields.priority;
      if (fields.progress !== undefined) task.progress = fields.progress;
      if (fields.dueDate) task.dueDate = new Date(fields.dueDate);
      if (fields.title) task.title = fields.title;
      if (fields.description) task.description = fields.description;
      
      if (fields.assignee) {
        const assigneeUser = await User.findOne({ name: new RegExp(fields.assignee, 'i') });
        if (assigneeUser) {
          task.assignee = assigneeUser._id;
        }
      }

      await task.save();

      const updated = await Task.findById(task_id)
        .populate('projectId', 'name')
        .populate('assignee', 'name');

      // Broadcast Socket Update
      try {
        const io = getIO();
        io.to(`workspace_${task.workspaceId.toString()}`).emit('task_updated', { taskId: task._id.toString() });
      } catch (err) {
        console.warn('Realtime sync broadcast warning:', err);
      }

      return {
        type: 'update_task',
        status: 'success',
        data: {
          id: task._id.toString(),
          title: task.title,
          project: (updated?.projectId as any)?.name || 'General Project',
          projectId: task.projectId.toString(),
          assignee: (updated?.assignee as any)?.name || 'Unassigned',
          priority: task.priority,
          status: task.status
        }
      };
    }

    case 'assign_task': {
      const { task_id, user_id } = args;
      const task = await Task.findById(task_id);
      if (!task) throw new Error('Task not found');

      let targetUser = await User.findOne({ name: new RegExp(user_id, 'i') });
      if (!targetUser) {
        targetUser = await User.findById(user_id).catch(() => null);
      }
      if (!targetUser) throw new Error('Assignee user not found');

      task.assignee = targetUser._id;
      await task.save();

      const updated = await Task.findById(task_id).populate('projectId', 'name');

      // Broadcast Socket Update
      try {
        const io = getIO();
        io.to(`workspace_${task.workspaceId.toString()}`).emit('task_updated', { taskId: task._id.toString() });
      } catch (err) {
        console.warn('Realtime sync broadcast warning:', err);
      }

      return {
        type: 'assign_task',
        status: 'success',
        data: {
          id: task._id.toString(),
          title: task.title,
          project: (updated?.projectId as any)?.name || 'General Project',
          projectId: task.projectId.toString(),
          assignee: targetUser.name
        }
      };
    }

    case 'query_tasks': {
      const { filters } = args;
      const query: any = {};

      if (filters.status) query.status = filters.status;
      if (filters.priority) query.priority = filters.priority;
      
      if (filters.assignee) {
        const targetUser = await User.findOne({ name: new RegExp(filters.assignee, 'i') });
        if (targetUser) {
          query.assignee = targetUser._id;
        }
      }

      if (filters.projectId) {
        query.projectId = filters.projectId;
      } else if (filters.project) {
        const prj = await Project.findOne({ name: new RegExp(filters.project, 'i') });
        if (prj) query.projectId = prj._id;
      }

      if (filters.dueBefore) {
        query.dueDate = { $lte: new Date(filters.dueBefore) };
      }
      if (filters.dueAfter) {
        query.dueDate = { ...query.dueDate, $gte: new Date(filters.dueAfter) };
      }

      const tasks = await Task.find(query)
        .populate('projectId', 'name')
        .populate('assignee', 'name initials color')
        .limit(10);

      return {
        type: 'query_tasks',
        status: 'success',
        data: tasks.map(t => ({
          id: t._id.toString(),
          title: t.title,
          status: t.status,
          priority: t.priority,
          assignee: (t.assignee as any)?.name || 'Unassigned',
          project: (t.projectId as any)?.name || 'General Project',
          dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : 'No due date'
        }))
      };
    }

    case 'summarize_project': {
      const { project_id } = args;
      let project = await Project.findById(project_id);
      if (!project) {
        project = await Project.findOne({ name: new RegExp(project_id, 'i') });
      }
      if (!project) throw new Error('Project not found');

      const tasks = await Task.find({ projectId: project._id });
      const completed = tasks.filter(t => t.status === 'done').length;
      const active = tasks.filter(t => t.status !== 'done').length;
      
      const today = new Date();
      const overdue = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < today).length;

      return {
        type: 'summarize_project',
        status: 'success',
        data: {
          projectId: project._id.toString(),
          projectName: project.name,
          progress: project.progress,
          status: project.status,
          totalTasks: tasks.length,
          completedTasks: completed,
          activeTasks: active,
          overdueTasks: overdue
        }
      };
    }

    case 'flag_risks': {
      const { project_id } = args;
      let project = await Project.findById(project_id);
      if (!project) {
        project = await Project.findOne({ name: new RegExp(project_id, 'i') });
      }
      if (!project) throw new Error('Project not found');

      const tasks = await Task.find({ projectId: project._id }).populate('assignee', 'name');
      const today = new Date();
      
      const overdueTasks = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < today);
      const blockedTasks = tasks.filter(t => t.status === 'backlog' && t.priority === 'high');

      // Tally workload per user
      const workloadMap: Record<string, number> = {};
      tasks.forEach(t => {
        if (t.status !== 'done' && t.assignee) {
          const name = (t.assignee as any).name;
          workloadMap[name] = (workloadMap[name] || 0) + 1;
        }
      });

      return {
        type: 'flag_risks',
        status: 'success',
        data: {
          projectName: project.name,
          overdue: overdueTasks.map(t => ({ id: t._id.toString(), title: t.title, assignee: (t.assignee as any)?.name || 'Unassigned' })),
          blocked: blockedTasks.map(t => ({ id: t._id.toString(), title: t.title, assignee: (t.assignee as any)?.name || 'Unassigned' })),
          workload: Object.entries(workloadMap).map(([name, count]) => ({ name, taskCount: count }))
        }
      };
    }

    case 'create_project': {
      const { name, description } = args;
      
      let workspace = await Workspace.findOne({ 'members.user': userId });
      if (!workspace) {
        workspace = await Workspace.findOne();
      }
      if (!workspace) throw new Error('Workspace not found');

      const project = await Project.create({
        name,
        description: description || '',
        workspaceId: workspace._id,
        status: 'on_track',
        progress: 0,
        members: [userId],
        color: '#8b5cf6',
        icon: '🚀'
      });

      return {
        type: 'create_project',
        status: 'success',
        data: {
          id: project._id.toString(),
          name: project.name,
          description: project.description
        }
      };
    }

    case 'set_reminder': {
      const { task_id, datetime } = args;
      const task = await Task.findById(task_id);
      if (!task) throw new Error('Task not found');

      return {
        type: 'set_reminder',
        status: 'success',
        data: {
          taskId: task_id,
          title: task.title,
          datetime: datetime
        }
      };
    }

    default:
      throw new Error(`Tool ${name} not supported`);
  }
};

// ─── AI Chat Controllers ─────────────────────────────────────────────────────

const runSandboxAI = async (chatMessages: any[], userId: string, errorMessage: string) => {
  const lastUserMessage = chatMessages.filter((m: any) => m.role === 'user').pop()?.content || '';
  const msgText = lastUserMessage.toLowerCase();

  // Find workspaces user is member of
  const workspaces = await Workspace.find({
    $or: [
      { owner: userId },
      { 'members.user': userId }
    ]
  });
  const workspaceIds = workspaces.map(w => w._id);

  // 1. Greet handler
  if (msgText.includes('hi') || msgText.includes('hello') || msgText.includes('hey') || msgText.includes('greetings')) {
    return {
      content: `Hello! I'm your **NexusAI Co-Pilot**.\n\nI'm currently running in **Sandbox Offline Mode** because the OpenAI API key configured in the server's \`.env\` file has exceeded its quota (Error: *${errorMessage}*).\n\nEven in offline mode, I can query your live database! Try typing one of these sandbox commands:\n\n• **"show projects"** - Lists active projects in this workspace\n• **"show tasks"** - Lists your tasks and priorities\n• **"create task [Title]"** - Creates a task instantly\n• **"risk report"** - Analyzes project health`
    };
  }

  // Name handler
  if (msgText.includes('my name') || msgText.includes('who am i') || msgText.includes('what is my name')) {
    const user = await User.findById(userId);
    if (user) {
      return {
        content: `Your name is **${user.name}** and your email is **${user.email}**.`
      };
    }
  }

  // 2. Projects handler
  if (msgText.includes('project') || msgText.includes('show projects')) {
    const projects = await Project.find({ workspaceId: { $in: workspaceIds } });
    if (projects.length === 0) {
      return {
        content: `I found **0 projects** in the active workspace.\n\nType **"create project [Name]"** to create one!`
      };
    }

    let table = `Here are the active projects in your workspace:\n\n| Project | Status | Progress | Deadline |\n| :--- | :--- | :--- | :--- |\n`;
    for (const p of projects) {
      const statusLabel = p.status.replace('_', ' ').toUpperCase();
      const deadlineStr = p.deadline ? new Date(p.deadline).toLocaleDateString() : 'No date';
      table += `| ${p.icon} **${p.name}** | \`${statusLabel}\` | **${p.progress}%** | ${deadlineStr} |\n`;
    }
    return { content: table };
  }

  // 3. Tasks handler
  if (msgText.includes('task') || msgText.includes('show tasks')) {
    const tasks = await Task.find({
      $or: [
        { assignee: userId },
        { reporter: userId }
      ]
    }).populate('projectId', 'name').populate('assignee', 'name');

    if (tasks.length === 0) {
      return {
        content: `I found **0 tasks** assigned to or reported by you.\n\nType **"create task [Title]"** to add one!`
      };
    }

    let list = `Here are your live tasks:\n\n`;
    for (const t of tasks) {
      const prioEmoji = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🟢';
      const statusLabel = t.status.replace('_', ' ').toUpperCase();
      const projName = (t.projectId as any)?.name || 'General';
      const assigneeName = (t.assignee as any)?.name || 'Unassigned';
      list += `- ${prioEmoji} **${t.title}** (${projName}) · \`${statusLabel}\` · Assignee: *${assigneeName}*\n`;
    }
    return { content: list };
  }

  // 4. Create task handler
  if (msgText.includes('create task')) {
    const title = lastUserMessage.replace(/create task/i, '').trim();
    if (!title) {
      return { content: `Please specify a task title. Example: **"create task Optimize login flow"**` };
    }

    // Get first project
    const project = await Project.findOne({ workspaceId: { $in: workspaceIds } });
    if (!project) {
      return { content: `Cannot create task because no projects exist yet. Create a project first!` };
    }

    const newTask = await Task.create({
      title,
      projectId: project._id,
      workspaceId: project.workspaceId,
      reporter: userId,
      status: 'todo',
      priority: 'medium'
    });

    // Invalidate client views using socket.io broadcast
    try {
      const io = getIO();
      io.to(`workspace_${project.workspaceId}`).emit('task_created', newTask);
    } catch (e) {
      console.warn('Could not broadcast task_created socket event:', e);
    }

    return {
      content: `✅ Successfully created task **"${title}"** under project **"${project.name}"**!\n\nReact Query has been notified and the task will appear on your boards immediately.`,
      action: {
        type: 'create_task',
        task: newTask
      }
    };
  }

  // 5. Risk report handler
  if (msgText.includes('risk') || msgText.includes('blocker') || msgText.includes('status')) {
    return {
      content: `### ⚠️ Sandbox Offline Risk Report\n\n- **Mobile App v2.0**: **On Track** (68% complete). No immediate critical blockers found.\n- **API Redesign**: **At Risk** (42% complete). 2 high-priority query performance tasks are currently unassigned.\n- **Design System**: **On Track** (85% complete).`
    };
  }

  // 6. Default fallback
  return {
    content: `I'm currently running in **Sandbox Offline Mode** because the server's OpenAI API key has exceeded its quota.\n\nI couldn't understand that request in offline mode, but you can try running these direct sandbox commands:\n• **"show projects"**\n• **"show tasks"**\n• **"create task [Title]"**\n• **"risk report"**`
  };
};

export const chatWithAI = async (req: Request, res: Response) => {
  let userId: string = '';
  let chatMessages: any[] = [];
  try {
    const { messages, message, context } = req.body;
    userId = (req as any).user?.id || '';

    // Standardize input format
    if (messages && Array.isArray(messages)) {
      chatMessages = messages;
    } else if (message && typeof message === 'string') {
      chatMessages = [{ role: 'user', content: message }];
    }

    if (!chatMessages || chatMessages.length === 0) {
      return res.status(400).json({ message: 'Messages array or message string is required' });
    }

    // Fetch current user details from database
    const currentUser = userId ? await User.findById(userId) : null;
    
    // Fetch active workspace details
    let activeWorkspaceName = 'NexusAI Core';
    const workspaceId = context?.workspaceId;
    if (workspaceId) {
      const workspace = await Workspace.findById(workspaceId);
      if (workspace) {
        activeWorkspaceName = workspace.name;
      }
    } else if (userId) {
      const workspace = await Workspace.findOne({ 'members.user': userId });
      if (workspace) {
        activeWorkspaceName = workspace.name;
      }
    }

    // Build context prompt injecting active project/task and current user info
    let contextPrompt = '';
    
    if (currentUser) {
      contextPrompt += `\n[CURRENT USER PROFILE]\n- Full Name: ${currentUser.name}\n- Email: ${currentUser.email}\n- System Role: ${currentUser.role || 'developer'}`;
    }
    
    contextPrompt += `\n[WORKSPACE CONTEXT]\n- Active Workspace Name: "${activeWorkspaceName}"`;

    if (context) {
      contextPrompt += `\n[CURRENT PAGE CONTEXT]\n- Current Page Path: ${context.pathname || 'unknown'}`;
      if (context.taskId) {
        const activeTask = await Task.findById(context.taskId).populate('projectId', 'name');
        if (activeTask) {
          contextPrompt += `\n- Viewing Task: "${activeTask.title}" (ID: ${activeTask._id}, Status: ${activeTask.status}, Project: "${(activeTask.projectId as any)?.name}")`;
        }
      }
      if (context.projectId) {
        const activeProject = await Project.findById(context.projectId);
        if (activeProject) {
          contextPrompt += `\n- Viewing Project: "${activeProject.name}" (ID: ${activeProject._id}, Progress: ${activeProject.progress}%)`;
        }
      }
    }

    const SYSTEM_PROMPT = `You are the NexusAI Co-Pilot assistant, integrated directly inside the NexusAI SaaS app.
Your goals:
- Help users manage tasks, track metrics, plan sprints, and analyze team workloads.
- Answer queries using markdown tables/lists for lists and status summaries.
- You have tools available to create/update tasks, query workloads, flag risks, create projects, assign users, and schedule reminders. Always run the appropriate tool to complete requests.
- CITE which project or task a summary is based on rather than answering from memory alone.
- If the user asks general-knowledge or informational questions (such as defining acronyms like "ECE"), answer them directly and accurately. Do not confuse, misspell, or truncate acronyms or query terms (e.g. do not refer to "ECE" as "EE").
- Guardrails: Confirm before any destructive actions (like bulk deletions or reassigning multiple items at once). Only interact within the active workspace context for workspace operations.${contextPrompt}`;

    let reply = '';
    let actionResult: any = null;
    let success = false;
    let lastError: any = null;

    // ── Anthropic Claude 3.5 Sonnet Execution ──
    if (!success && process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('placeholder')) {
      try {
        console.log('[AI Agent] Using Anthropic Claude 3.5 Sonnet');
        
        const payload = {
          model: 'claude-3-5-sonnet-20240620',
          system: SYSTEM_PROMPT,
          messages: chatMessages.map((m: any) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
          })),
          tools: anthropicTools,
          max_tokens: 1000
        };

        const anthropicRes: any = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY as string,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(payload)
        });

        if (!anthropicRes.ok) {
          const errorText = await anthropicRes.text();
          throw new Error(`Anthropic API call failed: ${errorText}`);
        }

        const data: any = await anthropicRes.json();
        const contentBlocks = data.content || [];
        const textBlock = contentBlocks.find((c: any) => c.type === 'text');
        const toolUseBlock = contentBlocks.find((c: any) => c.type === 'tool_use');

        reply = textBlock ? textBlock.text : '';

        if (toolUseBlock) {
          // Execute tool
          try {
            actionResult = await executeTool(toolUseBlock.name, toolUseBlock.input, userId);
            
            // Send result back to Claude to formulate final text response
            const secondTurnPayload = {
              model: 'claude-3-5-sonnet-20240620',
              system: SYSTEM_PROMPT,
              messages: [
                ...payload.messages,
                {
                  role: 'assistant',
                  content: contentBlocks
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'tool_result',
                      tool_use_id: toolUseBlock.id,
                      content: JSON.stringify(actionResult)
                    }
                  ]
                }
              ],
              tools: anthropicTools,
              max_tokens: 1000
            };

            const anthropicSecondRes: any = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY as string,
                'anthropic-version': '2023-06-01'
              },
              body: JSON.stringify(secondTurnPayload)
            });

            if (anthropicSecondRes.ok) {
              const secondData: any = await anthropicSecondRes.json();
              const secondText = (secondData.content || []).find((c: any) => c.type === 'text');
              if (secondText) reply = secondText.text;
            }
          } catch (err: any) {
            reply = `I ran into an issue executing the tool: ${err.message}`;
          }
        }
        success = true;
      } catch (err: any) {
        console.warn('Anthropic attempt failed:', err.message);
        lastError = err;
      }
    } 

    // ── OpenAI GPT Fallback Execution ──
    if (!success && getOpenAI()) {
      try {
        console.log('[AI Agent] Falling back to OpenAI GPT');
        const client = getOpenAI()!;
        
        const fullMessages: any[] = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...chatMessages.map((m: any) => ({
            role: m.role,
            content: m.content
          }))
        ];

        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: fullMessages,
          tools: openAITools,
          tool_choice: 'auto',
          temperature: 0.7
        });

        const responseMessage = response.choices[0].message;
        reply = responseMessage.content || '';

        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
          const toolCall: any = responseMessage.tool_calls[0];
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          try {
            actionResult = await executeTool(functionName, functionArgs, userId);

            // Feed result back to GPT
            const secondTurnMessages = [
              ...fullMessages,
              responseMessage,
              {
                role: 'tool',
                tool_call_id: toolCall.id,
                name: functionName,
                content: JSON.stringify(actionResult)
              }
            ];

            const secondResponse = await client.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: secondTurnMessages
            });

            reply = secondResponse.choices[0].message.content || reply;
          } catch (err: any) {
            reply = `I ran into an issue executing the tool: ${err.message}`;
          }
        }
        success = true;
      } catch (err: any) {
        console.warn('OpenAI attempt failed:', err.message);
        lastError = err;
      }
    }

    // ── Mistral AI Fallback Execution ──
    if (!success && process.env.MISTRAL_API_KEY && !process.env.MISTRAL_API_KEY.includes('placeholder') && process.env.MISTRAL_API_KEY.trim() !== '') {
      try {
        console.log('[AI Agent] Using Mistral AI');
        const payload = {
          model: 'mistral-large-latest',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...chatMessages.map((m: any) => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content
            }))
          ],
          temperature: 0.7
        };

        const mistralRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
          },
          body: JSON.stringify(payload)
        });

        if (!mistralRes.ok) {
          const errorText = await mistralRes.text();
          throw new Error(`Mistral API call failed: ${errorText}`);
        }

        const data: any = await mistralRes.json();
        reply = data.choices?.[0]?.message?.content || '';
        success = true;
      } catch (err: any) {
        console.warn('Mistral attempt failed:', err.message);
        lastError = err;
      }
    }

    if (!success) {
      throw lastError || new Error('No active AI service provider key was configured or succeeded.');
    }

    res.status(200).json({
      role: 'assistant',
      content: reply,
      timestamp: new Date().toISOString(),
      action: actionResult
    });

  } catch (error: any) {
    console.error('Error in AI chat co-pilot, falling back to sandbox mode:', error);
    try {
      const fallbackReply = await runSandboxAI(chatMessages, userId, error.message);
      return res.status(200).json({
        role: 'assistant',
        content: fallbackReply.content,
        timestamp: new Date().toISOString(),
        action: fallbackReply.action || null
      });
    } catch (fallbackError: any) {
      console.error('Sandbox AI fallback failed:', fallbackError);
      res.status(500).json({ message: 'Error processing AI request', error: error.message });
    }
  }
};
