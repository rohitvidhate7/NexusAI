import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkspace extends Document {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  type: 'team' | 'organization';
  owner: mongoose.Types.ObjectId;
  members: {
    user: mongoose.Types.ObjectId;
    role: 'owner' | 'admin' | 'member' | 'viewer';
  }[];
  status: 'active' | 'archived';
  initials: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    logo: { type: String },
    type: { type: String, enum: ['team', 'organization'], default: 'team' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' }
    }],
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    initials: { type: String, required: true },
    color: { type: String, required: true }
  },
  { timestamps: true }
);

workspaceSchema.pre('validate', function() {
  if (this.name && !this.initials) {
    const names = this.name.split(' ');
    this.initials = names.length > 1 
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : this.name.substring(0, 2).toUpperCase();
  }
  
  if (!this.color) {
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }
});

export default mongoose.model<IWorkspace>('Workspace', workspaceSchema);
