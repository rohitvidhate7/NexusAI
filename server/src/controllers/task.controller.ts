import { Request, Response } from 'express';
import Task from '../models/Task';
import Project from '../models/Project';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { projectId, workspaceId } = req.query;
    const userId = (req as any).user.id;
    let filter: any = {};
    
    if (projectId && projectId !== '') {
      filter.projectId = projectId;
    } else if (workspaceId && workspaceId !== '') {
      filter.workspaceId = workspaceId as string;
    } else {
      // Fetch all tasks where user is assignee or reporter
      filter.$or = [
        { assignee: userId },
        { reporter: userId }
      ];
    }
    
    const tasks = await Task.find(filter)
      .populate('projectId', 'name')
      .populate('assignee', 'name avatar initials color')
      .populate('reporter', 'name avatar initials color');
      
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
};
 
export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, status, priority, assignee, projectId, workspaceId, dueDate, labels } = req.body;
 
    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      assignee: (assignee && assignee !== '') ? assignee : undefined,
      reporter: (req as any).user.id,
      projectId: (projectId && projectId !== '') ? projectId : undefined,
      workspaceId: (workspaceId && workspaceId !== '') ? workspaceId : undefined,
      dueDate: (dueDate && dueDate !== '') ? new Date(dueDate) : undefined,
      labels: labels || [],
      progress: 0
    });
 
    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Server error creating task' });
  }
};
 
export const updateTaskStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const task = await Task.findByIdAndUpdate(
      id, 
      { status },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(200).json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Server error updating task' });
  }
};
 
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id)
      .populate('projectId', 'name')
      .populate('assignee', 'name avatar initials color')
      .populate('reporter', 'name avatar initials color')
      .populate('dependencies', 'title status dueDate');
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching task' });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const task = await Task.findByIdAndUpdate(id, updates, { new: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating task' });
  }
};

export const addSubtask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    task.subtasks = task.subtasks || [];
    task.subtasks.push({ title, done: false });
    await task.save();
    
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error adding subtask' });
  }
};

export const toggleSubtask = async (req: Request, res: Response) => {
  try {
    const { id, subtaskId } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const subtask = task.subtasks?.find(st => st._id?.toString() === subtaskId);
    if (!subtask) return res.status(404).json({ message: 'Subtask not found' });
    
    subtask.done = !subtask.done;
    await task.save();
    
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error toggling subtask' });
  }
};

export const addDependency = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dependencyId } = req.body;
    
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    task.dependencies = task.dependencies || [];
    if (!task.dependencies.includes(dependencyId)) {
      task.dependencies.push(dependencyId);
      await task.save();
    }
    
    const updatedTask = await Task.findById(id).populate('dependencies', 'title status dueDate');
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error adding dependency' });
  }
};

