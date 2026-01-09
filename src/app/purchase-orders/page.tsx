'use client';
import DashboardLayout from '@/components/dashboard-layout';
import { PurchaseOrderList } from '@/components/purchase-order-list';
import { useApp } from '@/context/app-context';

export default function PurchaseOrdersPage() {
  const { purchaseOrders } = useApp();
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Purchase Orders
        </h1>
        <PurchaseOrderList purchaseOrders={purchaseOrders} />
      </div>
    </DashboardLayout>
  );
}
