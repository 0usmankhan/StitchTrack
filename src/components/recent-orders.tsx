'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Circle,
  CircleCheck,
  CircleDot,
  MoreHorizontal,
  Truck,
  ChevronDown,
  Search,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { Order, OrderStatus, Invoice } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { OrderDetails } from './order-details';
import { InvoiceDetails } from './invoice-details';
import { Input } from '@/components/ui/input';
import { useApp } from '@/context/app-context';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/context/settings-context';

type RecentOrdersProps = {
  orders: Order[];
};

const getStatusIcon = (statusName: OrderStatus, color?: string) => {
  const iconProps = {
    className: `w-4 h-4`,
    style: color ? { color } : {},
  };

  switch (statusName) {
    case 'In Progress':
      return <CircleDot {...iconProps} />;
    case 'Completed':
      return <CircleCheck {...iconProps} />;
    case 'Shipped':
      return <Truck {...iconProps} />;
    case 'Placed':
    default:
      return <Circle {...iconProps} />;
  }
};

export function RecentOrders({ orders: initialOrders }: RecentOrdersProps) {
  const { updateOrder, deleteOrders, invoices } = useApp();
  const { orderStatuses } = useSettings();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [sheetHistory, setSheetHistory] = React.useState<('order' | 'invoice')[]>([]);
  
  const currentSheet = sheetHistory[sheetHistory.length - 1];

  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedOrderIds, setSelectedOrderIds] = React.useState<string[]>([]);

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setSheetHistory(['order']);
    setIsSheetOpen(true);
  };
  
  const handleViewInvoiceDetails = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if(invoice) {
        setSelectedInvoice(invoice);
        setSheetHistory(prev => [...prev, 'invoice']);
        setIsSheetOpen(true);
    }
  };

  const handleSheetBack = () => {
    setSheetHistory(prev => prev.slice(0, -1));
  };
  
  const handleSheetOpenChange = (open: boolean) => {
    setIsSheetOpen(open);
    if (!open) {
      setSheetHistory([]);
    }
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrder(orderId, { status: newStatus });
  };

  const handleBulkDelete = () => {
    deleteOrders(selectedOrderIds);
    toast({
        title: "Orders Deleted",
        description: `${selectedOrderIds.length} orders have been deleted.`,
    });
    setSelectedOrderIds([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectRow = (checked: boolean, orderId: string) => {
    if (checked) {
      setSelectedOrderIds((prev) => [...prev, orderId]);
    } else {
      setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
    }
  };
  
  const filteredOrders = React.useMemo(() => {
    if (!searchTerm) {
        return initialOrders;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return initialOrders.filter(order => 
        order.maskedId.toLowerCase().includes(lowercasedTerm) ||
        order.customer.name.toLowerCase().includes(lowercasedTerm) ||
        order.type.toLowerCase().includes(lowercasedTerm)
    );
  }, [initialOrders, searchTerm]);

  React.useEffect(() => {
    setSelectedOrderIds([]);
  }, [searchTerm]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            A list of your most recent orders and repairs.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by Order ID, Customer, or Type..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                 {selectedOrderIds.length > 0 && (
                    <Button variant="destructive" onClick={handleBulkDelete}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete ({selectedOrderIds.length})
                    </Button>
                )}
            </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                   <Checkbox
                        checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                        onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                        aria-label="Select all"
                    />
                </TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} onClick={() => handleViewOrderDetails(order)} className="cursor-pointer" data-state={selectedOrderIds.includes(order.id) && "selected"}>
                     <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                           checked={selectedOrderIds.includes(order.id)}
                           onCheckedChange={(checked) => handleSelectRow(Boolean(checked), order.id)}
                           aria-label={`Select order ${order.maskedId}`}
                        />
                     </TableCell>
                    <TableCell className="font-medium">{order.maskedId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={order.customer.avatar}
                          alt={order.customer.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                          data-ai-hint={order.customer.imageHint}
                        />
                        <div className="font-medium">{order.customer.name}</div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {order.type}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            {getStatusIcon(order.status, orderStatuses.find(s => s.name === order.status)?.color)}
                            {order.status}
                             <ChevronDown className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                           <DropdownMenuRadioGroup value={order.status} onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}>
                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {orderStatuses.map(status => (
                                     <DropdownMenuRadioItem key={status.name} value={status.name} className="flex items-center gap-2">
                                        {getStatusIcon(status.name as OrderStatus, status.color)}
                                        {status.name}
                                    </DropdownMenuRadioItem>
                                ))}
                           </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewOrderDetails(order)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>View Customer</DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem
                            className="text-destructive"
                             onClick={() => {
                                deleteOrders([order.id]);
                                toast({ title: "Order Deleted", description: `Order ${order.maskedId} has been deleted.` });
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent 
          className="sm:max-w-2xl w-[90vw] overflow-y-auto"
          onBack={sheetHistory.length > 1 ? handleSheetBack : undefined}
        >
          {currentSheet === 'order' && selectedOrder && (
            <OrderDetails
              order={selectedOrder}
              onViewInvoice={handleViewInvoiceDetails}
            />
          )}
          {currentSheet === 'invoice' && selectedInvoice && (
            <InvoiceDetails
              invoice={selectedInvoice}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
