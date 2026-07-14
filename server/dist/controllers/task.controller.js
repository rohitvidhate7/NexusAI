"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDependency = exports.toggleSubtask = exports.addSubtask = exports.updateTask = exports.getTaskById = exports.updateTaskStatus = exports.createTask = exports.getTasks = void 0;
const Task_1 = __importDefault(require("../models/Task"));
const getTasks = async (req, res) => {
    try {
        const { projectId, workspaceId } = req.query;
        const userId = req.user.id;
        let filter = {};
        if (projectId && projectId !== '') {
            filter.projectId = projectId;
        }
        else if (workspaceId && workspaceId !== '') {
            filter.workspaceId = workspaceId;
        }
        else {
            // Fetch all tasks where user is assignee or reporter
            filter.$or = [
                { assignee: userId },
                { reporter: userId }
            ];
        }
        const tasks = await Task_1.default.find(filter)
            .populate('projectId', 'name')
            .populate('assignee', 'name avatar initials color')
            .populate('reporter', 'name avatar initials color');
        res.status(200).json(tasks);
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ message: 'Server error fetching tasks' });
    }
};
exports.getTasks = getTasks;
const createTask = async (req, res) => {
    try {
        const { title, description, status, priority, assignee, projectId, workspaceId, dueDate, labels } = req.body;
        const task = await Task_1.default.create({
            title,
            description,
            status: status || 'todo',
            priority: priority || 'medium',
            assignee: (assignee && assignee !== '') ? assignee : undefined,
            reporter: req.user.id,
            projectId: (projectId && projectId !== '') ? projectId : undefined,
            workspaceId: (workspaceId && workspaceId !== '') ? workspaceId : undefined,
            dueDate: (dueDate && dueDate !== '') ? new Date(dueDate) : undefined,
            labels: labels || [],
            progress: 0
        });
        res.status(201).json(task);
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ message: 'Server error creating task' });
    }
};
exports.createTask = createTask;
const updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const task = await Task_1.default.findByIdAndUpdate(id, { status }, { new: true });
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(200).json(task);
    }
    catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ message: 'Server error updating task' });
    }
};
exports.updateTaskStatus = updateTaskStatus;
const getTaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task_1.default.findById(id)
            .populate('projectId', 'name')
            .populate('assignee', 'name avatar initials color')
            .populate('reporter', 'name avatar initials color')
            .populate('dependencies', 'title status dueDate');
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        res.status(200).json(task);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error fetching task' });
    }
};
exports.getTaskById = getTaskById;
const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const task = await Task_1.default.findByIdAndUpdate(id, updates, { new: true });
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        res.status(200).json(task);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error updating task' });
    }
};
exports.updateTask = updateTask;
const addSubtask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const task = await Task_1.default.findById(id);
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        task.subtasks = task.subtasks || [];
        task.subtasks.push({ title, done: false });
        await task.save();
        res.status(200).json(task);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error adding subtask' });
    }
};
exports.addSubtask = addSubtask;
const toggleSubtask = async (req, res) => {
    try {
        const { id, subtaskId } = req.params;
        const task = await Task_1.default.findById(id);
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        const subtask = task.subtasks?.find(st => st._id?.toString() === subtaskId);
        if (!subtask)
            return res.status(404).json({ message: 'Subtask not found' });
        subtask.done = !subtask.done;
        await task.save();
        res.status(200).json(task);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error toggling subtask' });
    }
};
exports.toggleSubtask = toggleSubtask;
const addDependency = async (req, res) => {
    try {
        const { id } = req.params;
        const { dependencyId } = req.body;
        const task = await Task_1.default.findById(id);
        if (!task)
            return res.status(404).json({ message: 'Task not found' });
        task.dependencies = task.dependencies || [];
        if (!task.dependencies.includes(dependencyId)) {
            task.dependencies.push(dependencyId);
            await task.save();
        }
        const updatedTask = await Task_1.default.findById(id).populate('dependencies', 'title status dueDate');
        res.status(200).json(updatedTask);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error adding dependency' });
    }
};
exports.addDependency = addDependency;
