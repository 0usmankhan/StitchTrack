'use client';
import DashboardLayout from '@/components/dashboard-layout';
import { RecentOrders } from '@/components/recent-orders';
import { useApp } from '@/context/app-context';

export default function RepairsPage() {
  const { orders } = useApp();
  const repairOrders = orders.filter((order) => order.type === 'Repair');

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Repair Orders
        </h1>
        <RecentOrders orders={repairOrders} />
      </div>
    </DashboardLayout>
  );
}
