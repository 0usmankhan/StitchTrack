'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';

type OrderVolumeChartProps = {
  data: { month: string; orders: number; repairs: number }[];
};

const chartConfig = {
  orders: {
    label: 'Orders',
    color: 'hsl(var(--primary))',
  },
  repairs: {
    label: 'Repairs',
    color: 'hsl(var(--accent))',
  },
};

export function OrderVolumeChart({ data }: OrderVolumeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order & Repair Volume</CardTitle>
        <CardDescription>A summary of orders and repairs by month.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="orders"
              fill="var(--color-orders)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="repairs"
              fill="var(--color-repairs)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
