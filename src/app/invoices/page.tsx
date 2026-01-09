'use client';
import DashboardLayout from '@/components/dashboard-layout';
import { InvoiceList } from '@/components/invoice-list';
import { useApp } from '@/context/app-context';

export default function InvoicesPage() {
  const { invoices } = useApp();
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Invoices
        </h1>
        <InvoiceList invoices={invoices} />
      </div>
    </DashboardLayout>
  );
}
