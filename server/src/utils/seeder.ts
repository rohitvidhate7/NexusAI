import mongoose from 'mongoose';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';

export const seedWorkspaceForUser = async (userId: string) => {
  try {
    // 1. Check if user already has a workspace
    const existingWorkspace = await Workspace.findOne({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    });
    
    if (existingWorkspace) {
      console.log(`User ${userId} already has workspaces. Skipping seeding.`);
      return;
    }

    console.log(`Seeding workspace data for user: ${userId}...`);

    // 2. Ensure mock users exist in the database
    const mockUserData = [
      { name: 'Sarah K.', email: 'sarah@example.com', role: 'developer' },
      { name: 'Marcus T.', email: 'marcus@example.com', role: 'developer' },
      { name: 'Priya S.', email: 'priya@example.com', role: 'designer' },
      { name: 'James L.', email: 'james@example.com', role: 'developer' },
      { name: 'Nina P.', email: 'qa', role: 'qa' }
    ];

    const users = [];
    for (const u of mockUserData) {
      let dbUser = await User.findOne({ email: u.email });
      if (!dbUser) {
        dbUser = await User.create({
          name: u.name,
          email: u.email,
          role: u.role as any,
          authProvider: 'local',
          isEmailVerified: true
        });
      }
      users.push(dbUser);
    }

    // 3. Create the workspace
    const workspaceName = 'Acme Corporation';
    const workspaceSlug = `acme-corp-${userId.substring(userId.length - 5)}`;
    
    const workspaceMembers = [
      { user: new mongoose.Types.ObjectId(userId), role: 'owner' as const },
      ...users.map(u => ({ user: u._id, role: 'member' as const }))
    ];

    const workspace = await Workspace.create({
      name: workspaceName,
      slug: workspaceSlug,
      description: 'Main workspace for Acme Corp projects',
      type: 'organization',
      owner: new mongoose.Types.ObjectId(userId),
      members: workspaceMembers,
      status: 'active'
    });

    console.log(`Created workspace: ${workspace.name} (${workspace._id})`);

    // 4. Create the projects
    const projectsData = [
      { name: 'Mobile App v2.0', description: 'Complete redesign with AI-powered features', status: 'on_track' as const, progress: 68, color: '#8b5cf6', icon: '📱', deadlineDays: 30 },
      { name: 'API Redesign', description: 'RESTful API v3 with improved performance', status: 'at_risk' as const, progress: 42, color: '#ef4444', icon: '⚙️', deadlineDays: 15 },
      { name: 'Design System', description: 'Unified component library for all products', status: 'on_track' as const, progress: 85, color: '#10b981', icon: '🎨', deadlineDays: 45 }
    ];

    const projects = [];
    for (const p of projectsData) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + p.deadlineDays);
      
      const dbProject = await Project.create({
        name: p.name,
        description: p.description,
        workspaceId: workspace._id,
        status: p.status,
        progress: p.progress,
        deadline,
        color: p.color,
        icon: p.icon,
        members: [new mongoose.Types.ObjectId(userId), ...users.map(u => u._id)]
      });
      projects.push(dbProject);
    }

    console.log(`Created ${projects.length} projects.`);

    // 5. Create the tasks
    const tasksData = [
      { title: 'Implement dark mode', status: 'backlog' as const, priority: 'medium' as const, projectIndex: 0, assigneeIndex: 0, labels: ['UI', 'v2.0'], progress: 0, daysLeft: 10 },
      { title: 'Add push notifications', status: 'backlog' as const, priority: 'high' as const, projectIndex: 0, assigneeIndex: 1, labels: ['Feature'], progress: 50, daysLeft: 14 },
      { title: 'Update user documentation', status: 'todo' as const, priority: 'low' as const, projectIndex: 1, assigneeIndex: 2, labels: ['Docs'], progress: 33, daysLeft: 5 },
      { title: 'Fix login flow', status: 'todo' as const, priority: 'high' as const, projectIndex: 0, assigneeIndex: 0, labels: ['Bug', 'High'], progress: 0, daysLeft: 2 },
      { title: 'Optimize database queries', status: 'todo' as const, priority: 'medium' as const, projectIndex: 1, assigneeIndex: 1, labels: ['Performance'], progress: 40, daysLeft: 8 },
      { title: 'Design mobile layout', status: 'in_progress' as const, priority: 'high' as const, projectIndex: 0, assigneeIndex: 2, labels: ['Design'], progress: 50, daysLeft: 4 },
      { title: 'API authentication integration', status: 'in_progress' as const, priority: 'high' as const, projectIndex: 1, assigneeIndex: 1, labels: ['Backend'], progress: 75, daysLeft: 3 },
      { title: 'PR #2341: Search improvements', status: 'review' as const, priority: 'medium' as const, projectIndex: 0, assigneeIndex: 0, labels: ['Review'], progress: 100, daysLeft: 1 },
      { title: 'Component library v2', status: 'review' as const, priority: 'low' as const, projectIndex: 2, assigneeIndex: 2, labels: ['Ready'], progress: 100, daysLeft: 0 }
    ];

    for (const t of tasksData) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + t.daysLeft);
      
      await Task.create({
        title: t.title,
        status: t.status,
        priority: t.priority,
        projectId: projects[t.projectIndex]._id,
        workspaceId: workspace._id,
        assignee: users[t.assigneeIndex]._id,
        reporter: new mongoose.Types.ObjectId(userId),
        labels: t.labels,
        progress: t.progress,
        dueDate
      });
    }

    console.log('Seeded tasks successfully!');

  } catch (error) {
    console.error('Seeding workspace failed:', error);
  }
};
