'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { useApp } from '@/context/app-context';
import type { FirestoreUserProfile } from '@/lib/types';
import { useUser } from '@/firebase';
import { Eye, EyeOff } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings } from '@/context/settings-context';

export default function SettingsPage() {
  const { toast } = useToast();
  const { userProfile, updateUserProfile } = useApp();
  const { user } = useUser();

  const [profile, setProfile] = useState<Partial<FirestoreUserProfile>>({
    displayName: '',
    email: '',
    phoneNumber: '',
  });

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setProfile({
        displayName: userProfile.displayName || '',
        email: userProfile.email,
        phoneNumber: userProfile.phoneNumber || '',
      });
    } else if (user) {
      setProfile({
        displayName: user.displayName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [userProfile, user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfile(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveChanges = () => {
    let updateData: Partial<FirestoreUserProfile> = { ...profile };

    if (pin) {
      if (pin !== confirmPin) {
        toast({
          variant: 'destructive',
          title: 'PINs do not match',
          description: 'Please ensure your PINs match before saving.',
        });
        return;
      }
      updateData.accessPin = pin;
    }

    updateUserProfile(updateData);

    toast({
      title: 'Settings Saved',
      description: 'Your changes have been successfully saved.',
    });

    setPin('');
    setConfirmPin('');
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-20">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Settings
        </h1>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Update your personal details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Full Name</Label>
                  <Input id="displayName" value={profile.displayName} onChange={handleProfileChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={profile.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input id="phoneNumber" value={profile.phoneNumber} onChange={handleProfileChange} />
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={handleSaveChanges}>Save Account Changes</Button>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Update your POS access PIN. Leave blank to keep your current PIN.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pin">New Access PIN</Label>
                    <div className="relative">
                      <Input id="pin" type={showPin ? "text" : "password"} value={pin} onChange={(e) => setPin(e.target.value)} />
                      <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-full" onClick={() => setShowPin(!showPin)}>
                        {showPin ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPin">Confirm New PIN</Label>
                    <div className="relative">
                      <Input id="confirmPin" type={showConfirmPin ? "text" : "password"} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} />
                      <Button variant="ghost" size="icon" className="absolute top-0 right-0 h-full" onClick={() => setShowConfirmPin(!showConfirmPin)}>
                        {showConfirmPin ? <EyeOff /> : <Eye />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={handleSaveChanges}>Save Security Changes</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
