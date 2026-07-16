import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Channel from '../models/Channel.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB.');

    const channels = await Channel.find({});
    console.log('All channels in database:');
    channels.forEach((c) => {
      console.log(`- Name: "${c.name}", ID: "${c._id}", WorkspaceID: "${c.workspaceId}", Members: [${c.members.join(', ')}]`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
