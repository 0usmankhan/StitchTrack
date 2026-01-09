'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, PackageCheck } from 'lucide-react';
import type { InventoryItem } from '@/lib/types';
import { Badge } from './ui/badge';

type LowStockAlertProps = {
    items: InventoryItem[];
};

export function LowStockAlert({ items }: LowStockAlertProps) {
    const hasLowStockItems = items.length > 0;

    return (
        <Card className={hasLowStockItems ? "border-destructive" : "border-green-500"}>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                {hasLowStockItems ? (
                     <AlertTriangle className="w-6 h-6 text-destructive" />
                ) : (
                    <PackageCheck className="w-6 h-6 text-green-500" />
                )}
                <CardTitle className={hasLowStockItems ? "text-destructive" : "text-green-600"}>
                    {hasLowStockItems ? `Low Stock Alert (${items.length})` : "Inventory Status"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {hasLowStockItems ? (
                     <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">The following items are at or below their reorder level.</p>
                        <div className="space-y-3 pt-2 max-h-48 overflow-y-auto">
                            {items.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                    <span className="font-medium">{item.name}</span>
                                    <Badge variant="destructive">
                                        Stock: {item.stock}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground font-medium">All items are well-stocked.</p>
                         <p className="text-sm text-muted-foreground">Great job managing your inventory!</p>
                    </div>
                )}
            </CardContent>
             {hasLowStockItems && (
                <CardFooter>
                    <Button asChild variant="secondary" className="w-full">
                        <Link href="/inventory">Manage Inventory</Link>
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
