'use client';

import * as React from 'react';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/context/app-context';
import type { FirestoreInventoryItem, InventoryItem } from '@/lib/types';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Separator } from './ui/separator';
import { useSettings } from '@/context/settings-context';

type InventoryItemDetailsProps = {
  item: InventoryItem;
  onClose: () => void;
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

export function InventoryItemDetails({
  item,
  onClose,
}: InventoryItemDetailsProps) {
  const { updateInventoryItem } = useApp();
  const { productCategories, setProductCategories, suppliers, setSuppliers } =
    useSettings();
  const { toast } = useToast();
  const [editingItem, setEditingItem] =
    React.useState<Partial<InventoryItem>>(item);

  React.useEffect(() => {
    setEditingItem(item);
  }, [item]);

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
    if (!suppliers.find((s) => s.toLowerCase() === supplier.toLowerCase())) {
      setSuppliers((prev) => [...prev, supplier]);
    }
  };

  const handleUpdateItem = () => {
    if (
      !editingItem.name ||
      editingItem.stock === undefined ||
      editingItem.reorderLevel === undefined ||
      !editingItem.category ||
      !editingItem.supplier ||
      editingItem.retailPrice === undefined ||
      editingItem.costPrice === undefined
    ) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill out all fields to update the item.',
      });
      return;
    }

    const updatedInventoryItem: Partial<FirestoreInventoryItem> = {
      name: editingItem.name,
      stock: Number(editingItem.stock),
      reorderLevel: Number(editingItem.reorderLevel),
      category: editingItem.category,
      supplier: editingItem.supplier,
      retailPrice: Number(editingItem.retailPrice),
      costPrice: Number(editingItem.costPrice),
      showInPOS: editingItem.showInPOS ?? true,
    };

    updateInventoryItem(item.id, updatedInventoryItem);

    toast({
      title: 'Item Updated',
      description: `${editingItem.name} has been updated.`,
    });

    onClose();
  };

  const handleInputChange = (
    field: keyof InventoryItem,
    value: string | number | boolean
  ) => {
    setEditingItem((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <SheetHeader>
        <div className="flex items-center gap-4">
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={64}
            height={64}
            className="rounded-lg object-cover"
            data-ai-hint={item.imageHint}
          />
          <div>
            <SheetTitle className="text-2xl">{item.name}</SheetTitle>
            <SheetDescription>
              Edit details for this inventory item.
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>
      <Separator className="my-4" />
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="item-name">Item Name</Label>
          <Input
            id="item-name"
            placeholder="e.g., Premium Cotton Thread"
            value={editingItem.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              type="number"
              placeholder="100"
              value={editingItem.stock ?? ''}
              onChange={(e) => handleInputChange('stock', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reorder-level">Reorder Level</Label>
            <Input
              id="reorder-level"
              type="number"
              placeholder="25"
              value={editingItem.reorderLevel ?? ''}
              onChange={(e) =>
                handleInputChange('reorderLevel', e.target.value)
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
              value={editingItem.costPrice ?? ''}
              onChange={(e) => handleInputChange('costPrice', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retail-price">Retail Price</Label>
            <Input
              id="retail-price"
              type="number"
              placeholder="25.00"
              value={editingItem.retailPrice ?? ''}
              onChange={(e) =>
                handleInputChange('retailPrice', e.target.value)
              }
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Combobox
            value={editingItem.category || ''}
            onChange={(value) => handleInputChange('category', value)}
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
            value={editingItem.supplier || ''}
            onChange={(value) => handleInputChange('supplier', value)}
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
            checked={editingItem.showInPOS}
            onCheckedChange={(checked) =>
              handleInputChange('showInPOS', checked)
            }
          />
        </div>
      </div>
      <div className="mt-auto flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleUpdateItem}>Save Changes</Button>
      </div>
    </>
  );
}
