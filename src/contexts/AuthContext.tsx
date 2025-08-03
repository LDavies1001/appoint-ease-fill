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
  signUp: (email: string, password: string, role: 'customer' | 'provider', fullName?: string, phone?: string, location?: string, businessName?: string, latitude?: number, longitude?: number, serviceRadius?: number, postcodeData?: any) => Promise<{ error: any }>;
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
    console.log('AuthContext - Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext - Auth state changed:', { event, hasSession: !!session, hasUser: !!session?.user });
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('AuthContext - User found, fetching profile...');
          // Fetch user profile with timeout to prevent blocking
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
          }, 0);
        } else {
          console.log('AuthContext - No user, clearing profile');
          setProfile(null);
          setUserRoles([]);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    console.log('AuthContext - Checking for existing session...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('AuthContext - Error getting session:', error);
        setLoading(false);
        return;
      }
      
      console.log('AuthContext - Initial session check:', { hasSession: !!session, hasUser: !!session?.user });
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('AuthContext - Initial user found, fetching profile...');
        fetchUserProfile(session.user.id);
      } else {
        console.log('AuthContext - No initial session, setting loading to false');
        setLoading(false);
      }
    });

    return () => {
      console.log('AuthContext - Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('AuthContext - Fetching profile for user:', userId);
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profileError) {
        console.error('AuthContext - Profile error:', profileError);
        throw profileError;
      }
      
      if (!profileData) {
        console.log('AuthContext - No profile found for user:', userId);
        console.log('AuthContext - This user needs to complete profile setup');
        setProfile(null);
        setUserRoles([]);
        setLoading(false);
        return;
      }
      
      console.log('AuthContext - Profile found:', { 
        userId: profileData.user_id, 
        role: profileData.role, 
        complete: profileData.is_profile_complete 
      });
      
      // Transform the profile data to match our interface
      const transformedProfile: Profile = {
        ...profileData,
        privacy_settings: profileData.privacy_settings && typeof profileData.privacy_settings === 'object' 
          ? profileData.privacy_settings as { phone_visible: boolean; email_visible: boolean; location_visible: boolean; }
          : undefined
      };
      
      setProfile(transformedProfile);

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      
      if (rolesError) {
        console.error('AuthContext - Roles error:', rolesError);
        throw rolesError;
      }
      
      console.log('AuthContext - Roles found:', rolesData?.length || 0);
      setUserRoles(rolesData || []);
      setLoading(false);
    } catch (error) {
      console.error('AuthContext - Error fetching user data:', error);
      setProfile(null);
      setUserRoles([]);
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: 'customer' | 'provider', fullName?: string, phone?: string, location?: string, businessName?: string, latitude?: number, longitude?: number, serviceRadius?: number, postcodeData?: any) => {
    console.log('SignUp called with:', { email, role, fullName, phone, location, businessName });
    const redirectUrl = 'https://openslot.uk/auth';
    
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
        const providerInsertData: any = {
          user_id: data.user.id,
          business_name: businessName,
          business_phone: phone || null,
          business_postcode: location || null
        };

        // Add geocoded location data if available
        if (latitude && longitude) {
          providerInsertData.latitude = latitude;
          providerInsertData.longitude = longitude;
        }

        if (serviceRadius) {
          providerInsertData.service_radius_miles = parseInt(serviceRadius.toString());
        }

        if (postcodeData) {
          providerInsertData.postcode_data = postcodeData;
        }

        const { error: providerError } = await supabase
          .from('provider_details')
          .insert(providerInsertData);
        
        if (providerError) {
          console.error('Error creating provider details:', providerError);
        }
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext - signIn called with email:', email);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    console.log('AuthContext - signIn result:', { error: !!error, errorMessage: error?.message });
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
    
    try {
      // Use the secure role switching function
      const { data, error } = await supabase.rpc('secure_role_switch', {
        target_role: role,
        business_name: role === 'provider' ? profile.business_name : null
      });

      if (error) throw error;

      const result = data as { success?: boolean; error?: string; role?: string };
      
      if (result.error) {
        return { error: new Error(result.error) };
      }

      if (result.success) {
        // Refresh user profile to get updated role
        await fetchUserProfile(user.id);
        return { error: null };
      }

      return { error: new Error('Unknown error occurred') };
    } catch (error) {
      console.error('Role switch error:', error);
      return { error: error as Error };
    }
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