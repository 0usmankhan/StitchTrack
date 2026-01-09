'use client';
import { useMemo, useState, useEffect } from 'react';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { RecentOrders } from '@/components/recent-orders';
import { useApp } from '@/context/app-context';
import type { Customer, FirestoreCustomer } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, DollarSign, Edit, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';

type CustomerDetailsProps = {
  customer: Customer;
};

function CustomerKpiCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function CustomerDetails({ customer }: CustomerDetailsProps) {
  const { orders, invoices, updateCustomer } = useApp();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editableCustomer, setEditableCustomer] = useState({
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone || '',
  });

  useEffect(() => {
    setEditableCustomer({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone || '',
    });
    setIsEditing(false);
  }, [customer]);


  const { customerOrders, customerKpiData } = useMemo(() => {
    if (!customer) {
      return { customerOrders: [], customerKpiData: null };
    }

    const custOrders = orders.filter(
      (order) => order.customer.id === customer.id
    );
    const custInvoices = invoices.filter(
      (invoice) => invoice.customerId === customer.id
    );

    const totalSpent = custInvoices.reduce((sum, inv) => sum + inv.total, 0);

    const kpiData = {
      totalSpent: {
        value: totalSpent,
        icon: DollarSign,
        format: (val: number) => formatCurrency(val),
      },
      totalOrders: {
        value: custOrders.length,
        icon: ShoppingCart,
        format: (val: number) => val.toString(),
      },
    };

    return {
      customerOrders: custOrders,
      customerKpiData: kpiData,
    };
  }, [customer, orders, invoices]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setEditableCustomer(prev => ({...prev, [id]: value}));
  };

  const handleSaveChanges = () => {
    if (!editableCustomer.firstName || !editableCustomer.lastName || !editableCustomer.email) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'First name, last name, and email are required.',
      });
      return;
    }

    const updatedData: Partial<FirestoreCustomer> = {
      firstName: editableCustomer.firstName,
      lastName: editableCustomer.lastName,
      email: editableCustomer.email,
      phone: editableCustomer.phone,
    };

    updateCustomer(customer.id, updatedData);

    toast({
      title: 'Customer Updated',
      description: `${editableCustomer.firstName} ${editableCustomer.lastName}'s information has been updated.`,
    });
    setIsEditing(false);
  };

  if (!customer) {
    return null;
  }

  return (
    <>
      <SheetHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Image
              src={customer.avatar}
              alt={customer.name}
              width={64}
              height={64}
              className="rounded-full"
            />
            <div>
              <SheetTitle className="text-2xl">{customer.name}</SheetTitle>
              <SheetDescription>{customer.email}</SheetDescription>
            </div>
          </div>
          {!isEditing && (
             <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="hover:bg-transparent text-foreground/70 hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 focus:ring-offset-0 active:bg-transparent">
                <Edit className="w-5 h-5" />
                <span className="sr-only">Edit Customer</span>
             </Button>
          )}
        </div>
      </SheetHeader>
      <div className="space-y-6">
        <Separator />
        
        {isEditing ? (
             <div className="space-y-4">
                <h3 className="font-semibold text-lg">Edit Information</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" value={editableCustomer.firstName} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" value={editableCustomer.lastName} onChange={handleInputChange} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={editableCustomer.email} onChange={handleInputChange} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" value={editableCustomer.phone} onChange={handleInputChange} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="destructive" onClick={() => setIsEditing(false)} className="bg-red-600 hover:bg-red-700 text-white">Cancel</Button>
                    <Button onClick={handleSaveChanges}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            </div>
        ) : (
             <div className="space-y-4">
                <h3 className="font-semibold text-lg">Customer Snapshot</h3>
                <div className="grid gap-4 md:grid-cols-2">
                    {customerKpiData && (
                        <>
                            <CustomerKpiCard title="Total Spent" value={customerKpiData.totalSpent.format(customerKpiData.totalSpent.value)} icon={customerKpiData.totalSpent.icon}/>
                            <CustomerKpiCard title="Total Orders" value={customerKpiData.totalOrders.format(customerKpiData.totalOrders.value)} icon={customerKpiData.totalOrders.icon}/>
                        </>
                    )}
                </div>
            </div>
        )}

        <Separator />

        <div className='space-y-4'>
             <h3 className="font-semibold text-lg">Order History</h3>
            <RecentOrders orders={customerOrders} />
        </div>
      </div>
    </>
  );
}
