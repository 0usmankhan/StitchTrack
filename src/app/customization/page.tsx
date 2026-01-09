
'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { X, Plus, Sun, Moon, Laptop, Printer, FileText, Tags } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/context/settings-context';
import type { OrderStatus as OrderStatusType } from '@/context/settings-context';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ReceiptTemplateEditor } from '@/components/receipt-template-editor';

const defaultNewColor = '#a1a1aa'; // A neutral gray

export default function CustomizationPage() {
  const { toast } = useToast();
  const {
    orderStatuses,
    setOrderStatuses,
    productCategories,
    setProductCategories,
    suppliers,
    setSuppliers,
    taxRate,
    setTaxRate,
    taxName,
    setTaxName,
    notifications,
    setNotifications,
  } = useSettings();
  const { theme, setTheme } = useTheme();

  const [newStatus, setNewStatus] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSupplier, setNewSupplier] = useState('');
  const [localTaxRate, setLocalTaxRate] = useState((taxRate * 100).toString());
  const [localTaxName, setLocalTaxName] = useState(taxName);
  const [isReceiptSheetOpen, setIsReceiptSheetOpen] = useState(false);
  const [isInvoiceSheetOpen, setIsInvoiceSheetOpen] = useState(false);
  const [isLabelSheetOpen, setIsLabelSheetOpen] = useState(false);


  const handleAddStatus = () => {
    if (!newStatus.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid Status',
        description: 'Status name cannot be empty.',
      });
      return;
    }
    if (
      orderStatuses.find(
        (s) => s.name.toLowerCase() === newStatus.toLowerCase()
      )
    ) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Status',
        description: `The status "${newStatus}" already exists.`,
      });
      return;
    }
    setOrderStatuses((prev) => [
      ...prev,
      { name: newStatus.trim(), color: defaultNewColor },
    ]);
    setNewStatus('');
    toast({
      title: 'Status Added',
      description: `Successfully added "${newStatus.trim()}".`,
    });
  };

  const handleRemoveStatus = (statusToRemove: string) => {
    setOrderStatuses((prev) =>
      prev.filter((status) => status.name !== statusToRemove)
    );
    toast({
      title: 'Status Removed',
      description: `Successfully removed "${statusToRemove}".`,
    });
  };

  const handleColorChange = (statusName: string, newColor: string) => {
    setOrderStatuses((prev) =>
      prev.map((status) =>
        status.name === statusName ? { ...status, color: newColor } : status
      )
    );
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid Category',
        description: 'Category name cannot be empty.',
      });
      return;
    }
    if (
      productCategories.find(
        (c) => c.toLowerCase() === newCategory.toLowerCase()
      )
    ) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Category',
        description: `The category "${newCategory}" already exists.`,
      });
      return;
    }
    setProductCategories((prev) => [...prev, newCategory.trim()]);
    setNewCategory('');
    toast({
      title: 'Category Added',
      description: `Successfully added "${newCategory.trim()}".`,
    });
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setProductCategories((prev) =>
      prev.filter((category) => category !== categoryToRemove)
    );
    toast({
      title: 'Category Removed',
      description: `Successfully removed "${categoryToRemove}".`,
    });
  };

  const handleAddSupplier = () => {
    if (!newSupplier.trim()) {
      toast({
        variant: 'destructive',
        title: 'Invalid Supplier',
        description: 'Supplier name cannot be empty.',
      });
      return;
    }
    if (
      suppliers.find((s) => s.toLowerCase() === newSupplier.toLowerCase())
    ) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Supplier',
        description: `The supplier "${newSupplier}" already exists.`,
      });
      return;
    }
    setSuppliers((prev) => [...prev, newSupplier.trim()]);
    setNewSupplier('');
    toast({
      title: 'Supplier Added',
      description: `Successfully added "${newSupplier.trim()}".`,
    });
  };

  const handleRemoveSupplier = (supplierToRemove: string) => {
    setSuppliers((prev) =>
      prev.filter((supplier) => supplier !== supplierToRemove)
    );
    toast({
      title: 'Supplier Removed',
      description: `Successfully removed "${supplierToRemove}".`,
    });
  };
  
  const handleSaveTaxSettings = () => {
    const rate = parseFloat(localTaxRate);
    if (isNaN(rate) || rate < 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Tax Rate',
        description: 'Please enter a valid, non-negative number for the tax rate.',
      });
      return;
    }
    setTaxRate(rate / 100);
    setTaxName(localTaxName.trim() || 'Tax');
    toast({
      title: 'Tax Settings Saved',
      description: 'Your tax configuration has been updated.',
    });
  };
  
  const handleNotificationChange = (key: keyof typeof notifications, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Customization
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of your application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2 rounded-lg border p-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'ghost'}
                  onClick={() => setTheme('light')}
                  className="flex-1"
                >
                  <Sun className="mr-2 h-4 w-4" /> Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'ghost'}
                  onClick={() => setTheme('dark')}
                  className="flex-1"
                >
                  <Moon className="mr-2 h-4 w-4" /> Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'ghost'}
                  onClick={() => setTheme('system')}
                  className="flex-1"
                >
                  <Laptop className="mr-2 h-4 w-4" /> System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Printable Templates</CardTitle>
            <CardDescription>
              Manage templates for receipts, invoices, and labels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
               <div 
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => setIsReceiptSheetOpen(true)}
               >
                  <div className="flex items-center gap-4">
                     <Printer className="w-5 h-5 text-muted-foreground"/>
                    <div className="space-y-0.5">
                      <span className="font-medium">Thermal Receipt</span>
                      <p className="text-xs text-muted-foreground">
                        Standard template for 80mm thermal printers.
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => setIsInvoiceSheetOpen(true)}
                >
                  <div className="flex items-center gap-4">
                     <FileText className="w-5 h-5 text-muted-foreground"/>
                    <div className="space-y-0.5">
                      <span className="font-medium">Invoice</span>
                      <p className="text-xs text-muted-foreground">
                        Standard 8.5" x 11" invoice template.
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => setIsLabelSheetOpen(true)}
                >
                  <div className="flex items-center gap-4">
                     <Tags className="w-5 h-5 text-muted-foreground"/>
                    <div className="space-y-0.5">
                      <span className="font-medium">Shipping Label</span>
                      <p className="text-xs text-muted-foreground">
                        Standard 4" x 6" shipping label template.
                      </p>
                    </div>
                  </div>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax Configuration</CardTitle>
            <CardDescription>
              Set the tax rate for sales in the POS.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax-rate">Tax Rate (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                placeholder="e.g., 8.25"
                value={localTaxRate}
                onChange={(e) => setLocalTaxRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-name">Tax Name</Label>
              <Input
                id="tax-name"
                placeholder="e.g., Sales Tax, VAT"
                value={localTaxName}
                onChange={(e) => setLocalTaxName(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleSaveTaxSettings}>Save Tax Settings</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Manage how you receive notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="low-stock-alerts">Low Stock Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications for items that are running low.
                </p>
              </div>
              <Switch
                id="low-stock-alerts"
                checked={notifications.lowStock}
                onCheckedChange={(checked) => handleNotificationChange('lowStock', checked)}
              />
            </div>
             <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="new-order-alerts">New Order Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when a new order is placed.
                </p>
              </div>
              <Switch
                id="new-order-alerts"
                checked={notifications.newOrders}
                onCheckedChange={(checked) => handleNotificationChange('newOrders', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Statuses</CardTitle>
            <CardDescription>
              Add, remove, or edit the statuses available for orders in the POS.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Current Statuses</Label>
              <div className="flex flex-wrap gap-3 p-4 border rounded-md min-h-[80px] items-center">
                {orderStatuses.length > 0 ? (
                  orderStatuses.map((status) => (
                    <div
                      key={status.name}
                      className="flex items-center rounded-full border"
                      style={{
                        backgroundColor: `${status.color}20`, // 15% opacity
                        borderColor: status.color,
                      }}
                    >
                      <div className="relative group">
                        <label
                          htmlFor={`color-${status.name}`}
                          className="pl-3 cursor-pointer"
                        >
                          <div
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: status.color }}
                          ></div>
                        </label>
                        <input
                          id={`color-${status.name}`}
                          type="color"
                          value={status.color}
                          onChange={(e) =>
                            handleColorChange(status.name, e.target.value)
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <span
                        className="py-1 px-3 text-sm font-medium"
                        style={{ color: status.color }}
                      >
                        {status.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 mr-1 rounded-full"
                        onClick={() => handleRemoveStatus(status.name)}
                        style={{ color: status.color }}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove {status.name}</span>
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No statuses defined.
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-status">Add New Status</Label>
              <div className="flex gap-2">
                <Input
                  id="new-status"
                  placeholder="e.g., 'Awaiting Pickup'"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddStatus();
                  }}
                />
                <Button onClick={handleAddStatus}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Status
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Note: Changes made here will be reflected across the app.
            </p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>
              Manage the categories for your inventory items.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Current Categories</Label>
              <div className="flex flex-wrap gap-2 p-4 border rounded-md min-h-[80px] items-center">
                {productCategories.length > 0 ? (
                  productCategories.map((category) => (
                    <Badge
                      key={category}
                      variant="secondary"
                      className="text-base font-medium py-1 pl-3 pr-1"
                    >
                      {category}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 rounded-full"
                        onClick={() => handleRemoveCategory(category)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove {category}</span>
                      </Button>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No categories defined.
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-category">Add New Category</Label>
              <div className="flex gap-2">
                <Input
                  id="new-category"
                  placeholder="e.g., 'Zippers', 'Lace'"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCategory();
                  }}
                />
                <Button onClick={handleAddCategory}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Note: Changes made here will be reflected across the app.
            </p>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Suppliers</CardTitle>
            <CardDescription>
              Manage the suppliers for your inventory items.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Current Suppliers</Label>
              <div className="flex flex-wrap gap-2 p-4 border rounded-md min-h-[80px] items-center">
                {suppliers.length > 0 ? (
                  suppliers.map((supplier) => (
                    <Badge
                      key={supplier}
                      variant="secondary"
                      className="text-base font-medium py-1 pl-3 pr-1"
                    >
                      {supplier}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 rounded-full"
                        onClick={() => handleRemoveSupplier(supplier)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove {supplier}</span>
                      </Button>
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No suppliers defined.
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-supplier">Add New Supplier</Label>
              <div className="flex gap-2">
                <Input
                  id="new-supplier"
                  placeholder="e.g., 'Stitch Co.', 'Fabric World'"
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSupplier();
                  }}
                />
                <Button onClick={handleAddSupplier}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supplier
                </Button>
              </div>
            </div>
          </CardContent>
           <CardFooter>
            <p className="text-xs text-muted-foreground">
              Note: Changes made here will be reflected across the app.
            </p>
          </CardFooter>
        </Card>
      </div>
      <Sheet open={isReceiptSheetOpen} onOpenChange={setIsReceiptSheetOpen}>
        <SheetContent className="w-[90vw] max-w-[1200px] sm:w-[80vw] lg:w-[70vw]">
          <ReceiptTemplateEditor onClose={() => setIsReceiptSheetOpen(false)} />
        </SheetContent>
      </Sheet>
      <Sheet open={isInvoiceSheetOpen} onOpenChange={setIsInvoiceSheetOpen}>
        <SheetContent className="w-[90vw] max-w-[1200px] sm:w-[80vw] lg:w-[70vw]">
          {/* Placeholder for Invoice Editor */}
          <div className="p-6">
            <h2 className="text-xl font-bold">Invoice Template Editor</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={isLabelSheetOpen} onOpenChange={setIsLabelSheetOpen}>
        <SheetContent className="w-[90vw] max-w-[1200px] sm:w-[80vw] lg:w-[70vw]">
           {/* Placeholder for Label Editor */}
           <div className="p-6">
            <h2 className="text-xl font-bold">Label Template Editor</h2>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}

    