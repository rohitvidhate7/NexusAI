import { Request, Response } from 'express';
import Channel from '../models/Channel.js';
import Message from '../models/Message.js';
import mongoose from 'mongoose';
import { getIO } from '../services/socket.service.js';

export const getChannels = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.query.workspaceId as string | undefined;
    
    let filter = {};
    if (workspaceId && workspaceId !== 'undefined' && workspaceId !== '') {
      if (mongoose.Types.ObjectId.isValid(workspaceId)) {
        filter = { workspaceId: new mongoose.Types.ObjectId(workspaceId) };
      } else {
        return res.status(400).json({ message: 'Invalid workspaceId format' });
      }
    }
    
    let channels = await Channel.find(filter);
    
    // Auto-create a 'Group Chat' channel if none exist for demo purposes
    if (channels.length === 0) {
      const defaultWorkspaceId = workspaceId ? new mongoose.Types.ObjectId(workspaceId) : new mongoose.Types.ObjectId(); 
      const generalChannel = await Channel.create({
        name: 'Group Chat',
        workspaceId: defaultWorkspaceId,
        members: []
      });
      channels = [generalChannel];
    } else {
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
        channels = await Channel.find(filter);
      }
    }
    
    res.status(200).json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ message: 'Server error fetching channels' });
  }
};

export const createChannel = async (req: Request, res: Response) => {
  try {
    const { name, workspaceId, members } = req.body;
    if (!name || !workspaceId) {
      return res.status(400).json({ message: 'Name and workspaceId are required' });
    }
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({ message: 'Invalid workspaceId format' });
    }
    
    const memberIds = [new mongoose.Types.ObjectId((req as any).user.id)];
    if (members && Array.isArray(members)) {
      members.forEach((id: string) => {
        if (mongoose.Types.ObjectId.isValid(id) && id !== (req as any).user.id) {
          memberIds.push(new mongoose.Types.ObjectId(id));
        }
      });
    }
    
    const channel = await Channel.create({
      name,
      workspaceId: new mongoose.Types.ObjectId(workspaceId),
      members: memberIds
    });
    
    res.status(201).json(channel);
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ message: 'Server error creating channel' });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const channelId = req.params.channelId as string;
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({ message: 'Invalid channelId format' });
    }
    
    const messages = await Message.find({ channelId: new mongoose.Types.ObjectId(channelId) })
      .populate('sender', 'name initials color avatar')
      .sort({ createdAt: 1 })
      .limit(100);
      
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const channelId = req.params.channelId as string;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      return res.status(400).json({ message: 'Invalid channelId format' });
    }
    
    const message = await Message.create({
      channelId: new mongoose.Types.ObjectId(channelId),
      content,
      sender: new mongoose.Types.ObjectId((req as any).user.id)
    });
    
    const populatedMessage = await message.populate('sender', 'name initials color avatar');
    
    // Broadcast via socket.io
    const io = getIO();
    io.to(`channel_${channelId}`).emit('receive_message', populatedMessage);
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error sending message' });
  }
};
