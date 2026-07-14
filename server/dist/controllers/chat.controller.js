"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getMessages = exports.createChannel = exports.getChannels = void 0;
const Channel_js_1 = __importDefault(require("../models/Channel.js"));
const Message_js_1 = __importDefault(require("../models/Message.js"));
const mongoose_1 = __importDefault(require("mongoose"));
const socket_service_js_1 = require("../services/socket.service.js");
const getChannels = async (req, res) => {
    try {
        const workspaceId = req.query.workspaceId;
        let filter = {};
        if (workspaceId && workspaceId !== 'undefined' && workspaceId !== '') {
            if (mongoose_1.default.Types.ObjectId.isValid(workspaceId)) {
                filter = { workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId) };
            }
            else {
                return res.status(400).json({ message: 'Invalid workspaceId format' });
            }
        }
        let channels = await Channel_js_1.default.find(filter);
        // Auto-create a 'Group Chat' channel if none exist for demo purposes
        if (channels.length === 0) {
            const defaultWorkspaceId = workspaceId ? new mongoose_1.default.Types.ObjectId(workspaceId) : new mongoose_1.default.Types.ObjectId();
            const generalChannel = await Channel_js_1.default.create({
                name: 'Group Chat',
                workspaceId: defaultWorkspaceId,
                members: []
            });
            channels = [generalChannel];
        }
        else {
            // Dynamic migration: rename any existing 'general' channel to 'Group Chat'
            let updated = false;
            for (const ch of channels) {
                if (ch.name === 'general') {
                    ch.name = 'Group Chat';
                    await ch.save();
                    updated = true;
                }
            }
            if (updated) {
                channels = await Channel_js_1.default.find(filter);
            }
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
        const { name, workspaceId, members } = req.body;
        if (!name || !workspaceId) {
            return res.status(400).json({ message: 'Name and workspaceId are required' });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(workspaceId)) {
            return res.status(400).json({ message: 'Invalid workspaceId format' });
        }
        const memberIds = [new mongoose_1.default.Types.ObjectId(req.user.id)];
        if (members && Array.isArray(members)) {
            members.forEach((id) => {
                if (mongoose_1.default.Types.ObjectId.isValid(id) && id !== req.user.id) {
                    memberIds.push(new mongoose_1.default.Types.ObjectId(id));
                }
            });
        }
        const channel = await Channel_js_1.default.create({
            name,
            workspaceId: new mongoose_1.default.Types.ObjectId(workspaceId),
            members: memberIds
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
        const channelId = req.params.channelId;
        if (!mongoose_1.default.Types.ObjectId.isValid(channelId)) {
            return res.status(400).json({ message: 'Invalid channelId format' });
        }
        const messages = await Message_js_1.default.find({ channelId: new mongoose_1.default.Types.ObjectId(channelId) })
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
        const channelId = req.params.channelId;
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(channelId)) {
            return res.status(400).json({ message: 'Invalid channelId format' });
        }
        const message = await Message_js_1.default.create({
            channelId: new mongoose_1.default.Types.ObjectId(channelId),
            content,
            sender: new mongoose_1.default.Types.ObjectId(req.user.id)
        });
        const populatedMessage = await message.populate('sender', 'name initials color avatar');
        // Broadcast via socket.io
        const io = (0, socket_service_js_1.getIO)();
        io.to(`channel_${channelId}`).emit('receive_message', populatedMessage);
        res.status(201).json(populatedMessage);
    }
    catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error sending message' });
    }
};
exports.sendMessage = sendMessage;
