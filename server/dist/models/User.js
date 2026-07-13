"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const userSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
// Pre-save hook to generate initials and random color if not provided
userSchema.pre('validate', function () {
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
exports.default = mongoose_1.default.model('User', userSchema);
