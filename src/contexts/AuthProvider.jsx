import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { supabase } from '../lib/supabaseClient';
import { migrateGuestSettings } from '../services/settingsService';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }

      if (session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.email.split('@')[0],
          loginMethod: 'email'
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // Fallback to localStorage for development
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.email.split('@')[0],
            loginMethod: 'email'
          };
          
          // Migrate guest settings on auth state change
          try {
            const migrationResult = await migrateGuestSettings(session.user.id);
            if (migrationResult.migrated) {
              console.log('Successfully migrated guest settings via auth state change');
            }
          } catch (migrationError) {
            console.warn('Failed to migrate guest settings via auth state change:', migrationError);
          }
          
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('user');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { 
          success: false, 
          error: error.message || 'Login failed' 
        };
      }

      if (data?.user && data?.session) {
        // Migrate guest settings on login as well (in case user logged in on new device)
        try {
          const migrationResult = await migrateGuestSettings(data.user.id);
          if (migrationResult.migrated) {
            console.log('Successfully migrated guest settings during login');
          }
        } catch (migrationError) {
          console.warn('Failed to migrate guest settings during login:', migrationError);
          // Don't fail login if migration fails
        }

        // Let the auth state listener handle setting user state
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password, confirmPassword) => {
    setLoading(true);
    try {
      if (password !== confirmPassword) {
        return { success: false, error: 'Passwords do not match' };
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { 
          success: false, 
          error: error.message || 'Signup failed' 
        };
      }

      if (data?.user) {
        // Check if user needs email confirmation
        if (!data.session && data.user && !data.user.email_confirmed_at) {
          return {
            success: true,
            needsConfirmation: true,
            message: 'Please check your email to confirm your account before signing in.'
          };
        }

        // User is signed up and confirmed
        // Migrate guest settings to new user account
        try {
          const migrationResult = await migrateGuestSettings(data.user.id);
          if (migrationResult.migrated) {
            console.log('Successfully migrated guest settings to new user account');
          }
        } catch (migrationError) {
          console.warn('Failed to migrate guest settings:', migrationError);
          // Don't fail signup if migration fails
        }

        // Let the auth state listener handle setting user state
        return { success: true };
      }

      return { success: false, error: 'Signup failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Signup failed' };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const userData = {
        id: Date.now(),
        email: 'user@gmail.com',
        name: 'Google User',
        loginMethod: 'google'
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    } catch {
      return { success: false, error: 'Google login failed' };
    } finally {
      setLoading(false);
    }
  };

  const continueAsGuest = async () => {
    const guestData = {
      id: 'guest-' + Date.now(),
      email: 'guest@practisia.com',
      name: 'Guest User',
      loginMethod: 'guest',
      isGuest: true
    };
    
    setUser(guestData);
    localStorage.setItem('user', JSON.stringify(guestData));
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // The auth state listener will handle clearing user state
  };

  const value = {
    user,
    loading,
    login,
    signup,
    loginWithGoogle,
    continueAsGuest,
    logout,
    isAuthenticated: !!user,
    isGuest: user?.isGuest || false
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};