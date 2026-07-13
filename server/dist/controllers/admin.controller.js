"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUserStatus = exports.updateUserRole = exports.getUsers = void 0;
const User_1 = __importDefault(require("../models/User"));
const getUsers = async (req, res) => {
    try {
        const users = await User_1.default.find().select('-password -otpCode -resetPasswordToken');
        res.status(200).json(users);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
};
exports.getUsers = getUsers;
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        if (!role) {
            return res.status(400).json({ message: 'Role is required' });
        }
        // Owner cannot change their own role to lower level, or maybe they can? Let's just prevent owner role change for now
        if (req.user.id === id && role !== 'owner') {
            return res.status(400).json({ message: 'Cannot demote yourself' });
        }
        if (!['owner', 'admin', 'project_manager', 'developer', 'qa', 'designer', 'client', 'guest'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        const user = await User_1.default.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    }
    catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ message: 'Server error while updating role' });
    }
};
exports.updateUserRole = updateUserRole;
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['active', 'away', 'offline'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        const user = await User_1.default.findByIdAndUpdate(id, { status }, { new: true }).select('-password');
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    }
    catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Server error while updating status' });
    }
};
exports.updateUserStatus = updateUserStatus;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if the user is deleting themselves
        if (req.user?.id === id) {
            return res.status(400).json({ message: 'Cannot delete your own account from admin panel' });
        }
        const user = await User_1.default.findByIdAndDelete(id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ message: 'User deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error while deleting user' });
    }
};
exports.deleteUser = deleteUser;
