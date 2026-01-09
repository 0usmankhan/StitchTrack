'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Wrench, DollarSign, Shirt, ChevronsRight } from 'lucide-react';
import type { KpiData } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

type SummaryCardsProps = {
  data: KpiData;
};

const kpiConfig = [
  {
    title: 'Total Revenue',
    key: 'totalRevenue',
    icon: DollarSign,
    format: (value: number) => formatCurrency(value),
  },
  {
    title: 'Total Profit',
    key: 'totalProfit',
    icon: ChevronsRight,
    format: (value: number) => formatCurrency(value),
  },
  {
    title: 'Pending Repairs',
    key: 'pendingRepairs',
    icon: Wrench,
    format: (value: number) => value.toString(),
  },
  {
    title: 'Pending Stitching Orders',
    key: 'stitchingOrders',
    icon: Shirt,
    format: (value: number) => value.toString(),
  },
];

export function SummaryCards({ data }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpiConfig.map((item) => {
        const kpiItem = data[item.key as keyof KpiData];
        if (!kpiItem) return null;
        return (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                {item.title}
              </CardTitle>
              <item.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {item.format(kpiItem.value)}
              </div>
              <p
                className={`text-xs text-muted-foreground ${
                  kpiItem.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {kpiItem.change >= 0 ? '+' : ''}
                {kpiItem.change}% from last month
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
