"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.inviteMember = exports.getWorkspaceMembers = exports.updateWorkspace = exports.getWorkspaceById = exports.createWorkspace = exports.getWorkspaces = void 0;
const Workspace_js_1 = __importDefault(require("../models/Workspace.js"));
const User_js_1 = __importDefault(require("../models/User.js"));
const mongoose_1 = __importDefault(require("mongoose"));
const getWorkspaces = async (req, res) => {
    try {
        const userId = req.user.id;
        // Find workspaces where user is owner or a member
        const workspaces = await Workspace_js_1.default.find({
            $or: [
                { owner: userId },
                { 'members.user': userId }
            ]
        }).populate('owner', 'name email avatar initials color');
        res.status(200).json(workspaces);
    }
    catch (error) {
        console.error('Error fetching workspaces:', error);
        res.status(500).json({ message: 'Server error fetching workspaces' });
    }
};
exports.getWorkspaces = getWorkspaces;
const createWorkspace = async (req, res) => {
    try {
        const { name, slug, description, type } = req.body;
        const userId = req.user.id;
        // Check if slug exists
        const existing = await Workspace_js_1.default.findOne({ slug });
        if (existing) {
            return res.status(400).json({ message: 'Workspace slug already in use' });
        }
        const workspace = await Workspace_js_1.default.create({
            name,
            slug,
            description,
            type,
            owner: userId,
            members: [{ user: userId, role: 'owner' }]
        });
        res.status(201).json(workspace);
    }
    catch (error) {
        console.error('Error creating workspace:', error);
        res.status(500).json({ message: 'Server error creating workspace' });
    }
};
exports.createWorkspace = createWorkspace;
const getWorkspaceById = async (req, res) => {
    try {
        const { id } = req.params;
        const workspace = await Workspace_js_1.default.findById(id).populate('owner', 'name email avatar initials color');
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }
        res.status(200).json(workspace);
    }
    catch (error) {
        console.error('Error fetching workspace:', error);
        res.status(500).json({ message: 'Server error fetching workspace' });
    }
};
exports.getWorkspaceById = getWorkspaceById;
const updateWorkspace = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, logo } = req.body;
        const workspace = await Workspace_js_1.default.findById(id);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }
        // Check if user is owner or admin (for simplicity, just check owner for now)
        if (workspace.owner.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Only workspace owner can update settings' });
        }
        if (name)
            workspace.name = name;
        if (description !== undefined)
            workspace.description = description;
        if (logo !== undefined)
            workspace.logo = logo;
        await workspace.save();
        res.status(200).json(workspace);
    }
    catch (error) {
        console.error('Error updating workspace:', error);
        res.status(500).json({ message: 'Server error updating workspace' });
    }
};
exports.updateWorkspace = updateWorkspace;
const getWorkspaceMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const workspace = await Workspace_js_1.default.findById(id).populate('members.user', 'name email avatar initials color status role');
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }
        // Filter out members where user population failed (e.g., deleted users)
        const formattedMembers = workspace.members
            .filter(member => member.user)
            .map(member => ({
            ...(member.user._doc || {}),
            workspaceRole: member.role
        }));
        res.status(200).json(formattedMembers);
    }
    catch (error) {
        console.error('Error fetching workspace members:', error);
        res.status(500).json({ message: 'Server error fetching members' });
    }
};
exports.getWorkspaceMembers = getWorkspaceMembers;
const inviteMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, role } = req.body;
        if (!userId || !mongoose_1.default.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Valid user selection is required' });
        }
        const workspace = await Workspace_js_1.default.findById(id);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }
        // Ensure the inviter is owner or admin
        if (workspace.owner.toString() !== req.user.id) {
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
    }
    catch (error) {
        console.error('Error inviting member:', error);
        res.status(500).json({ message: 'Server error inviting member' });
    }
};
exports.inviteMember = inviteMember;
const getAllUsers = async (req, res) => {
    try {
        const users = await User_js_1.default.find().select('name email avatar initials color');
        res.status(200).json(users);
    }
    catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Server error fetching all users' });
    }
};
exports.getAllUsers = getAllUsers;
