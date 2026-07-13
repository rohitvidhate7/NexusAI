import { Request, Response } from 'express';
import Project from '../models/Project.js';
import Workspace from '../models/Workspace.js';
import Task from '../models/Task.js';

export const getProjects = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.query;
    const userId = (req as any).user.id;
    let filter: any = {};

    if (workspaceId) {
      filter.workspaceId = workspaceId;
    } else {
      // Find workspaces where user is owner or a member
      const workspaces = await Workspace.find({
        $or: [
          { owner: userId },
          { 'members.user': userId }
        ]
      });
      const workspaceIds = workspaces.map(w => w._id);
      filter.workspaceId = { $in: workspaceIds };
    }
    
    const projects = await Project.find(filter)
      .populate('members', 'name avatar initials color');
      
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Server error fetching projects' });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, workspaceId, deadline, color, icon } = req.body;

    const project = await Project.create({
      name,
      description,
      workspaceId,
      deadline,
      color: color || '#8b5cf6',
      icon: icon || '📱',
      status: 'on_track',
      progress: 0,
      members: [(req as any).user.id] // default to adding creator
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Server error creating project' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status, progress, deadline, color, icon } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (progress !== undefined) project.progress = progress;
    if (deadline !== undefined) project.deadline = deadline;
    if (color !== undefined) project.color = color;
    if (icon !== undefined) project.icon = icon;

    await project.save();
    res.status(200).json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ message: 'Server error updating project' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Delete all tasks in the project
    await Task.deleteMany({ projectId: id });
    // Delete the project
    await Project.findByIdAndDelete(id);

    res.status(200).json({ message: 'Project and all associated tasks deleted' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Server error deleting project' });
  }
};
