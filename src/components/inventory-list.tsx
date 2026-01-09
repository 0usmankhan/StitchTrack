'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  MoreHorizontal,
  PlusCircle,
  ChevronsUpDown,
  Check,
  Search,
  Trash2,
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
  CardFooter,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import type { FirestoreInventoryItem, InventoryItem } from '@/lib/types';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent } from './ui/sheet';
import { InventoryItemDetails } from './inventory-item-details';
import { useSettings } from '@/context/settings-context';

type InventoryListProps = {
  inventory: InventoryItem[];
};

const inventoryImages = PlaceHolderImages.filter((img) =>
  img.id.startsWith('product')
);

const getRandomInventoryImage = () => {
  if (inventoryImages.length === 0) {
    const randomSeed = Math.floor(Math.random() * 1000);
    return {
      imageUrl: `https://picsum.photos/seed/${randomSeed}/400/400`,
      imageHint: 'product image',
    };
  }
  return inventoryImages[Math.floor(Math.random() * inventoryImages.length)];
};

const Combobox = ({
  value,
  onChange,
  options,
  onAdd,
  placeholder,
  searchPlaceholder,
  createPlaceholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  onAdd: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  createPlaceholder: (value: string) => string;
}) => {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
        <div className="absolute top-full z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
            <Command>
            <CommandInput
                placeholder={searchPlaceholder}
                value={inputValue}
                onValueChange={setInputValue}
            />
            <CommandList>
                <CommandEmpty>
                <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                    onAdd(inputValue);
                    onChange(inputValue);
                    setOpen(false);
                    }}
                >
                    {createPlaceholder(inputValue)}
                </Button>
                </CommandEmpty>
                <CommandGroup>
                {options.map((option) => (
                    <CommandItem
                    key={option}
                    value={option}
                    onSelect={(currentValue) => {
                        onChange(currentValue === value ? '' : currentValue);
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
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
            </Command>
        </div>
      )}
    </div>
  );
};

export function InventoryList({
  inventory: initialInventory,
}: InventoryListProps) {
  const { addInventoryItem, updateInventoryItem, deleteInventoryItems } =
    useApp();
  const { toast } = useToast();
  const { productCategories, setProductCategories, suppliers, setSuppliers } = useSettings();
  const [inventory, setInventory] =
    React.useState<InventoryItem[]>(initialInventory);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(
    null
  );
  const [adjustingItem, setAdjustingItem] =
    React.useState<InventoryItem | null>(null);
  const [newStock, setNewStock] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedItemIds, setSelectedItemIds] = React.useState<string[]>([]);

  const [newItem, setNewItem] = React.useState({
    name: '',
    stock: '',
    reorderLevel: '',
    category: '',
    supplier: '',
    retailPrice: '',
    costPrice: '',
    showInPOS: true,
  });

  React.useEffect(() => {
    setInventory(initialInventory);
  }, [initialInventory]);

  React.useEffect(() => {
    if (editingItem) {
      setIsSheetOpen(true);
    } else {
      setIsSheetOpen(false);
    }
  }, [editingItem]);

  React.useEffect(() => {
    if (!isSheetOpen) {
      setEditingItem(null);
    }
  }, [isSheetOpen]);

  React.useEffect(() => {
    if (adjustingItem) {
      setNewStock(String(adjustingItem.stock));
      setIsAdjustDialogOpen(true);
    } else {
      setIsAdjustDialogOpen(false);
    }
  }, [adjustingItem]);

  const filteredInventory = React.useMemo(() => {
    if (!searchTerm) {
      return inventory;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return inventory.filter((item) =>
      item.name.toLowerCase().includes(lowercasedTerm)
    );
  }, [inventory, searchTerm]);

  React.useEffect(() => {
    setSelectedItemIds([]);
  }, [searchTerm]);

  const getStockStatus = (item: InventoryItem) => {
    const stockPercentage = (item.stock / (item.reorderLevel * 2)) * 100;
    if (item.stock <= 0) return 'out';
    if (item.stock <= item.reorderLevel) return 'low';
    if (stockPercentage < 75) return 'medium';
    return 'high';
  };

  const statusInfo: Record<string, { color: string, label?: string, badgeVariant?: "default" | "secondary" | "destructive" | "outline" | null | undefined }> = {
    out: { color: 'bg-red-700', label: 'Out of Stock', badgeVariant: 'destructive' },
    low: { color: 'bg-red-500', label: 'Low', badgeVariant: 'destructive' },
    medium: { color: 'bg-yellow-500' },
    high: { color: 'bg-green-500' },
  };

  const resetNewItemForm = () => {
    setNewItem({
      name: '',
      stock: '',
      reorderLevel: '',
      category: '',
      supplier: '',
      retailPrice: '',
      costPrice: '',
      showInPOS: true,
    });
  };

  const handleAddCategory = (category: string) => {
    if (
      !productCategories.find(
        (c) => c.toLowerCase() === category.toLowerCase()
      )
    ) {
      setProductCategories((prev) => [...prev, category]);
    }
  };

   const handleAddSupplier = (supplier: string) => {
    if (!suppliers.find(s => s.toLowerCase() === supplier.toLowerCase())) {
        setSuppliers(prev => [...prev, supplier]);
    }
  };


  const handleSaveItem = () => {
    if (
      !newItem.name ||
      !newItem.stock ||
      !newItem.reorderLevel ||
      !newItem.category ||
      !newItem.supplier ||
      !newItem.retailPrice ||
      !newItem.costPrice
    ) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill out all fields to add a new item.',
      });
      return;
    }

    const randomImage = getRandomInventoryImage();
    const newInventoryItem: FirestoreInventoryItem = {
      name: newItem.name,
      stock: parseInt(newItem.stock, 10),
      reorderLevel: parseInt(newItem.reorderLevel, 10),
      category: newItem.category,
      supplier: newItem.supplier,
      retailPrice: parseFloat(newItem.retailPrice),
      costPrice: parseFloat(newItem.costPrice),
      imageUrl: randomImage.imageUrl,
      imageHint: randomImage.imageHint,
      showInPOS: newItem.showInPOS,
    };

    addInventoryItem(newInventoryItem);

    toast({
      title: 'Item Added',
      description: `${newItem.name} has been added to your inventory.`,
    });
    resetNewItemForm();
    setIsAddDialogOpen(false);
  };

  const handleAdjustStock = () => {
    if (!adjustingItem || newStock === '') return;
    const stockValue = parseInt(newStock, 10);
    if (isNaN(stockValue)) {
      toast({
        variant: 'destructive',
        title: 'Invalid Stock Value',
        description: 'Please enter a valid number for stock.',
      });
      return;
    }

    updateInventoryItem(adjustingItem.id, { stock: stockValue });

    toast({
      title: 'Stock Adjusted',
      description: `Stock for ${adjustingItem.name} has been set to ${stockValue}.`,
    });

    setAdjustingItem(null);
    setNewStock('');
    setIsAdjustDialogOpen(false);
  };

  const handleBulkDelete = () => {
    deleteInventoryItems(selectedItemIds);
    toast({
      title: 'Items Deleted',
      description: `${selectedItemIds.length} items have been deleted.`,
    });
    setSelectedItemIds([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItemIds(filteredInventory.map((i) => i.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleSelectRow = (checked: boolean, itemId: string) => {
    if (checked) {
      setSelectedItemIds((prev) => [...prev, itemId]);
    } else {
      setSelectedItemIds((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const renderDialogContent = (isEditing: boolean) => (
    <>
      <div className="space-y-2">
        <Label htmlFor="item-name">Item Name</Label>
        <Input
          id="item-name"
          placeholder="e.g., Premium Cotton Thread"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            placeholder="100"
            value={newItem.stock}
            onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reorder-level">Reorder Level</Label>
          <Input
            id="reorder-level"
            type="number"
            placeholder="25"
            value={newItem.reorderLevel}
            onChange={(e) =>
              setNewItem({ ...newItem, reorderLevel: e.target.value })
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cost-price">Cost Price</Label>
          <Input
            id="cost-price"
            type="number"
            placeholder="10.00"
            value={newItem.costPrice}
            onChange={(e) =>
              setNewItem({ ...newItem, costPrice: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="retail-price">Retail Price</Label>
          <Input
            id="retail-price"
            type="number"
            placeholder="25.00"
            value={newItem.retailPrice}
            onChange={(e) =>
              setNewItem({ ...newItem, retailPrice: e.target.value })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Combobox
          value={newItem.category}
          onChange={(value) => setNewItem({ ...newItem, category: value })}
          options={productCategories}
          onAdd={handleAddCategory}
          placeholder="Select or create category..."
          searchPlaceholder="Search or create category..."
          createPlaceholder={(value) => `Create "${value}"`}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="supplier">Supplier</Label>
         <Combobox
          value={newItem.supplier}
          onChange={(value) => setNewItem({ ...newItem, supplier: value })}
          options={suppliers}
          onAdd={handleAddSupplier}
          placeholder="Select or create supplier..."
          searchPlaceholder="Search or create supplier..."
          createPlaceholder={(value) => `Create "${value}"`}
        />
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="show-in-pos">Show in POS</Label>
          <p className="text-xs text-muted-foreground">
            Make this product available for sale in the POS screen.
          </p>
        </div>
        <Switch
          id="show-in-pos"
          checked={newItem.showInPOS}
          onCheckedChange={(checked) =>
            setNewItem({ ...newItem, showInPOS: checked })
          }
        />
      </div>
    </>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                Manage your materials and supplies.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {selectedItemIds.length > 0 && (
                <Button variant="destructive" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedItemIds.length})
                </Button>
              )}
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory..."
                  className="pl-8 w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog
                open={isAddDialogOpen}
                onOpenChange={(isOpen) => {
                  setIsAddDialogOpen(isOpen);
                  if (!isOpen) resetNewItemForm();
                }}
              >
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Inventory Item</DialogTitle>
                    <DialogDescription>
                      Enter the details for the new item. Click save when done.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {renderDialogContent(false)}
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSaveItem}>Save Item</Button>
                  </DialogFooter>
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
                      selectedItemIds.length > 0 &&
                      selectedItemIds.length === filteredInventory.length
                    }
                    onCheckedChange={(checked) =>
                      handleSelectAll(Boolean(checked))
                    }
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>On Order</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => {
                 const status = getStockStatus(item);
                 const statusStyle = statusInfo[status];
                return (
                <TableRow
                  key={item.id}
                  data-state={selectedItemIds.includes(item.id) && 'selected'}
                  className="cursor-pointer"
                  onClick={() => setEditingItem(item)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedItemIds.includes(item.id)}
                      onCheckedChange={(checked) =>
                        handleSelectRow(Boolean(checked), item.id)
                      }
                      aria-label={`Select item ${item.name}`}
                    />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={item.name}
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={item.imageUrl}
                      width="64"
                      data-ai-hint={item.imageHint}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Progress
                        value={(item.stock / (item.reorderLevel * 2)) * 100}
                        className="h-2"
                        indicatorClassName={statusStyle.color}
                      />
                      <div className="text-sm text-muted-foreground">
                        {item.stock} in stock
                        {statusStyle.label && (
                          <Badge variant={statusStyle.badgeVariant} className="ml-2">
                            {statusStyle.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.onOrder || 0}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {item.category}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Create Purchase Order</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setAdjustingItem(item)}
                        >
                          Adjust Stock
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingItem(item)}>
                          Edit Item
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            deleteInventoryItems([item.id]);
                            toast({
                              title: 'Item Deleted',
                              description: `${item.name} has been deleted.`,
                            });
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{filteredInventory.length}</strong> of{' '}
            <strong>{inventory.length}</strong> products
          </div>
        </CardFooter>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg w-[90vw] overflow-y-auto flex flex-col">
          {editingItem && (
            <InventoryItemDetails
              item={editingItem}
              onClose={() => setIsSheetOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={isAdjustDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setAdjustingItem(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adjust Stock for {adjustingItem?.name}</DialogTitle>
            <DialogDescription>
              Update the stock quantity for this item. Current stock is{' '}
              {adjustingItem?.stock}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-stock">New Stock Quantity</Label>
              <Input
                id="new-stock"
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="Enter new quantity"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleAdjustStock}>Save Quantity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
