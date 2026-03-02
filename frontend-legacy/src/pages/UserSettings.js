import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'sonner';
import { User, Shield, Lock } from 'lucide-react';

const UserSettings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPassword: '', confirm: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.users.getMe();
        setProfile(res.data);
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    toast.info('Password change feature coming soon');
    setPasswordForm({ current: '', newPassword: '', confirm: '' });
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6 max-w-2xl" data-testid="user-settings">
      <h2 className="text-3xl font-heading font-bold">Settings</h2>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Profile Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-muted-foreground text-xs">Name</Label><p className="font-medium">{profile?.name}</p></div>
            <div><Label className="text-muted-foreground text-xs">Email</Label><p className="font-medium">{profile?.email}</p></div>
            <div><Label className="text-muted-foreground text-xs">Mobile</Label><p className="font-medium">{profile?.mobile}</p></div>
            <div><Label className="text-muted-foreground text-xs">Role</Label><Badge variant="outline" className="capitalize">{profile?.role?.replace('_', ' ')}</Badge></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> KYC Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Verification Status</p>
              <p className="font-medium mt-1">{profile?.kycStatus ? 'Verified' : 'Not Verified'}</p>
            </div>
            <Badge className={profile?.kycStatus ? 'bg-accent' : 'bg-yellow-500'}>
              {profile?.kycStatus ? 'Verified' : 'Pending'}
            </Badge>
          </div>
          {profile?.panCard && <div className="mt-3"><Label className="text-xs text-muted-foreground">PAN</Label><p>{profile.panCard}</p></div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="w-5 h-5" /> Change Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} required data-testid="current-password" />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required data-testid="new-password" />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} required data-testid="confirm-password" />
            </div>
            <Button type="submit" className="bg-accent hover:bg-accent-hover" data-testid="change-password-btn">Update Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSettings;
