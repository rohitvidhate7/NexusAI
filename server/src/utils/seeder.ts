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

    console.log(`Seeding clean workspace for user: ${userId}...`);

    // 2. Create the workspace
    const userObj = await User.findById(userId);
    const userName = userObj ? userObj.name : 'Personal';
    
    const workspaceName = `${userName}'s Workspace`;
    
    // Generate a safe slug from the name
    const safeName = userName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const workspaceSlug = `${safeName}-${userId.substring(userId.length - 5)}`;
    
    const workspaceMembers = [
      { user: new mongoose.Types.ObjectId(userId), role: 'owner' as const }
    ];

    const workspace = await Workspace.create({
      name: workspaceName,
      slug: workspaceSlug,
      description: `Main workspace for ${userName}'s projects`,
      type: 'organization',
      owner: new mongoose.Types.ObjectId(userId),
      members: workspaceMembers,
      status: 'active'
    });

    console.log(`Created clean workspace: ${workspace.name} (${workspace._id})`);

  } catch (error) {
    console.error('Seeding workspace failed:', error);
  }
};
