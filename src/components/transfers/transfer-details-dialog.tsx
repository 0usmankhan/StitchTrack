import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { TransferOrder } from '@/lib/types';
import { CheckCircle2, XCircle, ArrowRight, Loader2, Calendar } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { useState } from 'react';
import { format } from 'date-fns';

interface TransferDetailsDialogProps {
    transfer: TransferOrder | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TransferDetailsDialog({
    transfer,
    open,
    onOpenChange,
}: TransferDetailsDialogProps) {
    const { activeStore, completeTransferOrder, cancelTransferOrder } = useApp();
    const [processing, setProcessing] = useState(false);

    if (!transfer) return null;

    const isIncoming = activeStore?.id === transfer.toStoreId;
    const isOutgoing = activeStore?.id === transfer.fromStoreId;

    // Logic: 
    // Incoming can Receive.
    // Outgoing can Cancel (if still pending).

    const canReceive = isIncoming && transfer.status === 'PENDING';
    const canCancel = isOutgoing && transfer.status === 'PENDING';

    const handleReceive = async () => {
        setProcessing(true);
        try {
            await completeTransferOrder(transfer.id);
            onOpenChange(false);
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Are you sure? This will return items to inventory.")) return;
        setProcessing(true);
        try {
            await cancelTransferOrder(transfer.id);
            onOpenChange(false);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <div className="flex items-center justify-between mr-8">
                        <DialogTitle className="text-xl">Transfer {transfer.maskedId}</DialogTitle>
                        <Badge variant={
                            transfer.status === 'COMPLETED' ? 'secondary' : // 'success' isn't standard in shadcn default, use secondary or custom class
                                transfer.status === 'CANCELLED' ? 'destructive' : 'outline'
                        } className={
                            transfer.status === 'COMPLETED' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''
                        }>
                            {transfer.status}
                        </Badge>
                    </div>
                    <DialogDescription className="flex items-center gap-2 mt-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(transfer.createdAt), 'PP p')}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-8 my-4 p-4 bg-muted/20 rounded-lg">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">From</p>
                        <p className="text-base font-semibold">{transfer.fromStoreName}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">To</p>
                        <p className="text-base font-semibold">{transfer.toStoreName}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="font-medium text-sm">Items</h4>
                    <div className="border rounded-md max-h-[300px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead className="text-right">Quantity</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transfer.items.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter className="sm:justify-between items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                        {transfer.completedAt && `Received on ${format(new Date(transfer.completedAt), 'PP')}`}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>

                        {canCancel && (
                            <Button variant="destructive" onClick={handleCancel} disabled={processing}>
                                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Cancel Transfer
                            </Button>
                        )}

                        {canReceive && (
                            <Button onClick={handleReceive} disabled={processing} className="bg-green-600 hover:bg-green-700">
                                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Receive Inventory
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
