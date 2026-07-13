"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getMessages = exports.createChannel = exports.getChannels = void 0;
const Channel_1 = __importDefault(require("../models/Channel"));
const Message_1 = __importDefault(require("../models/Message"));
const mongoose_1 = __importDefault(require("mongoose"));
const getChannels = async (req, res) => {
    try {
        const workspaceId = req.query.workspaceId;
        // For now, if no workspaceId is provided, we can fetch general channels or handle it later
        const filter = workspaceId ? { workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId) } : {};
        let channels = await Channel_1.default.find(filter);
        // Auto-create a 'general' channel if none exist for demo purposes
        if (channels.length === 0) {
            const defaultWorkspaceId = workspaceId ? new mongoose_1.default.Types.ObjectId(workspaceId) : new mongoose_1.default.Types.ObjectId();
            const generalChannel = await Channel_1.default.create({
                name: 'general',
                workspaceId: defaultWorkspaceId,
                members: []
            });
            channels = [generalChannel];
        }
        res.status(200).json(channels);
    }
    catch (error) {
        console.error('Error fetching channels:', error);
        res.status(500).json({ message: 'Server error fetching channels' });
    }
};
exports.getChannels = getChannels;
const createChannel = async (req, res) => {
    try {
        const { name, workspaceId } = req.body;
        if (!name || !workspaceId) {
            return res.status(400).json({ message: 'Name and workspaceId are required' });
        }
        const channel = await Channel_1.default.create({
            name,
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId),
            members: [new mongoose_1.default.Types.ObjectId(req.user.id)]
        });
        res.status(201).json(channel);
    }
    catch (error) {
        console.error('Error creating channel:', error);
        res.status(500).json({ message: 'Server error creating channel' });
    }
};
exports.createChannel = createChannel;
const getMessages = async (req, res) => {
    try {
        const { channelId } = req.params;
        const messages = await Message_1.default.find({ channelId: new mongoose_1.default.Types.ObjectId(channelId) })
            .populate('sender', 'name initials color avatar')
            .sort({ createdAt: 1 })
            .limit(100);
        res.status(200).json(messages);
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error fetching messages' });
    }
};
exports.getMessages = getMessages;
const sendMessage = async (req, res) => {
    try {
        const { channelId } = req.params;
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }
        const message = await Message_1.default.create({
            channelId: new mongoose_1.default.Types.ObjectId(channelId),
            content,
            sender: new mongoose_1.default.Types.ObjectId(req.user.id)
        });
        const populatedMessage = await message.populate('sender', 'name initials color avatar');
        // Broadcast via socket.io
        const io = require('../services/socket.service').getIO();
        io.to(`channel_${channelId}`).emit('receive_message', populatedMessage);
        res.status(201).json(populatedMessage);
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error sending message' });
    }
};
exports.sendMessage = sendMessage;
