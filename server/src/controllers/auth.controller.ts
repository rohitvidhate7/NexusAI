import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { seedWorkspaceForUser } from '../utils/seeder.js';

const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign(
    { id: userId, role }, 
    process.env.JWT_SECRET!, 
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { id: userId }, 
    process.env.JWT_REFRESH_SECRET!, 
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      authProvider: 'local'
    });

    await seedWorkspaceForUser(user._id.toString());

    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.role);

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        initials: user.initials,
        color: user.color
      },
      tokens: { accessToken, refreshToken }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.authProvider !== 'local') {
      return res.status(400).json({ message: 'Please login using your OAuth provider' });
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    await seedWorkspaceForUser(user._id.toString());

    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.role);

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        initials: user.initials,
        color: user.color
      },
      tokens: { accessToken, refreshToken }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const verifyEmailOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.isEmailVerified) return res.status(400).json({ message: 'Email already verified' });
    
    if (user.otpCode !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    
    user.isEmailVerified = true;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();
    
    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();
    
    console.log(`\n================================`);
    console.log(`PASSWORD RESET LINK FOR ${email}:`);
    console.log(`http://localhost:5173/auth/reset-password?token=${token}`);
    console.log(`================================\n`);
    
    res.status(200).json({ message: 'Password reset link generated and logged to console' });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Server error during forgot password' });
  }
};
 
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({ 
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });
    
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

export const oauthLogin = async (req: Request, res: Response) => {
  try {
    const { email, name, provider } = req.body;
    
    if (!email || !name || !provider) {
      return res.status(400).json({ message: 'Email, name and provider are required' });
    }
    
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        authProvider: provider,
        isEmailVerified: true
      });
    }
    
    await seedWorkspaceForUser(user._id.toString());
    
    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.role);
    
    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        initials: user.initials,
        color: user.color
      },
      tokens: { accessToken, refreshToken }
    });
  } catch (error) {
    console.error('OAuth Login Error:', error);
    res.status(500).json({ message: 'Server error during OAuth login' });
  }
};

