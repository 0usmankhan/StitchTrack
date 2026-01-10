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
import type { FirestoreUserProfile, StoreDetails } from '@/lib/types';
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

  /* ------------------------------------------------------------------------- */
  /*  Store Profile State & Handlers                                         */
  /* ------------------------------------------------------------------------- */
  const { storeDetails, setStoreDetails } = useSettings();
  const [storeForm, setStoreForm] = useState<StoreDetails>(storeDetails);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (storeDetails) {
      setStoreForm(storeDetails);
    }
  }, [storeDetails]);

  const handleStoreChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setStoreForm(prev => ({ ...prev, [id]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!userProfile?.associatedAccountId && !userProfile?.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not determine account ID for upload.'
      });
      return;
    }
    const accountId = userProfile?.associatedAccountId || userProfile?.id;

    setIsUploading(true);
    try {
      const { initializeFirebase } = await import('@/firebase');
      const { storage: initializedStorage } = initializeFirebase();

      if (!initializedStorage) throw new Error("Storage not initialized");
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

      const storageRef = ref(initializedStorage, `logos/${accountId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setStoreForm(prev => ({ ...prev, logoUrl: url }));
      toast({
        title: "Logo Uploaded",
        description: "Store logo has been updated successfully."
      });

    } catch (error: any) {
      console.error("Upload failed", error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to upload logo image.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveStoreSettings = async () => {
    try {
      await setStoreDetails(storeForm);
      toast({
        title: "Store Settings Saved",
        description: "Organization profile updated successfully."
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to save store settings."
      });
    }
  };


  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-20">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Settings
        </h1>

        <Tabs defaultValue="store-profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="store-profile">Store Profile</TabsTrigger>
            <TabsTrigger value="account">My Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="store-profile" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Profile</CardTitle>
                <CardDescription>
                  Manage your store's public details, logo, and contact info.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Section */}
                <div className="flex items-center gap-6">
                  <div className="relative h-24 w-24 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/10">
                    {storeForm.logoUrl ? (
                      <img src={storeForm.logoUrl} alt="Store Logo" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-muted-foreground text-center p-2">No Logo</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="logo-upload">Store Logo</Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploading}
                    />
                    <p className="text-xs text-muted-foreground">Recommended: Square PNG or JPG, at least 400x400px.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Store Name</Label>
                    <Input id="name" value={storeForm.name} onChange={handleStoreChange} placeholder="e.g. Acme Tailors" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Store Phone</Label>
                    <Input id="phone" value={storeForm.phone} onChange={handleStoreChange} placeholder="e.g. 555-0123" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Store Email</Label>
                    <Input id="email" value={storeForm.email} onChange={handleStoreChange} placeholder="contact@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" value={storeForm.website} onChange={handleStoreChange} placeholder="www.example.com" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Store Address</Label>
                  <textarea
                    id="address"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={storeForm.address}
                    onChange={handleStoreChange}
                    placeholder="123 Main St, City, Country"
                  />
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={handleSaveStoreSettings}>Save Store Settings</Button>
            </div>
          </TabsContent>

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
