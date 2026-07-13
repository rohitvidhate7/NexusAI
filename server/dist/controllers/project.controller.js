"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProject = exports.getProjects = void 0;
const Project_1 = __importDefault(require("../models/Project"));
const Workspace_1 = __importDefault(require("../models/Workspace"));
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
            const workspaces = await Workspace_1.default.find({
                $or: [
                    { owner: userId },
                    { 'members.user': userId }
                ]
            });
            const workspaceIds = workspaces.map(w => w._id);
            filter.workspaceId = { $in: workspaceIds };
        }
        const projects = await Project_1.default.find(filter)
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
        const { name, description, workspaceId, deadline } = req.body;
        const project = await Project_1.default.create({
            name,
            description,
            workspaceId,
            deadline,
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
