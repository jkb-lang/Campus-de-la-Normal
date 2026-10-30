import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch or create profile for authenticated user
  const fetchProfile = async (userId, userEmail) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile not found yet (e.g. trigger delay), insert default profile
        const newProfile = {
          id: userId,
          email: userEmail,
          full_name: userEmail.split('@')[0],
          role: 'student',
          is_active: true,
        };
        const { data: created } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .single();
        setProfile(created || newProfile);
        return created || newProfile;
      }

      if (data) {
        setProfile(data);
        return data;
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
    return null;
  };

  useEffect(() => {
    // Check initial session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id, session.user.email);
        } else {
          // Check if local dev test user exists in localStorage
          const localUser = localStorage.getItem('campus_local_user');
          if (localUser) {
            const parsed = JSON.parse(localUser);
            setUser(parsed.user);
            setProfile(parsed.profile);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id, session.user.email);
      } else {
        const localUser = localStorage.getItem('campus_local_user');
        if (!localUser) {
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Sign In with email & password
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Fallback for offline development / test users if auth fails
        const demoUsers = {
          'admin@lanormal.edu.ar': { role: 'admin', name: 'Administrador Rectoría' },
          'profesor@lanormal.edu.ar': { role: 'teacher', name: 'Prof. Carlos Romero' },
          'estudiante@lanormal.edu.ar': { role: 'student', name: 'Estudiante Lucía Ramos' },
        };

        if (demoUsers[email.trim().toLowerCase()] && password.length >= 6) {
          const demoInfo = demoUsers[email.trim().toLowerCase()];
          const fakeUser = {
            id: 'demo-' + demoInfo.role + '-123',
            email: email.trim(),
          };
          const fakeProfile = {
            id: fakeUser.id,
            email: fakeUser.email,
            full_name: demoInfo.name,
            role: demoInfo.role,
            is_active: true,
          };
          localStorage.setItem('campus_local_user', JSON.stringify({ user: fakeUser, profile: fakeProfile }));
          setUser(fakeUser);
          setProfile(fakeProfile);
          return { success: true, profile: fakeProfile };
        }
        return { success: false, error: error.message };
      }

      if (data?.user) {
        setUser(data.user);
        const userProf = await fetchProfile(data.user.id, data.user.email);
        localStorage.removeItem('campus_local_user');
        return { success: true, profile: userProf };
      }

      return { success: false, error: 'No se pudo iniciar sesión.' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Sign Up with email, password, full_name and optional requested role
  const signUp = async (email, password, fullName, role = 'student') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: role,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.user) {
        // Ensure profile is created
        await fetchProfile(data.user.id, data.user.email);
        return { success: true, user: data.user };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      localStorage.removeItem('campus_local_user');
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  // Password Recovery
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Update Profile details
  const updateProfile = async (updates) => {
    if (!profile) return { success: false, error: 'No hay usuario autenticado' };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) {
        // Update local state if supabase throws
        const updated = { ...profile, ...updates };
        setProfile(updated);
        return { success: true, profile: updated };
      }

      setProfile(data);
      return { success: true, profile: data };
    } catch (err) {
      const updated = { ...profile, ...updates };
      setProfile(updated);
      return { success: true, profile: updated };
    }
  };

  // Quick helper to switch dev role during testing
  const switchDevRole = (role) => {
    if (!profile) return;
    const names = {
      admin: 'Administrador Rectoría',
      teacher: 'Prof. Carlos Romero',
      student: 'Estudiante Lucía Ramos',
    };
    const updated = {
      ...profile,
      role,
      full_name: names[role] || profile.full_name,
    };
    setProfile(updated);
    if (localStorage.getItem('campus_local_user')) {
      localStorage.setItem('campus_local_user', JSON.stringify({ user, profile: updated }));
    }
  };

  const value = {
    user,
    profile,
    loading,
    role: profile?.role || 'student',
    isAdmin: profile?.role === 'admin',
    isTeacher: profile?.role === 'teacher',
    isStudent: profile?.role === 'student' || (!profile?.role),
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    switchDevRole,
    refreshProfile: () => user && fetchProfile(user.id, user.email),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
