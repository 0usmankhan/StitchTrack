'use client';
import DashboardLayout from '@/components/dashboard-layout';
import { CustomerList } from '@/components/customer-list';

export default function CustomersPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Customers
        </h1>
        <CustomerList />
      </div>
    </DashboardLayout>
  );
}
