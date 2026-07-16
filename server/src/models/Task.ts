import mongoose, { Document, Schema } from 'mongoose';

export interface ISubtask {
  _id?: mongoose.Types.ObjectId;
  title: string;
  done: boolean;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'high' | 'medium' | 'low';
  assignee?: mongoose.Types.ObjectId;
  reporter: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  storyPoints?: number;
  sprint?: string;
  labels: string[];
  startDate?: Date;
  dueDate?: Date;
  progress?: number;
  subtasks?: ISubtask[];
  dependencies?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const subtaskSchema = new Schema<ISubtask>({
  title: { type: String, required: true },
  done: { type: Boolean, default: false }
});

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: { 
      type: String, 
      enum: ['backlog', 'todo', 'in_progress', 'review', 'done'], 
      default: 'todo' 
    },
    priority: { 
      type: String, 
      enum: ['high', 'medium', 'low'], 
      default: 'medium' 
    },
    assignee: { type: Schema.Types.ObjectId, ref: 'User' },
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    storyPoints: { type: Number },
    sprint: { type: String },
    labels: [{ type: String }],
    startDate: { type: Date },
    dueDate: { type: Date },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    subtasks: [subtaskSchema],
    dependencies: [{ type: Schema.Types.ObjectId, ref: 'Task' }]
  },
  { timestamps: true }
);

export default mongoose.model<ITask>('Task', taskSchema);
