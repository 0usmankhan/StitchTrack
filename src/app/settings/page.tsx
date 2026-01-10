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
  const { userProfile } = useApp();

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
          Store Settings
        </h1>

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
      </div>
    </DashboardLayout>
  );
}
