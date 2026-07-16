import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB.');

    const workspaces = await Workspace.find({}).populate('members.user', 'name email');
    console.log('Workspaces found in database:');
    workspaces.forEach((w) => {
      console.log(`\n- Workspace Name: "${w.name}"`);
      console.log(`  ID: "${w._id}"`);
      console.log(`  Slug: "${w.slug}"`);
      console.log(`  Owner: "${w.owner}"`);
      console.log(`  Members (${w.members.length}):`);
      w.members.forEach((m: any) => {
        if (m.user) {
          console.log(`    * Name: "${m.user.name}", Email: "${m.user.email}", ID: "${m.user._id}", Role: "${m.role}"`);
        } else {
          console.log(`    * (Unknown User - ID: ${m.user})`);
        }
      });
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
