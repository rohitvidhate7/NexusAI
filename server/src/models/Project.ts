import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  description: string;
  workspaceId: mongoose.Types.ObjectId;
  status: 'on_track' | 'at_risk' | 'behind' | 'completed';
  progress: number;
  members: mongoose.Types.ObjectId[];
  deadline?: Date;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    description: { type: String },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    status: { 
      type: String, 
      enum: ['on_track', 'at_risk', 'behind', 'completed'], 
      default: 'on_track' 
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    deadline: { type: Date },
    color: { type: String, default: '#8b5cf6' },
    icon: { type: String, default: '🚀' }
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', projectSchema);
