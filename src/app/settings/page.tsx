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
import { TemplateEditor } from '@/components/template-editor';
import { useSettings } from '@/context/settings-context';

export default function SettingsPage() {
  const { toast } = useToast();
  const { userProfile, updateUserProfile } = useApp();
  const { user } = useUser();
  const {
    receiptTemplate,
    setReceiptTemplate,
    invoiceTemplate,
    setInvoiceTemplate,
    labelTemplate,
    setLabelTemplate
  } = useSettings();

  const [profile, setProfile] = useState<Partial<FirestoreUserProfile>>({
    displayName: '',
    email: '',
    phoneNumber: '',
  });

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Template States
  const [currentReceiptTemplate, setCurrentReceiptTemplate] = useState(receiptTemplate);
  const [currentInvoiceTemplate, setCurrentInvoiceTemplate] = useState(invoiceTemplate || '');
  const [currentLabelTemplate, setCurrentLabelTemplate] = useState(labelTemplate);

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

  const handleSaveTemplates = () => {
    setReceiptTemplate(currentReceiptTemplate);
    // If empty string, set to undefined to trigger default component fallback
    setInvoiceTemplate(currentInvoiceTemplate.trim() === '' ? undefined : currentInvoiceTemplate);
    setLabelTemplate(currentLabelTemplate);

    toast({
      title: 'Templates Saved',
      description: 'Your template changes have been successfully saved.',
    });
  };

  const receiptPlaceholders = [
    '{{store_name}}', '{{store_address}}', '{{store_phone}}', '{{store_website}}',
    '{{invoice.date}}', '{{invoice.id}}', '{{ticket_no}}', '{{customer.name}}',
    '{{#each items}}', '{{this.name}}', '{{this.quantity}}', '{{this.total}}', '{{/each}}',
    '{{invoice.subtotal}}', '{{invoice.tax}}', '{{invoice.total}}',
    '{{invoice.paid}}', '{{invoice.amountDue}}', '{{payment_method}}', '{{footer.message}}'
  ];

  const invoicePlaceholders = [
    ...receiptPlaceholders,
    '{{invoice.dueDate}}', '{{customer.email}}', '{{customer.phone}}', '{{customer.address}}',
    '{{item.price}}', '{{item.description}}'
  ];

  const labelPlaceholders = [
    '{{store_name}}', '{{customer.name}}', '{{order.id}}', '{{item.name}}',
    '{{item.price}}', '{{date}}'
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-20">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Settings
        </h1>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
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

          <TabsContent value="templates" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Document Templates</CardTitle>
                <CardDescription>
                  Customize the layout and content of your receipts, invoices, and labels.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="receipt" className="w-full">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="receipt">Receipt (Thermal)</TabsTrigger>
                    <TabsTrigger value="invoice">Invoice (A4)</TabsTrigger>
                    <TabsTrigger value="label">Label</TabsTrigger>
                  </TabsList>

                  <TabsContent value="receipt" className="mt-4">
                    <div className="mb-4 text-sm text-muted-foreground">
                      Edit the template for 80mm thermal receipts.
                    </div>
                    <TemplateEditor
                      value={currentReceiptTemplate}
                      onChange={setCurrentReceiptTemplate}
                      placeholders={receiptPlaceholders}
                    />
                  </TabsContent>

                  <TabsContent value="invoice" className="mt-4">
                    <div className="mb-4 text-sm text-muted-foreground">
                      Edit the template for standard A4 invoices.
                      <strong className="block mt-1">Note: Leave this empty to use the default professional design.</strong>
                    </div>
                    <TemplateEditor
                      value={currentInvoiceTemplate}
                      onChange={setCurrentInvoiceTemplate}
                      placeholders={invoicePlaceholders}
                    />
                  </TabsContent>

                  <TabsContent value="label" className="mt-4">
                    <div className="mb-4 text-sm text-muted-foreground">
                      Edit the template for item/shipping labels.
                    </div>
                    <TemplateEditor
                      value={currentLabelTemplate}
                      onChange={setCurrentLabelTemplate}
                      placeholders={labelPlaceholders}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={handleSaveTemplates}>Save Templates</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
