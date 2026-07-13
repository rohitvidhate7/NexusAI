import mongoose, { Document, Schema } from 'mongoose';

export interface IChannel extends Document {
  name: string;
  workspaceId: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<IChannel>(
  {
    name: { type: String, required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default mongoose.model<IChannel>('Channel', channelSchema);
