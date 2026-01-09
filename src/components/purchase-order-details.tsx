'use client';

import * as React from 'react';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem, Reception } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app-context';
import { Textarea } from './ui/textarea';

type PurchaseOrderDetailsProps = {
  purchaseOrder: PurchaseOrder;
};

const statusColors: Record<PurchaseOrderStatus, string> = {
  Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
  Ordered:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  'Partially Received':
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  Received:
    'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

type ReceivedItemsState = {
  [inventoryItemId: string]: {
    quantity: number | string;
    name: string;
  };
};

export function PurchaseOrderDetails({
  purchaseOrder,
}: PurchaseOrderDetailsProps) {
  const { receivePurchaseOrderItems } = useApp();
  const { toast } = useToast();
  const [isReceiveDialogOpen, setIsReceiveDialogOpen] = React.useState(false);
  const [receivedItems, setReceivedItems] = React.useState<ReceivedItemsState>({});
  const [receptionNotes, setReceptionNotes] = React.useState('');


  React.useEffect(() => {
    if (purchaseOrder) {
      const initialQuantities = purchaseOrder.items.reduce((acc, item) => {
        const remaining = item.quantity - (item.receivedQuantity || 0);
        acc[item.inventoryItemId] = { 
          quantity: remaining > 0 ? remaining : 0,
          name: item.name
        };
        return acc;
      }, {} as ReceivedItemsState);
      setReceivedItems(initialQuantities);
      setReceptionNotes('');
    }
  }, [purchaseOrder, isReceiveDialogOpen]);


  const handleQuantityChange = (inventoryItemId: string, value: string) => {
    setReceivedItems(prev => ({
      ...prev,
      [inventoryItemId]: {
        ...prev[inventoryItemId],
        quantity: value,
      },
    }));
  };

  const handleConfirmReception = () => {
    const receptionData = Object.entries(receivedItems)
      .map(([inventoryItemId, {quantity, name}]) => ({
        inventoryItemId,
        name,
        quantityReceived: Number(quantity) || 0,
      }))
      .filter(item => item.quantityReceived > 0);

    if (receptionData.length === 0) {
      toast({
        variant: "destructive",
        title: 'No Items to Receive',
        description: 'Please enter a quantity for at least one item.',
      });
      return;
    }

    receivePurchaseOrderItems(purchaseOrder.id, receptionData, receptionNotes);

    toast({
        title: 'Items Received',
        description: 'Inventory has been updated with the received items.'
    });

    setIsReceiveDialogOpen(false);
  };

  const parseReceptionDate = (date: any) => {
    if (date.seconds) { // It's a Firestore Timestamp-like object
      return new Date(date.seconds * 1000);
    }
    return parseISO(date);
  };

  return (
    <>
      <SheetHeader className="pb-4">
        <div className='flex justify-between items-center'>
            <div>
              <SheetTitle className="text-2xl">
                Purchase Order {purchaseOrder.maskedId}
              </SheetTitle>
              <SheetDescription>
                Details for purchase order to {purchaseOrder.supplier}.
              </SheetDescription>
            </div>
             {purchaseOrder.status === 'Ordered' || purchaseOrder.status === 'Partially Received' ? (
              <Dialog open={isReceiveDialogOpen} onOpenChange={setIsReceiveDialogOpen}>
                <DialogTrigger asChild>
                    <Button>Receive Items</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Receive Items for PO {purchaseOrder.maskedId}</DialogTitle>
                        <DialogDescription>
                            Confirm the quantity of items received from the supplier.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        {purchaseOrder.items.map(item => {
                            const remaining = item.quantity - (item.receivedQuantity || 0);
                            if (remaining <= 0) return null;
                            
                            return (
                                <div key={item.inventoryItemId} className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor={`received-${item.inventoryItemId}`} className="col-span-2">
                                        {item.name}
                                        <span className="text-xs text-muted-foreground ml-2">(Ordered: {item.quantity}, Remaining: {remaining})</span>
                                    </Label>
                                    <Input
                                        id={`received-${item.inventoryItemId}`}
                                        type="number"
                                        value={receivedItems[item.inventoryItemId]?.quantity || ''}
                                        onChange={(e) => handleQuantityChange(item.inventoryItemId, e.target.value)}
                                        placeholder="Quantity"
                                        className="col-span-1"
                                        max={remaining}
                                    />
                                </div>
                            )
                        })}
                         <div className="space-y-2">
                            <Label htmlFor="reception-notes">Notes (Optional)</Label>
                            <Textarea
                                id="reception-notes"
                                placeholder="e.g., One box was damaged..."
                                value={receptionNotes}
                                onChange={(e) => setReceptionNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsReceiveDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleConfirmReception}>Confirm Reception</Button>
                    </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : null}
        </div>
      </SheetHeader>
      <div className="space-y-6">
        <Separator />
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">PO Details</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <p className="text-muted-foreground">Supplier</p>
            <p className="text-right font-medium">{purchaseOrder.supplier}</p>

            <p className="text-muted-foreground">Status</p>
            <div className="text-right font-medium">
              <Badge
                className={statusColors[purchaseOrder.status]}
                variant="outline"
              >
                {purchaseOrder.status}
              </Badge>
            </div>

            <p className="text-muted-foreground">Order Date</p>
            <p className="text-right font-medium">
              {format(parseISO(purchaseOrder.orderDate), 'PPP')}
            </p>

            <p className="text-muted-foreground">Expected Date</p>
            <p className="text-right font-medium">
              {format(parseISO(purchaseOrder.expectedDate), 'PPP')}
            </p>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-lg mb-2">Items Ordered</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Ordered</TableHead>
                <TableHead className="text-center">Received</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrder.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-center">{item.receivedQuantity || 0}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.cost)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.cost * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-bold">
                  Total Cost
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(purchaseOrder.totalCost)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {purchaseOrder.receptions && purchaseOrder.receptions.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold text-lg mb-2">Reception History (GRNs)</h3>
               <div className="space-y-4">
                {purchaseOrder.receptions.map((reception: Reception) => (
                  <Card key={reception.id}>
                    <CardHeader className='pb-2'>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          Reception: {format(parseReceptionDate(reception.date), 'PPP p')}
                        </CardTitle>
                      </div>
                       {reception.notes && <p className="text-sm text-muted-foreground pt-1">Notes: {reception.notes}</p>}
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Quantity Received</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reception.items.map(item => (
                            <TableRow key={item.inventoryItemId}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell className="text-right">{item.quantityReceived}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
