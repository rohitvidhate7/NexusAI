import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { initSocket, disconnectSocket } from '../lib/socket';
import type { User } from '../types';
import toast from 'react-hot-toast';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  oauthLogin: (data: any) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isClerkEnabled = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY && !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.includes('Zm9vYmFy') && !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY.includes('disabled');

// ── Clerk Auth Provider ──
const ClerkAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const { isSignedIn, user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { getToken, signOut: clerkSignOut } = useClerkAuth();

  useEffect(() => {
    if (isClerkLoaded) {
      if (isSignedIn && clerkUser) {
        const formattedUser: User = {
          id: clerkUser.id,
          name: clerkUser.fullName || clerkUser.username || 'Clerk User',
          email: clerkUser.primaryEmailAddress?.emailAddress || '',
          role: (clerkUser.publicMetadata as any)?.role || 'developer',
          initials: clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName[0]}${clerkUser.lastName[0]}`.toUpperCase()
            : (clerkUser.username ? clerkUser.username.substring(0, 2).toUpperCase() : 'U'),
          color: '#8b5cf6',
          joinedAt: new Date(clerkUser.createdAt || Date.now()).toLocaleDateString(),
          status: 'active'
        };

        setUser(formattedUser);

        getToken().then((token: string | null) => {
          if (token) {
            localStorage.setItem('accessToken', token);
            localStorage.setItem('user', JSON.stringify(formattedUser));
            initSocket(token);
          }
        });
      } else {
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('accessToken');
        
        if (savedUser && token && !token.startsWith('clerk_')) {
          try {
            setUser(JSON.parse(savedUser));
            initSocket(token);
          } catch (e) {
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    }
  }, [isSignedIn, clerkUser, isClerkLoaded]);

  const login = async (credentials: any) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { user: userData, tokens } = response.data;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      initSocket(tokens.accessToken);
      
      toast.success(`Welcome back, ${userData.name}!`);
      navigate('/dashboard');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to login';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user: newUserData, tokens } = response.data;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(newUserData));
      
      setUser(newUserData);
      initSocket(tokens.accessToken);
      
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to register';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const oauthLogin = async (oauthData: any) => {
    try {
      const response = await api.post('/auth/oauth-login', oauthData);
      const { user: userData, tokens } = response.data;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      initSocket(tokens.accessToken);
      
      toast.success(`Successfully logged in via ${oauthData.provider}!`);
      navigate('/dashboard');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'OAuth login failed';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    if (isSignedIn) {
      clerkSignOut();
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    disconnectSocket();
    navigate('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, oauthLogin, logout, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// ── Local Sandbox Auth Provider ──
const LocalAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    
    if (savedUser && token && !token.startsWith('clerk_')) {
      try {
        setUser(JSON.parse(savedUser));
        initSocket(token);
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: any) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { user: userData, tokens } = response.data;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      initSocket(tokens.accessToken);
      
      toast.success(`Welcome back, ${userData.name}!`);
      navigate('/dashboard');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to login';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user: newUserData, tokens } = response.data;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(newUserData));
      
      setUser(newUserData);
      initSocket(tokens.accessToken);
      
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to register';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const oauthLogin = async (oauthData: any) => {
    try {
      const response = await api.post('/auth/oauth-login', oauthData);
      const { user: userData, tokens } = response.data;
      
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      initSocket(tokens.accessToken);
      
      toast.success(`Successfully logged in via ${oauthData.provider}!`);
      navigate('/dashboard');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'OAuth login failed';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    disconnectSocket();
    navigate('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, oauthLogin, logout, setUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = isClerkEnabled ? ClerkAuthProvider : LocalAuthProvider;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
