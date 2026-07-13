import mongoose, { Schema } from 'mongoose';

const DocumentSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: String, required: true },
  url: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
}, { timestamps: true });

export default mongoose.model('Document', DocumentSchema);
