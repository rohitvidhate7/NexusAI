import { Request, Response } from 'express';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

export const getWorkspaces = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    // Find workspaces where user is owner or a member
    const workspaces = await Workspace.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    }).populate('owner', 'name email avatar initials color');
    
    res.status(200).json(workspaces);
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    res.status(500).json({ message: 'Server error fetching workspaces' });
  }
};

export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const { name, slug, description, type } = req.body;
    const userId = (req as any).user.id;

    // Check if slug exists
    const existing = await Workspace.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: 'Workspace slug already in use' });
    }

    const workspace = await Workspace.create({
      name,
      slug,
      description,
      type,
      owner: userId,
      members: [{ user: userId, role: 'owner' }]
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ message: 'Server error creating workspace' });
  }
};

export const getWorkspaceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const workspace = await Workspace.findById(id).populate('owner', 'name email avatar initials color');
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    res.status(200).json(workspace);
  } catch (error) {
    console.error('Error fetching workspace:', error);
    res.status(500).json({ message: 'Server error fetching workspace' });
  }
};

export const updateWorkspace = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, logo } = req.body;
    
    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Check if user is owner or admin (for simplicity, just check owner for now)
    if (workspace.owner.toString() !== (req as any).user.id) {
      return res.status(403).json({ message: 'Only workspace owner can update settings' });
    }
    
    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (logo !== undefined) workspace.logo = logo;
    
    await workspace.save();
    
    res.status(200).json(workspace);
  } catch (error) {
    console.error('Error updating workspace:', error);
    res.status(500).json({ message: 'Server error updating workspace' });
  }
};

export const getWorkspaceMembers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const workspace = await Workspace.findById(id).populate('members.user', 'name email avatar initials color status role');
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Filter out members where user population failed (e.g., deleted users)
    const formattedMembers = workspace.members
      .filter(member => member.user)
      .map(member => ({
        ...((member.user as any)._doc || {}),
        workspaceRole: member.role
      }));
    
    res.status(200).json(formattedMembers);
  } catch (error) {
    console.error('Error fetching workspace members:', error);
    res.status(500).json({ message: 'Server error fetching members' });
  }
};

export const inviteMember = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Valid user selection is required' });
    }
    
    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Ensure the inviter is owner or admin
    if (workspace.owner.toString() !== (req as any).user.id) {
      return res.status(403).json({ message: 'Only owner can invite members' });
    }
    
    // Check if user already in workspace
    const existingMember = workspace.members.find(m => m.user && m.user.toString() === userId);
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }
    
    workspace.members.push({ user: userId, role: role || 'member' });
    await workspace.save();
    
    res.status(200).json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Error inviting member:', error);
    res.status(500).json({ message: 'Server error inviting member' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('name email avatar initials color');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Server error fetching all users' });
  }
};
