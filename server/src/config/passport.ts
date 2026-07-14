import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback', // We use relative path for proxy/load balancer, but absolute is sometimes safer. Let's rely on standard config or use full URL in prod.
        proxy: true // Trust the reverse proxy (Render) to keep HTTPS
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found from Google profile'), false);
          }

          // Check if user already exists
          let user = await User.findOne({ email });

          if (user) {
            // If they exist but don't have google provider, maybe link it? 
            // For now, just allow login
            if (user.authProvider !== 'google') {
              user.authProvider = 'google';
              user.providerId = profile.id;
              await user.save();
            }
            return done(null, user);
          }

          // Generate initials and random color
          const nameParts = profile.displayName.split(' ');
          const initials = nameParts.length > 1 
            ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
            : profile.displayName.substring(0, 2).toUpperCase();
          
          const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];
          const color = colors[Math.floor(Math.random() * colors.length)];

          // Create new user
          user = await User.create({
            name: profile.displayName,
            email,
            authProvider: 'google',
            providerId: profile.id,
            isEmailVerified: true,
            avatar: profile.photos?.[0]?.value,
            initials,
            color,
            role: 'developer', // Default role
            status: 'active'
          });

          // Seed default workspace/project if needed
          try {
            const { seedWorkspaceForUser } = await import('../utils/seeder.js');
            await seedWorkspaceForUser(user._id.toString());
          } catch (seedError) {
            console.error('Error seeding workspace for new Google user:', seedError);
            // Non-fatal error
          }

          return done(null, user);
        } catch (error) {
          console.error('Google OAuth Error:', error);
          return done(error as Error, false);
        }
      }
    )
  );
} else {
  console.warn('⚠️ Google OAuth environment variables are missing. Google login will not work.');
}

export default passport;
