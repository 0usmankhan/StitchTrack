'use client';

import * as React from 'react';
import Image from 'next/image';
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Customer, FirestoreCustomer } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { CustomerDetails } from './customer-details';


const customerAvatars = PlaceHolderImages.filter((img) =>
  img.id.startsWith('avatar')
);

const getRandomAvatar = () => {
  return customerAvatars[Math.floor(Math.random() * customerAvatars.length)];
};


export function CustomerList() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  
  const [newCustomer, setNewCustomer] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  const { addCustomer, customers, isCustomersLoading } = useApp();
  const { toast } = useToast();

  const filteredCustomers = React.useMemo(() => {
    if (!searchTerm) return customers;
    const lowercasedTerm = searchTerm.toLowerCase();
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(lowercasedTerm) ||
        customer.email.toLowerCase().includes(lowercasedTerm) ||
        (customer.phone && customer.phone.toLowerCase().includes(lowercasedTerm))
    );
  }, [searchTerm, customers]);

  const resetNewCustomerForm = () => {
    setNewCustomer({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    });
  };

  const handleSaveCustomer = () => {
    if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.email) {
       toast({
        variant: 'destructive',
        title: 'Missing Information',
        description:
          'Please enter first name, last name, and email for the customer.',
      });
      return;
    }

    const randomAvatar = getRandomAvatar();
    const newCustomerData: Omit<FirestoreCustomer, 'totalOrders' | 'totalSpent'> = {
      firstName: newCustomer.firstName,
      lastName: newCustomer.lastName,
      email: newCustomer.email,
      phone: newCustomer.phone,
      avatar: randomAvatar.imageUrl,
      imageHint: randomAvatar.imageHint,
    };
    
    addCustomer(newCustomerData);
    
    toast({
      title: 'Customer Added',
      description: `${newCustomer.firstName} ${newCustomer.lastName} has been added.`,
    });

    resetNewCustomerForm();
    setIsAddDialogOpen(false);
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsSheetOpen(true);
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>All Customers</CardTitle>
            <CardDescription>
              A list of all customers in your system.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                className="pl-8 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
             <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => {
                setIsAddDialogOpen(isOpen);
                if (!isOpen) resetNewCustomerForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="shrink-0">
                    <PlusCircle className="mr-2" />
                    Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>
                      Enter the details for the new customer. Click save when you're done.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="first-name" className="text-right">
                        First Name
                      </Label>
                      <Input
                        id="first-name"
                        placeholder="John"
                        className="col-span-3"
                        value={newCustomer.firstName}
                        onChange={e => setNewCustomer({...newCustomer, firstName: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="last-name" className="text-right">
                        Last Name
                      </Label>
                      <Input
                        id="last-name"
                        placeholder="Doe"
                        className="col-span-3"
                        value={newCustomer.lastName}
                        onChange={e => setNewCustomer({...newCustomer, lastName: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        className="col-span-3"
                        value={newCustomer.email}
                        onChange={e => setNewCustomer({...newCustomer, email: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone" className="text-right">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(123) 456-7890"
                        className="col-span-3"
                        value={newCustomer.phone}
                        onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveCustomer}>Save Customer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isCustomersLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="cursor-pointer" onClick={() => handleViewDetails(customer)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src={customer.avatar}
                        alt={customer.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                        data-ai-hint={customer.imageHint}
                      />
                      <div className="font-medium">{customer.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                     {customer.email}
                  </TableCell>
                  <TableCell>{customer.phone || '-'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(customer)}>
                           View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>{isCustomersLoading ? '...' : `1-${filteredCustomers.length}`}</strong> of{' '}
          <strong>{isCustomersLoading ? '...' : customers.length}</strong> customers
        </div>
      </CardFooter>
    </Card>
     <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg w-[90vw] overflow-y-auto">
          {selectedCustomer && <CustomerDetails customer={selectedCustomer} />}
        </SheetContent>
      </Sheet>
    </>
  );
}
