'use client';
import DashboardLayout from '@/components/dashboard-layout';
import { InventoryList } from '@/components/inventory-list';
import { useApp } from '@/context/app-context';

export default function InventoryPage() {
  const { inventory } = useApp();
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Inventory
        </h1>
        <InventoryList inventory={inventory} />
      </div>
    </DashboardLayout>
  );
}
