'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const { userProfile, stores, addStore, deleteStore } = useApp();
  const [newStoreName, setNewStoreName] = useState('');
  const [isAddingStore, setIsAddingStore] = useState(false);

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
        title: "Organization Settings Saved",
        description: "Organization profile updated successfully."
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Failed to save settings."
      });
    }
  };

  const handleAddStore = async () => {
    if (!newStoreName.trim()) return;
    setIsAddingStore(true);
    try {
      await addStore({ name: newStoreName, createdAt: new Date() }); // timestamp handled in context
      toast({ title: 'Location Added', description: `${newStoreName} has been created.` });
      setNewStoreName('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add location.' });
    } finally {
      setIsAddingStore(false);
    }
  };

  const handleDeleteStore = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      deleteStore(id);
      toast({ title: 'Location Deleted', description: `${name} has been removed.` });
    }
  };


  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-20">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Store Settings
        </h1>

        <Tabs defaultValue="organization" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
          </TabsList>

          <TabsContent value="organization" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Profile</CardTitle>
                <CardDescription>
                  Manage your organization's public details, logo, and contact info.
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
                    <Label htmlFor="logo-upload">Organization Logo</Label>
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
                    <Label htmlFor="name">Organization Name</Label>
                    <Input id="name" value={storeForm.name} onChange={handleStoreChange} placeholder="e.g. Acme Tailors" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={storeForm.phone} onChange={handleStoreChange} placeholder="e.g. 555-0123" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={storeForm.email} onChange={handleStoreChange} placeholder="contact@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" value={storeForm.website} onChange={handleStoreChange} placeholder="www.example.com" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
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
              <Button onClick={handleSaveStoreSettings}>Save Organization Settings</Button>
            </div>
          </TabsContent>

          <TabsContent value="locations" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Locations</CardTitle>
                <CardDescription>Add or remove store locations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4 items-end">
                  <div className="space-y-2 flex-1">
                    <Label>New Location Name</Label>
                    <Input
                      placeholder="e.g. Downtown Branch"
                      value={newStoreName}
                      onChange={(e) => setNewStoreName(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleAddStore} disabled={isAddingStore}>
                    {isAddingStore ? 'Adding...' : 'Add Location'}
                  </Button>
                </div>

                <div className="space-y-4 mt-6">
                  <h3 className="text-sm font-medium">Existing Locations</h3>
                  {stores.length === 0 && <p className="text-sm text-muted-foreground">No locations found.</p>}
                  <div className="grid gap-4">
                    <div className="grid gap-4">
                      {stores.map((store, index) => {
                        const isPrimary = index === 0;
                        return (
                          <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{store.name}</p>
                                {isPrimary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground">ID: {store.id}</p>
                            </div>
                            {!isPrimary && (
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteStore(store.id, store.name)}>
                                Delete
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </DashboardLayout>
  );
}
