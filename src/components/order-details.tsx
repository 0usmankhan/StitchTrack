'use client';
import { useState, useEffect } from 'react';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X, PlusCircle, Trash2, Circle, CircleDot, CircleCheck, Truck, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';
import type { Order, OrderItem, InventoryItem as InventoryItemType, Customer, OrderStatus as OrderStatusString } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import Image from 'next/image';
import { useApp } from '@/context/app-context';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { MaterialSearch } from './MaterialSearch';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './ui/table';
import { CustomerSearch } from './CustomerSearch';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format, parseISO } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useSettings } from '@/context/settings-context';


type OrderDetailsProps = {
  order: Order;
  onViewInvoice: (invoiceId: string) => void;
};

const getStatusIcon = (statusName: OrderStatusString, color?: string) => {
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


export function OrderDetails({ order, onViewInvoice }: OrderDetailsProps) {
  const { toast } = useToast();
  const { updateOrder, inventory } = useApp();
  const { orderStatuses } = useSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [editableOrder, setEditableOrder] = useState(order);
  
  const [tempCustomer, setTempCustomer] = useState<Omit<Customer, 'totalOrders' | 'totalSpent'> | null>(order.customer);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [isNewLineItemDialogOpen, setIsNewLineItemDialogOpen] = useState(false);
  const [newRepairItem, setNewRepairItem] = useState({
    name: '',
    details: '',
    price: '',
  });

  const [activeMaterialSearch, setActiveMaterialSearch] = useState<string | null>(null);


  useEffect(() => {
    setEditableOrder(order);
    setTempCustomer(order.customer);
    setIsEditing(false);
    setIsNewLineItemDialogOpen(false);
    setNewRepairItem({ name: '', details: '', price: '' });
  }, [order]);

  const handleSaveChanges = () => {
    if (!editableOrder) return;
    
    // Recalculate total amount from items if it's a consolidated repair
    const finalAmount = (editableOrder.items && editableOrder.items.length > 0)
        ? editableOrder.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
        : editableOrder.amount;

    const finalOrderData: Partial<Order> = {
      damageDescription: editableOrder.damageDescription,
      repairInstructions: editableOrder.repairInstructions,
      materials: editableOrder.materials,
      materialIds: editableOrder.materialIds,
      materialCost: editableOrder.materialCost,
      items: editableOrder.items,
      amount: finalAmount,
      status: editableOrder.status,
      deliveryDate: editableOrder.deliveryDate,
    };
    
    if (tempCustomer) {
        finalOrderData.customerId = tempCustomer.id;
    } else {
        finalOrderData.customerId = 'walk-in';
    }

    updateOrder(editableOrder.id, finalOrderData);

    toast({
      title: 'Order Updated',
      description: `Order ${editableOrder.maskedId} has been successfully updated.`,
    });
    setIsEditing(false);
  };

  const handleInputChange = (
    field: keyof Order,
    value: string | number | undefined | string[] | OrderStatusString
  ) => {
    setEditableOrder((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleLineItemChange = (itemId: string, field: keyof OrderItem, value: string | number) => {
     setEditableOrder(prev => {
      if (!prev || !prev.items) return prev;
      const newItems = prev.items.map(item => {
        if (item.id === itemId) {
          return { ...item, [field]: value };
        }
        return item;
      });
      return { ...prev, items: newItems };
    });
  }
  
  const handleSelectCustomer = (customer: Omit<Customer, 'totalOrders' | 'totalSpent'>) => {
    setTempCustomer(customer);
  };
  
  const handleRemoveCustomer = () => {
    setTempCustomer(null);
  }

  const handleMaterialAddToLineItem = (lineItemId: string, material: InventoryItemType) => {
    setEditableOrder(prev => {
      if (!prev || !prev.items) return prev;

      const newItems = prev.items.map(item => {
        if (item.id === lineItemId) {
          // Avoid adding duplicate materials
          if (item.materials.some(m => m.id === material.id)) {
            return item;
          }
          const updatedMaterials = [...item.materials, { id: material.id, name: material.name }];
          return { ...item, materials: updatedMaterials };
        }
        return item;
      });

      // Also update top-level material info for consistency
      const allMaterialIds = newItems.flatMap(item => item.materials.map(m => m.id));
      const uniqueMaterialIds = [...new Set(allMaterialIds)];
      const newOverallMaterials = inventory.filter(i => uniqueMaterialIds.includes(i.id)).map(i => i.name).join(', ');
      const newOverallCost = uniqueMaterialIds.reduce((sum, id) => {
          const invItem = inventory.find(i => i.id === id);
          return sum + (invItem?.costPrice || 0);
      }, 0);

      return {
        ...prev,
        items: newItems,
        materialIds: uniqueMaterialIds,
        materials: newOverallMaterials,
        materialCost: newOverallCost,
      };
    });
    setActiveMaterialSearch(null);
  };

  const handleRemoveMaterial = (materialId: string, lineItemId?: string) => {
    const materialItem = inventory.find(item => item.id === materialId);
    if (!materialItem) return;

    setEditableOrder(prev => {
        if (!prev) return prev;

        let newItems = prev.items ? [...prev.items] : undefined;
        if (lineItemId && newItems) {
            const itemIndex = newItems.findIndex(item => item.id === lineItemId);
            if (itemIndex > -1) {
                const updatedItem = { ...newItems[itemIndex] };
                updatedItem.materials = updatedItem.materials.filter(m => m.id !== materialId);
                newItems[itemIndex] = updatedItem;
            }
        }
        
        const allMaterialIdsInItems = newItems?.flatMap(item => item.materials.map(m => m.id)) || [];
        const uniqueMaterialIds = [...new Set(allMaterialIdsInItems)];
        const newMaterials = inventory.filter(item => uniqueMaterialIds.includes(item.id)).map(item => item.name).join(', ');
        const newMaterialCost = uniqueMaterialIds.reduce((sum, id) => {
            const invItem = inventory.find(i => i.id === id);
            return sum + (invItem?.costPrice || 0);
        }, 0);

        return {
            ...prev,
            materialIds: uniqueMaterialIds,
            materials: newMaterials,
            materialCost: newMaterialCost,
            items: newItems,
        };
    });
  };
  
  const handleRemoveLineItem = (itemId: string) => {
    setEditableOrder(prev => {
      if (!prev || !prev.items) return prev;
      const newItems = prev.items.filter(item => item.id !== itemId);
      
      const allMaterialIds = newItems.flatMap(item => item.materials.map(m => m.id));
      const uniqueMaterialIds = [...new Set(allMaterialIds)];
      const newOverallMaterials = inventory.filter(i => uniqueMaterialIds.includes(i.id)).map(i => i.name).join(', ');
      const newOverallCost = uniqueMaterialIds.reduce((sum, id) => {
          const invItem = inventory.find(i => i.id === id);
          return sum + (invItem?.costPrice || 0);
      }, 0);

      return {
          ...prev,
          items: newItems,
          materialIds: uniqueMaterialIds,
          materials: newOverallMaterials,
          materialCost: newOverallCost,
      };
    });
    setItemToDelete(null);
  }

  const handleAddNewLineItem = () => {
    if (!newRepairItem.name || !newRepairItem.price) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please provide a name and price for the new line item."
        });
        return;
    }
    const newItem: OrderItem = {
        id: `repair-${Date.now()}`,
        name: `Repair: ${newRepairItem.name}`,
        details: newRepairItem.details,
        price: parseFloat(newRepairItem.price),
        materials: [],
        quantity: 1,
    };
    
    setEditableOrder(prev => {
        if (!prev) return prev;
        const newItems = prev.items ? [...prev.items, newItem] : [newItem];
        return {
            ...prev,
            items: newItems,
        };
    });

    setNewRepairItem({ name: '', details: '', price: '' });
    setIsNewLineItemDialogOpen(false);
  };


  const profit = order.type === 'Repair' && order.materialCost ? order.amount - order.materialCost : null;
  const isConsolidatedRepair = order.type === 'Repair';

  const calculateItemCost = (item: OrderItem) => {
    return item.materials.reduce((totalCost, material) => {
      const inventoryItem = inventory.find(inv => inv.id === material.id);
      return totalCost + (inventoryItem?.costPrice || 0);
    }, 0);
  };

  const customerForDisplay = tempCustomer || { 
      id: 'walk-in', 
      name: 'Walk-in Customer', 
      email: '',
      avatar: 'https://picsum.photos/seed/avatarfallback/40/40',
      imageHint: 'person portrait',
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      handleInputChange('deliveryDate', format(date, 'yyyy-MM-dd'));
    }
  };

  return (
    <>
      <SheetHeader className="pb-4">
        <div className="flex justify-between items-center">
          <SheetTitle className="text-2xl">Order {order.maskedId}</SheetTitle>
           {order.invoiceId && order.invoiceMaskedId && (
              <p 
                className="text-lg font-medium text-primary hover:underline cursor-pointer"
                onClick={() => onViewInvoice(order.invoiceId!)}
              >
                {order.invoiceMaskedId}
              </p>
            )}
        </div>
        <SheetDescription>
          View and manage the details for this order.
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-6">
        <Separator />

         <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Customer Information</h3>
            {!isEditing ? (
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="hover:bg-transparent text-foreground/70 hover:text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0 active:bg-transparent">
                <Edit className="w-5 h-5" />
                <span className="sr-only">Edit Order</span>
             </Button>
            ) : null}
          </div>

          {isEditing ? (
            tempCustomer && tempCustomer.id !== 'walk-in' ? (
                <div className="flex items-center gap-4 p-2 rounded-md border w-fit">
                    <Avatar>
                      <AvatarImage src={customerForDisplay.avatar} alt={customerForDisplay.name} />
                      <AvatarFallback>
                        {customerForDisplay.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="font-medium">
                      <p>{customerForDisplay.name}</p>
                      <p className="text-sm text-muted-foreground">{customerForDisplay.email}</p>
                    </div>
                     <Button variant="ghost" size="icon" onClick={handleRemoveCustomer} className="ml-auto">
                        <X className="w-4 h-4" />
                     </Button>
                  </div>
            ) : (
                <div className="w-64">
                    <CustomerSearch onSelectCustomer={handleSelectCustomer}/>
                </div>
            )
          ) : (
             <div className="flex items-center gap-4">
              {order.customer.avatar && (
                <Image
                  src={order.customer.avatar}
                  alt={order.customer.name}
                  width={56}
                  height={56}
                  className="rounded-full"
                  data-ai-hint={order.customer.imageHint}
                />
              )}
              <div>
                <p className="font-medium text-foreground">
                  {order.customer.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.customer.email}
                </p>
              </div>
            </div>
          )}
        </div>


        <Separator />
        
        {isConsolidatedRepair && (isEditing || (editableOrder.items && editableOrder.items.length > 0)) && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Repair Items</h3>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Materials</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        {isEditing && <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {(editableOrder.items && editableOrder.items.length > 0) ? (
                      editableOrder.items.map((item, index) => {
                          const itemCost = calculateItemCost(item);
                          return (
                              <TableRow key={item.id}>
                                  <TableCell className="font-medium align-top">
                                    {isEditing ? (
                                        <div className="flex flex-col gap-2">
                                            <Input 
                                                value={item.name.replace('Repair: ', '')} 
                                                onChange={(e) => handleLineItemChange(item.id, 'name', `Repair: ${e.target.value}`)}
                                                placeholder="Item Name"
                                                className="h-8"
                                            />
                                            <Textarea 
                                                value={item.details || ''} 
                                                onChange={(e) => handleLineItemChange(item.id, 'details', e.target.value)}
                                                placeholder="Repair details..."
                                                className="text-xs"
                                                rows={2}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                        {item.name.replace('Repair: ', '')}
                                        {item.details && <p className="text-xs text-muted-foreground">{item.details}</p>}
                                        </>
                                    )}
                                  </TableCell>
                                  <TableCell className="align-top text-sm">
                                      {isEditing ? (
                                        <div className="flex flex-col gap-1 w-48">
                                          <div className="flex flex-wrap items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveMaterialSearch(activeMaterialSearch === item.id ? null : item.id)}>
                                                <PlusCircle className="w-4 h-4"/>
                                                <span className="sr-only">Add Material</span>
                                            </Button>
                                            {item.materials.map(m => (
                                                <Badge key={m.id} variant="secondary" className="pl-2 pr-1 py-0.5 text-xs">
                                                {m.name}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-4 w-4 ml-1"
                                                    onClick={() => handleRemoveMaterial(m.id, item.id)}
                                                >
                                                    <X className="h-2.5 w-2.5"/>
                                                </Button>
                                                </Badge>
                                            ))}
                                          </div>
                                          {activeMaterialSearch === item.id && (
                                            <div className="mt-1">
                                                <MaterialSearch
                                                    onSelectMaterial={(material) => handleMaterialAddToLineItem(item.id, material)}
                                                />
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        item.materials.map(m => m.name).join(', ')
                                      )}
                                  </TableCell>
                                  <TableCell className="text-right align-top text-sm">{formatCurrency(itemCost)}</TableCell>
                                  <TableCell className="text-right align-top font-semibold">
                                    {isEditing ? (
                                      <Input 
                                        type="number"
                                        value={item.price}
                                        onChange={(e) => handleLineItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                                        className="h-8 w-24 text-right"
                                      />
                                    ) : (
                                      formatCurrency(item.price)
                                    )}
                                  </TableCell>
                                  {isEditing && (
                                    <TableCell className="text-right align-top">
                                      <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8" onClick={(e) => { e.stopPropagation(); setItemToDelete(item.id); }}>
                                                <Trash2 className="w-4 h-4" />
                                                <span className="sr-only">Delete Item</span>
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                This will permanently remove the line item "{item.name.replace('Repair: ', '')}" from the order. This action cannot be undone.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={() => handleRemoveLineItem(item.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                  )}
                              </TableRow>
                          )
                      })
                    ) : (
                      isEditing && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                            No line items. Add one below.
                          </TableCell>
                        </TableRow>
                      )
                    )}
                </TableBody>
                {isEditing && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center p-2">
                        <Dialog open={isNewLineItemDialogOpen} onOpenChange={setIsNewLineItemDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                variant="outline"
                                size="sm"
                                >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Line Item
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Add New Line Item</DialogTitle>
                                    <DialogDescription>
                                        Fill in the details for the new repair item.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-item-name">Item Name</Label>
                                        <Input
                                            id="new-item-name"
                                            placeholder="e.g., 'Jeans Hemming'"
                                            value={newRepairItem.name}
                                            onChange={(e) => setNewRepairItem({ ...newRepairItem, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-item-details">Details (Optional)</Label>
                                        <Textarea
                                            id="new-item-details"
                                            placeholder="Describe the repair..."
                                            value={newRepairItem.details}
                                            onChange={(e) => setNewRepairItem({ ...newRepairItem, details: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-item-price">Price</Label>
                                        <Input
                                            id="new-item-price"
                                            type="number"
                                            placeholder="0.00"
                                            value={newRepairItem.price}
                                            onChange={(e) => setNewRepairItem({ ...newRepairItem, price: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="ghost" onClick={() => setIsNewLineItemDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleAddNewLineItem}>Add Item</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
            <Separator />
          </div>
        )}

        {order.type === 'Repair' && !isConsolidatedRepair && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Damage & Instructions</h3>
            <div className="space-y-2">
              <Label htmlFor="damage-description">Damage Description</Label>
              {isEditing ? (
                <Textarea
                  id="damage-description"
                  value={editableOrder.damageDescription || ''}
                  onChange={(e) =>
                    handleInputChange('damageDescription', e.target.value)
                  }
                  className="text-sm"
                />
              ) : (
                <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md min-h-[60px]">
                  {order.damageDescription || 'No description provided.'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="repair-instructions">
                Repair Instructions
              </Label>
              {isEditing ? (
                <Textarea
                  id="repair-instructions"
                  value={editableOrder.repairInstructions || ''}
                  onChange={(e) =>
                    handleInputChange('repairInstructions', e.target.value)
                  }
                  className="text-sm"
                />
              ) : (
                <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md min-h-[60px]">
                  {order.repairInstructions || 'No instructions provided.'}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Order Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <p className="text-muted-foreground">Task Type</p>
            <p className="text-right font-medium">{order.type}</p>

            <p className="text-muted-foreground">Status</p>
             <div className="flex justify-end">
              {isEditing ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2 -mr-2 h-7">
                        {getStatusIcon(editableOrder.status, orderStatuses.find(s => s.name === editableOrder.status)?.color)}
                        {editableOrder.status}
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuRadioGroup value={editableOrder.status} onValueChange={(value) => handleInputChange('status', value as OrderStatusString)}>
                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {orderStatuses.map(status => (
                          <DropdownMenuRadioItem key={status.name} value={status.name} className="flex items-center gap-2">
                            {getStatusIcon(status.name as OrderStatusString, status.color)}
                            {status.name}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2 justify-end">
                  {getStatusIcon(order.status, orderStatuses.find(s => s.name === order.status)?.color)}
                  <p className="font-medium">{order.status}</p>
                </div>
              )}
            </div>

            <p className="text-muted-foreground">Delivery Date</p>
            <div className="flex justify-end">
              {isEditing ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'ghost'}
                        className={cn(
                          'w-auto justify-start text-left font-normal -mr-2 h-7',
                          !editableOrder.deliveryDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editableOrder.deliveryDate ? format(parseISO(editableOrder.deliveryDate), 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={editableOrder.deliveryDate ? parseISO(editableOrder.deliveryDate) : undefined}
                        onSelect={handleDateSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
              ) : (
                <p className="font-medium">{order.deliveryDate}</p>
              )}
            </div>

            <p className="text-muted-foreground">Total Repair Charges</p>
            <p className="text-right font-medium">
              {formatCurrency(isConsolidatedRepair ? (editableOrder.items || []).reduce((sum, item) => sum + Number(item.price), 0) : editableOrder.amount)}
            </p>


             {profit !== null && (
                 <>
                    <p className="text-muted-foreground">Total Material Cost</p>
                    <p className="text-right font-medium text-red-600">
                        -{formatCurrency(editableOrder.materialCost || 0)}
                    </p>
                    <p className="text-muted-foreground font-semibold">Profit</p>
                    <p className="text-right font-bold text-green-600">
                        {formatCurrency((isConsolidatedRepair ? (editableOrder.items || []).reduce((sum, item) => sum + Number(item.price), 0) : editableOrder.amount) - (editableOrder.materialCost || 0))}
                    </p>
                 </>
            )}
          </div>
        </div>
         {isEditing && (
            <div className="flex justify-end gap-2 pt-4">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
                </Button>
                <Button onClick={handleSaveChanges}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
                </Button>
            </div>
        )}
      </div>
    </>
  );
}
