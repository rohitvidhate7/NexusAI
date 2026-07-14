import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';

const SSOCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const processTokens = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      
      if (!accessToken) {
        console.error('No access token found in URL');
        navigate('/auth/login?error=missing_token', { replace: true });
        return;
      }

      // Save tokens
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      try {
        // Fetch user data using the new token
        const response = await api.get('/auth/me');
        const user = response.data;
        
        // Save user data
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        
        // Success! Go to workspaces
        navigate('/workspaces', { replace: true });
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Clean up on failure
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/auth/login?error=profile_fetch_failed', { replace: true });
      }
    };

    processTokens();
  }, [searchParams, navigate, setUser]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#040308',
      color: 'white',
      fontFamily: 'Space Grotesk, sans-serif'
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{
          width: 40,
          height: 40,
          border: '3px solid rgba(168, 85, 247, 0.3)',
          borderTopColor: '#A855F7',
          borderRadius: '50%',
          marginBottom: 20
        }}
      />
      <h2>Authenticating...</h2>
      <p style={{ color: '#71717A', marginTop: 8 }}>Please wait while we log you in safely.</p>
    </div>
  );
};

export default SSOCallback;
