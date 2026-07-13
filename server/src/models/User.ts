import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'project_manager' | 'developer' | 'qa' | 'designer' | 'client' | 'guest';
  status: 'active' | 'away' | 'offline';
  joinedAt: Date;
  initials: string;
  color: string;
  authProvider: 'local' | 'google' | 'github';
  providerId?: string;
  isEmailVerified: boolean;
  otpCode?: string;
  otpExpiresAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  plan: 'Free' | 'Pro' | 'Business' | 'Enterprise';
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String }, // Optional for OAuth users
    avatar: { type: String },
    role: { 
      type: String, 
      enum: ['owner', 'admin', 'project_manager', 'developer', 'qa', 'designer', 'client', 'guest'],
      default: 'developer'
    },
    status: { type: String, enum: ['active', 'away', 'offline'], default: 'active' },
    joinedAt: { type: Date, default: Date.now },
    initials: { type: String, required: true },
    color: { type: String, required: true },
    authProvider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },
    providerId: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    otpCode: { type: String },
    otpExpiresAt: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    plan: { type: String, enum: ['Free', 'Pro', 'Business', 'Enterprise'], default: 'Free' }
  },
  { timestamps: true }
);

// Pre-save hook to generate initials and random color if not provided
userSchema.pre('validate', function() {
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

export default mongoose.model<IUser>('User', userSchema);
