'use client';
import { useMemo } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { SummaryCards } from '@/components/summary-cards';
import { OrderVolumeChart } from '@/components/order-volume-chart';
import { LowStockAlert } from '@/components/low-stock-alert';
import { useApp } from '@/context/app-context';
import type { KpiData } from '@/lib/types';
import { format, parseISO } from 'date-fns';

export default function Home() {
  const { orders, invoices, inventory } = useApp();

  const dynamicKpiData: KpiData = useMemo(() => {
    const totalRevenue = invoices.reduce(
      (sum, invoice) => sum + invoice.subtotal,
      0
    );

    const totalProfit = orders.reduce((sum, order) => {
      if (order && order.type === 'Repair' && order.materialCost) {
        return sum + (order.amount - order.materialCost);
      }
      return sum;
    }, 0);

    const pendingRepairsCount = orders.filter(
      (order) =>
        order.type === 'Repair' &&
        (order.status === 'Placed' || order.status === 'In Progress')
    ).length;

    const pendingStitchOrdersCount = orders.filter(
      (order) =>
        order.type === 'Order' &&
        (order.status === 'Placed' || order.status === 'In Progress')
    ).length;

    // In a real app, 'change' would be calculated against historical data
    return {
      totalRevenue: {
        value: totalRevenue,
        change: 12.5, // Placeholder change
      },
      totalProfit: {
        value: totalProfit,
        change: 8.0, // Placeholder
      },
      pendingRepairs: {
        value: pendingRepairsCount,
        change: -5.0, // Placeholder change
      },
      stitchingOrders: {
        value: pendingStitchOrdersCount,
        change: 10.0, // Placeholder change
      },
    };
  }, [orders, invoices]);

  const chartData = useMemo(() => {
    const monthlyData: {
      [key: string]: { month: string; orders: number; repairs: number };
    } = {};

    orders.forEach((order) => {
      try {
        const month = format(parseISO(order.deliveryDate), 'MMM');
        if (!monthlyData[month]) {
          monthlyData[month] = { month, orders: 0, repairs: 0 };
        }
        if (order.type === 'Order' || order.type === 'Shipped') {
          monthlyData[month].orders++;
        } else if (order.type === 'Repair') {
          monthlyData[month].repairs++;
        }
      } catch (e) {
        console.warn(
          `Invalid date format for order ${order.id}: ${order.deliveryDate}`
        );
      }
    });

    const monthOrder = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return Object.values(monthlyData).sort(
      (a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
    );
  }, [orders]);

  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => item.stock <= item.reorderLevel);
  }, [inventory]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Dashboard
        </h1>
        <SummaryCards data={dynamicKpiData} />
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <OrderVolumeChart data={chartData} />
          </div>
          <div className="lg:col-span-2">
            <LowStockAlert items={lowStockItems} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
