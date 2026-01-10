import { useState, useEffect } from 'react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InventoryItem, Store } from '@/lib/types';

interface CreateTransferDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateTransferDialog({
    open,
    onOpenChange,
}: CreateTransferDialogProps) {
    const { activeStore, stores, inventory, addTransferOrder } = useApp();
    const { toast } = useToast();

    const [toStoreId, setToStoreId] = useState<string>('');
    const [items, setItems] = useState<
        { inventoryItemId: string; name: string; quantity: number }[]
    >([]);
    const [loading, setLoading] = useState(false);

    // Filter inventory for current store
    const currentStoreInventory = inventory.filter(
        (i) => i.storeId === activeStore?.id
    );

    // Available stores (exclude current)
    const availableStores = stores.filter((s) => s.id !== activeStore?.id);

    const handleAddItem = () => {
        setItems([...items, { inventoryItemId: '', name: '', quantity: 1 }]);
    };

    const handleRemoveItem = (index: number) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleItemChange = (
        index: number,
        field: 'inventoryItemId' | 'quantity',
        value: any
    ) => {
        const newItems = [...items];
        if (field === 'inventoryItemId') {
            const selectedItem = currentStoreInventory.find((i) => i.id === value);
            newItems[index] = {
                ...newItems[index],
                inventoryItemId: value,
                name: selectedItem?.name || '',
            };
        } else {
            newItems[index] = { ...newItems[index], quantity: Number(value) };
        }
        setItems(newItems);
    };

    const handleSubmit = async () => {
        if (!activeStore) return;
        if (!toStoreId) {
            toast({
                variant: 'destructive',
                title: 'Missing Details',
                description: 'Please select a destination store.',
            });
            return;
        }
        if (items.length === 0 || items.some((i) => !i.inventoryItemId || i.quantity <= 0)) {
            toast({
                variant: 'destructive',
                title: 'Invalid Items',
                description: 'Please add items with valid quantities.',
            });
            return;
        }

        setLoading(true);
        try {
            const toStore = stores.find(s => s.id === toStoreId);

            await addTransferOrder({
                fromStoreId: activeStore.id,
                toStoreId: toStoreId,
                fromStoreName: activeStore.name,
                toStoreName: toStore?.name || 'Unknown',
                items: items.map(i => ({
                    inventoryItemId: i.inventoryItemId,
                    name: i.name,
                    quantity: i.quantity
                })),
            });
            onOpenChange(false);
            setItems([]);
            setToStoreId('');
        } catch (error) {
            // Error handled in context
        } finally {
            setLoading(false);
        }
    };

    if (!activeStore) return null; // Should not happen given layout logic

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create Stock Transfer</DialogTitle>
                    <DialogDescription>
                        Move inventory from <strong>{activeStore.name}</strong> to another location.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Destination Store</Label>
                        <Select value={toStoreId} onValueChange={setToStoreId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select destination..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableStores.map((store) => (
                                    <SelectItem key={store.id} value={store.id}>
                                        {store.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Items to Transfer</Label>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                                <Plus className="mr-2 h-3 w-3" /> Add Item
                            </Button>
                        </div>

                        {items.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                                No items added. Click "Add Item" to start.
                            </div>
                        )}

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {items.map((item, index) => {
                                const selectedInventoryItem = currentStoreInventory.find(i => i.id === item.inventoryItemId);
                                const maxStock = selectedInventoryItem?.quantity || 0;
                                const isOverStock = item.quantity > maxStock;

                                return (
                                    <div key={index} className="flex gap-3 items-start">
                                        <div className="flex-1 space-y-1">
                                            <Select
                                                value={item.inventoryItemId}
                                                onValueChange={(val) =>
                                                    handleItemChange(index, 'inventoryItemId', val)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select product..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {currentStoreInventory.map((inv) => (
                                                        <SelectItem key={inv.id} value={inv.id} disabled={inv.quantity <= 0}>
                                                            {inv.name} (Qty: {inv.quantity})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {isOverStock && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Exceeds available stock ({maxStock})</p>}
                                        </div>
                                        <div className="w-24">
                                            <Input
                                                type="number"
                                                min="1"
                                                max={maxStock}
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    handleItemChange(index, 'quantity', e.target.value)
                                                }
                                                placeholder="Qty"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemoveItem(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || items.length === 0 || !toStoreId}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Transfer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
