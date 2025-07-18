import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  role: 'customer' | 'provider';
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
  loading: boolean;
  signUp: (email: string, password: string, role: 'customer' | 'provider', fullName?: string, phone?: string, location?: string, businessName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
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
  const [loading, setLoading] = useState(true);

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
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profileError) throw profileError;
      
      if (!profileData) {
        console.log('No profile found for user:', userId);
        setProfile(null);
        return;
      }

      let finalProfile: Profile = {
        ...profileData,
        privacy_settings: profileData.privacy_settings ? 
          (typeof profileData.privacy_settings === 'string' ? 
            JSON.parse(profileData.privacy_settings) : 
            profileData.privacy_settings
          ) : undefined
      };

      // If user is a provider, also fetch business details
      if (profileData.role === 'provider') {
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update the profile with the collected information
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

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};