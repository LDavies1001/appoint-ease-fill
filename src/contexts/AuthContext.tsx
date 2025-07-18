import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  id: string;
  user_id: string;
  role: 'customer' | 'provider';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  role: 'customer' | 'provider';
  active_role: 'customer' | 'provider';
  email: string;
  name: string | null;
  phone: string | null;
  location: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_profile_complete: boolean;
  business_name?: string | null;
  privacy_settings?: {
    phone_visible: boolean;
    email_visible: boolean;
    location_visible: boolean;
  };
  gdpr_consent?: boolean;
  terms_accepted?: boolean;
  consent_date?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRoles: UserRole[];
  availableRoles: ('customer' | 'provider')[];
  loading: boolean;
  signUp: (email: string, password: string, role: 'customer' | 'provider', fullName?: string, phone?: string, location?: string, businessName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  switchRole: (role: 'customer' | 'provider') => Promise<{ error: any }>;
  addRole: (role: 'customer' | 'provider', businessName?: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  
  const availableRoles = userRoles.filter(role => role.is_active).map(role => role.role);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profileError) throw profileError;
      
      if (!profileData) {
        console.log('No profile found for user:', userId);
        setProfile(null);
        setUserRoles([]);
        return;
      }

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (rolesError) throw rolesError;
      
      setUserRoles(rolesData || []);

      let finalProfile: Profile = {
        ...profileData,
        privacy_settings: profileData.privacy_settings ? 
          (typeof profileData.privacy_settings === 'string' ? 
            JSON.parse(profileData.privacy_settings) : 
            profileData.privacy_settings
          ) : undefined
      };

      // If profile data is missing, try to get it from user metadata as fallback
      if (user) {
        const userMetadata = user.user_metadata || {};
        finalProfile = {
          ...finalProfile,
          name: finalProfile.name || userMetadata.full_name || null,
          phone: finalProfile.phone || userMetadata.phone || null,
          location: finalProfile.location || userMetadata.location || null
        };
      }

      // If user has provider role, also fetch business details
      const hasProviderRole = rolesData?.some(role => role.role === 'provider');
      if (hasProviderRole) {
        const { data: businessData, error: businessError } = await supabase
          .from('provider_details')
          .select('business_name')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!businessError && businessData) {
          finalProfile = { ...finalProfile, business_name: businessData.business_name };
        }
      }
      
      setProfile(finalProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signUp = async (email: string, password: string, role: 'customer' | 'provider', fullName?: string, phone?: string, location?: string, businessName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
          role: role,
          phone: phone || '',
          location: location || '',
          business_name: businessName || ''
        }
      }
    });

    // If signup was successful, ensure the profile has the correct data
    if (!error && data.user) {
      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Fetch the newly created profile to get the latest data
      await fetchUserProfile(data.user.id);
      
      // Update the profile with any additional information that might not have been saved by the trigger
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: role,
          name: fullName || null,
          phone: phone || null,
          location: location || null
        })
        .eq('user_id', data.user.id);
      
      if (updateError) {
        console.error('Error updating profile:', updateError);
      } else {
        // Refresh the profile data after update
        await fetchUserProfile(data.user.id);
      }

      // If it's a provider, also create provider_details record
      if (role === 'provider' && businessName) {
        const { error: providerError } = await supabase
          .from('provider_details')
          .insert({
            user_id: data.user.id,
            business_name: businessName,
            business_phone: phone || null
          });
        
        if (providerError) {
          console.error('Error creating provider details:', providerError);
        }
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }

    return { error };
  };

  const switchRole = async (role: 'customer' | 'provider') => {
    if (!user || !profile) return { error: new Error('No user logged in') };
    
    // Check if user has this role
    const hasRole = userRoles.some(userRole => userRole.role === role);
    if (!hasRole) {
      return { error: new Error('User does not have this role') };
    }

    const { error } = await supabase
      .from('profiles')
      .update({ active_role: role })
      .eq('user_id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, active_role: role } : null);
    }

    return { error };
  };

  const addRole = async (role: 'customer' | 'provider', businessName?: string) => {
    if (!user) return { error: new Error('No user logged in') };
    
    // Check if user already has this role
    const hasRole = userRoles.some(userRole => userRole.role === role);
    if (hasRole) {
      return { error: new Error('User already has this role') };
    }

    // Add the role to user_roles table
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: role
      });

    if (roleError) return { error: roleError };

    // If adding provider role and business name provided, create provider_details
    if (role === 'provider' && businessName) {
      const { error: providerError } = await supabase
        .from('provider_details')
        .upsert({
          user_id: user.id,
          business_name: businessName
        });
      
      if (providerError) return { error: providerError };
    }

    // Refresh user data
    await fetchUserProfile(user.id);
    
    return { error: null };
  };

  const value = {
    user,
    session,
    profile,
    userRoles,
    availableRoles,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    switchRole,
    addRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};