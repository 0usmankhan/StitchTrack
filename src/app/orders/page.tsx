'use client';
import DashboardLayout from '@/components/dashboard-layout';
import { RecentOrders } from '@/components/recent-orders';
import { useApp } from '@/context/app-context';
import type { Order } from '@/lib/types';

export default function OrdersPage() {
  const { orders } = useApp();
  // Correctly include all non-repair order types
  const stitchOrders = orders.filter(
    (order): order is Order => order.type === 'Order'
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Stitching Orders
        </h1>
        <RecentOrders orders={stitchOrders} />
      </div>
    </DashboardLayout>
  );
}
