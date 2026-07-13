import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  content: string;
  sender: mongoose.Types.ObjectId;
  channelId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    content: { type: String, required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    channelId: { type: Schema.Types.ObjectId, ref: 'Channel', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>('Message', messageSchema);
