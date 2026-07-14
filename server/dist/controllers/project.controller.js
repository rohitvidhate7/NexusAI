"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.createProject = exports.getProjects = void 0;
const Project_js_1 = __importDefault(require("../models/Project.js"));
const Workspace_js_1 = __importDefault(require("../models/Workspace.js"));
const Task_js_1 = __importDefault(require("../models/Task.js"));
const getProjects = async (req, res) => {
    try {
        const { workspaceId } = req.query;
        const userId = req.user.id;
        let filter = {};
        if (workspaceId) {
            filter.workspaceId = workspaceId;
        }
        else {
            // Find workspaces where user is owner or a member
            const workspaces = await Workspace_js_1.default.find({
                $or: [
                    { owner: userId },
                    { 'members.user': userId }
                ]
            });
            const workspaceIds = workspaces.map(w => w._id);
            filter.workspaceId = { $in: workspaceIds };
        }
        const projects = await Project_js_1.default.find(filter)
            .populate('members', 'name avatar initials color');
        res.status(200).json(projects);
    }
    catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Server error fetching projects' });
    }
};
exports.getProjects = getProjects;
const createProject = async (req, res) => {
    try {
        const { name, description, workspaceId, deadline, color, icon } = req.body;
        const project = await Project_js_1.default.create({
            name,
            description,
            workspaceId,
            deadline,
            color: color || '#8b5cf6',
            icon: icon || '📱',
            status: 'on_track',
            progress: 0,
            members: [req.user.id] // default to adding creator
        });
        res.status(201).json(project);
    }
    catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: 'Server error creating project' });
    }
};
exports.createProject = createProject;
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, status, progress, deadline, color, icon } = req.body;
        const project = await Project_js_1.default.findById(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        if (name !== undefined)
            project.name = name;
        if (description !== undefined)
            project.description = description;
        if (status !== undefined)
            project.status = status;
        if (progress !== undefined)
            project.progress = progress;
        if (deadline !== undefined)
            project.deadline = deadline;
        if (color !== undefined)
            project.color = color;
        if (icon !== undefined)
            project.icon = icon;
        await project.save();
        res.status(200).json(project);
    }
    catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ message: 'Server error updating project' });
    }
};
exports.updateProject = updateProject;
const deleteProject = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project_js_1.default.findById(id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        // Delete all tasks in the project
        await Task_js_1.default.deleteMany({ projectId: id });
        // Delete the project
        await Project_js_1.default.findByIdAndDelete(id);
        res.status(200).json({ message: 'Project and all associated tasks deleted' });
    }
    catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Server error deleting project' });
    }
};
exports.deleteProject = deleteProject;
