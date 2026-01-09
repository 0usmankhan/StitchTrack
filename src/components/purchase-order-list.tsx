'use client';

import * as React from 'react';
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  Trash2,
  ChevronsUpDown,
  Check,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter as NewPODialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type {
  PurchaseOrder,
  PurchaseOrderStatus,
  PurchaseOrderItem,
  FirestorePurchaseOrder,
  InventoryItem,
} from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, parseISO } from 'date-fns';
import { useApp } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { useSettings } from '@/context/settings-context';
import { MaterialSearch } from './MaterialSearch';
import { Timestamp } from 'firebase/firestore';
import { PurchaseOrderDetails } from './purchase-order-details';

type PurchaseOrderListProps = {
  purchaseOrders: PurchaseOrder[];
};

const statusColors: Record<PurchaseOrderStatus, string> = {
  Draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
  Ordered:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  'Partially Received':
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  Received:
    'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  Cancelled:
    'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
};

const Combobox = ({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) => {
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  return (
    <div className="relative" ref={wrapperRef}>
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={() => setOpen(!open)}
      >
        {value || placeholder}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {open && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {options.map((option) => (
            <Button
              key={option}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  'mr-2 h-4 w-4',
                  value === option ? 'opacity-100' : 'opacity-0'
                )}
              />
              {option}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export function PurchaseOrderList({
  purchaseOrders: initialPurchaseOrders,
}: PurchaseOrderListProps) {
  const { addPurchaseOrder, inventory } = useApp();
  const { suppliers } = useSettings();
  const { toast } = useToast();
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>(
    initialPurchaseOrders
  );
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  const [selectedPOIds, setSelectedPOIds] = React.useState<string[]>([]);
  const [selectedPO, setSelectedPO] = React.useState<PurchaseOrder | null>(
    null
  );

  const [newPO, setNewPO] = React.useState<{
    supplier: string;
    expectedDate: Date | undefined;
    items: (PurchaseOrderItem & { id: string })[];
  }>({
    supplier: '',
    expectedDate: undefined,
    items: [],
  });
  
  const resetNewPOForm = () => {
    setNewPO({ supplier: '', expectedDate: undefined, items: [] });
  };

  React.useEffect(() => {
    setPurchaseOrders(initialPurchaseOrders);
  }, [initialPurchaseOrders]);

  const filteredPOs = React.useMemo(() => {
    if (!searchTerm) return purchaseOrders;
    const lowercasedTerm = searchTerm.toLowerCase();
    return purchaseOrders.filter(
      (po) =>
        po.maskedId.toLowerCase().includes(lowercasedTerm) ||
        po.supplier.toLowerCase().includes(lowercasedTerm)
    );
  }, [purchaseOrders, searchTerm]);

  const handleSelectAll = (checked: boolean) => {
    setSelectedPOIds(checked ? filteredPOs.map((po) => po.id) : []);
  };

  const handleSelectRow = (checked: boolean, poId: string) => {
    setSelectedPOIds((prev) =>
      checked ? [...prev, poId] : prev.filter((id) => id !== poId)
    );
  };

  const handleViewDetails = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setIsSheetOpen(true);
  };

  const handleAddPOItem = (item: InventoryItem) => {
    if (newPO.items.some((i) => i.inventoryItemId === item.id)) {
      toast({
        variant: 'destructive',
        title: 'Item already added',
        description: `${item.name} is already in this purchase order.`,
      });
      return;
    }
    setNewPO((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `temp-${Date.now()}`,
          inventoryItemId: item.id,
          name: item.name,
          quantity: 1,
          cost: item.costPrice || 0,
        },
      ],
    }));
  };

  const handleUpdatePOItem = (
    itemId: string,
    field: 'quantity' | 'cost',
    value: number
  ) => {
    setNewPO((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleRemovePOItem = (itemId: string) => {
    setNewPO((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
    }));
  };
  
  const handleSavePO = (status: 'Draft' | 'Ordered') => {
    if (!newPO.supplier || !newPO.expectedDate || newPO.items.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please select a supplier, expected date, and add at least one item.',
      });
      return;
    }
    
    const totalCost = newPO.items.reduce((sum, item) => sum + item.cost * item.quantity, 0);

    const poData: Omit<FirestorePurchaseOrder, 'id'> = {
      supplier: newPO.supplier,
      orderDate: Timestamp.now(),
      expectedDate: Timestamp.fromDate(newPO.expectedDate),
      status: status,
      totalCost: totalCost,
      items: newPO.items.map(({id, ...rest}) => rest), // remove temp id
    };
    
    addPurchaseOrder(poData);
    
    toast({
      title: 'Purchase Order Created',
      description: `A new PO for ${newPO.supplier} has been created as a ${status}.`,
    });
    
    resetNewPOForm();
    setIsAddDialogOpen(false);
  }

  const newPOTotal = newPO.items.reduce(
    (sum, item) => sum + item.cost * item.quantity,
    0
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>All Purchase Orders</CardTitle>
              <CardDescription>
                A list of all purchase orders to your suppliers.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {selectedPOIds.length > 0 && (
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedPOIds.length})
                </Button>
              )}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search POs..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog
                open={isAddDialogOpen}
                onOpenChange={(isOpen) => {
                  setIsAddDialogOpen(isOpen);
                  if (!isOpen) resetNewPOForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2" />
                    New PO
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Create Purchase Order</DialogTitle>
                    <DialogDescription>
                      Build a new purchase order for a supplier.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Supplier</Label>
                        <Combobox
                          value={newPO.supplier}
                          onChange={(value) =>
                            setNewPO({ ...newPO, supplier: value })
                          }
                          options={suppliers}
                          placeholder="Select a supplier..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Expected Delivery Date</Label>
                         <div className="relative">
                            <Button
                                variant={'outline'}
                                className={cn(
                                'w-full justify-start text-left font-normal',
                                !newPO.expectedDate && 'text-muted-foreground'
                                )}
                                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newPO.expectedDate ? (
                                format(newPO.expectedDate, 'PPP')
                                ) : (
                                <span>Pick a date</span>
                                )}
                            </Button>
                            {isDatePickerOpen && (
                                <div className="absolute z-50 top-full mt-1 bg-background border rounded-md shadow-md">
                                <Calendar
                                    mode="single"
                                    selected={newPO.expectedDate}
                                    onSelect={(date) => {
                                      setNewPO({ ...newPO, expectedDate: date });
                                      setIsDatePickerOpen(false);
                                    }}
                                    initialFocus
                                />
                                </div>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Add Items</Label>
                      <MaterialSearch onSelectMaterial={handleAddPOItem} />
                    </div>

                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="w-24">Quantity</TableHead>
                            <TableHead className="w-32">Cost</TableHead>
                            <TableHead className="w-32 text-right">
                              Total
                            </TableHead>
                            <TableHead className="w-12">
                              <span className="sr-only">Remove</span>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {newPO.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.name}
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleUpdatePOItem(
                                      item.id,
                                      'quantity',
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="h-8"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.cost}
                                  onChange={(e) =>
                                    handleUpdatePOItem(
                                      item.id,
                                      'cost',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="h-8"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(item.cost * item.quantity)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemovePOItem(item.id)}
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell colSpan={3} className="font-bold">
                              Total Cost
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              {formatCurrency(newPOTotal)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </Card>
                  </div>
                  <NewPODialogFooter>
                    <Button variant="outline" onClick={() => handleSavePO('Draft')}>Save as Draft</Button>
                    <Button onClick={() => handleSavePO('Ordered')}>Create PO</Button>
                  </NewPODialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      selectedPOIds.length > 0 &&
                      selectedPOIds.length === filteredPOs.length
                    }
                    onCheckedChange={(checked) =>
                      handleSelectAll(Boolean(checked))
                    }
                  />
                </TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPOs.length > 0 ? (
                filteredPOs.map((po) => (
                  <TableRow
                    key={po.id}
                    data-state={selectedPOIds.includes(po.id) && 'selected'}
                    onClick={() => handleViewDetails(po)}
                    className="cursor-pointer"
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedPOIds.includes(po.id)}
                        onCheckedChange={(checked) =>
                          handleSelectRow(Boolean(checked), po.id)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">{po.maskedId}</TableCell>
                    <TableCell>{po.supplier}</TableCell>
                    <TableCell>
                      {format(parseISO(po.orderDate), 'PPP')}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(po.expectedDate), 'PPP')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={statusColors[po.status]}
                        variant="outline"
                      >
                        {po.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(po.totalCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Receive Items</DropdownMenuItem>
                          <DropdownMenuItem>Mark as Ordered</DropdownMenuItem>
                          <DropdownMenuItem>Cancel PO</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No purchase orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-2xl w-[90vw] overflow-y-auto">
          {selectedPO && <PurchaseOrderDetails purchaseOrder={selectedPO} />}
        </SheetContent>
      </Sheet>
    </>
  );
}
