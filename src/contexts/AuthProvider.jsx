import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData = {
        id: Date.now(),
        email,
        name: email.split('@')[0],
        loginMethod: 'email'
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true };
    } catch {
      return { success: false, error: 'Login failed' };
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
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.email.split('@')[0],
          loginMethod: 'email'
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};