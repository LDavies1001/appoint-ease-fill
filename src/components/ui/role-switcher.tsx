import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Users, UserCheck, Plus, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const RoleSwitcher = () => {
  const { profile, availableRoles, switchRole, addRole } = useAuth();
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Always show the component if user is logged in
  if (!profile) {
    return null;
  }

  const handleSwitchRole = async (role: 'customer' | 'provider') => {
    if (profile.active_role === role) return;
    
    setIsLoading(true);
    const { error } = await switchRole(role);
    setIsLoading(false);
    
    if (error) {
      toast.error('Failed to switch role');
    } else {
      toast.success(`Switched to ${role} mode`);
      window.location.reload(); // Refresh to update the UI
    }
  };

  const handleAddRole = async (role: 'customer' | 'provider') => {
    if (role === 'provider' && !businessName.trim()) {
      toast.error('Business name is required for provider role');
      return;
    }

    setIsLoading(true);
    const { error } = await addRole(role, businessName.trim() || undefined);
    setIsLoading(false);
    
    if (error) {
      toast.error('Failed to add role');
    } else {
      toast.success(`${role} role added successfully`);
      setIsAddRoleDialogOpen(false);
      setBusinessName('');
    }
  };

  const getCurrentRoleLabel = () => {
    return profile.active_role === 'customer' ? 'Customer' : 'Provider';
  };

  const getCurrentRoleIcon = () => {
    return profile.active_role === 'customer' ? <Users className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Current Role Display */}
      <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-md">
        {getCurrentRoleIcon()}
        <span className="text-sm font-medium">{getCurrentRoleLabel()}</span>
      </div>

      {/* Role Switcher - only show if user has multiple roles */}
      {availableRoles.length > 1 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading}>
              Switch Role
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {availableRoles.map((role) => (
              <DropdownMenuItem
                key={role}
                onClick={() => handleSwitchRole(role)}
                className="flex items-center gap-2"
              >
                {role === 'customer' ? <Users className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                <span className="capitalize">{role}</span>
                {profile.active_role === role && (
                  <Badge variant="secondary" className="ml-auto">Active</Badge>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        /* Add Role Button - show if user only has one role */
        <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add {availableRoles[0] === 'customer' ? 'Provider' : 'Customer'} Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add {availableRoles[0] === 'customer' ? 'Provider' : 'Customer'} Role</DialogTitle>
              <DialogDescription>
                {availableRoles[0] === 'customer' 
                  ? 'Start offering services and grow your business by adding a provider role.'
                  : 'Book services from other providers by adding a customer role.'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {availableRoles[0] === 'customer' && (
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Enter your business name"
                  />
                </div>
              )}
              <Button
                onClick={() => handleAddRole(availableRoles[0] === 'customer' ? 'provider' : 'customer')}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Adding...' : `Add ${availableRoles[0] === 'customer' ? 'Provider' : 'Customer'} Role`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
