'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, Search, Plus, Filter, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { CreateTransferDialog } from '@/components/transfers/create-transfer-dialog';
import { TransferDetailsDialog } from '@/components/transfers/transfer-details-dialog';
import { TransferOrder } from '@/lib/types';
import { format } from 'date-fns';

export default function TransfersPage() {
    const { transferOrders, activeStore, stores } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [createOpen, setCreateOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState<TransferOrder | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    // Filter transfers
    const filteredTransfers = transferOrders.filter((transfer) => {
        const matchesSearch =
            transfer.maskedId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transfer.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;

        // Context filter is already handled in AppContext, but we can verify
        // If we are in "All Locations" (which is activeStore=null), we see all.
        // If activeStore is set, AppContext should have filtered it, but checking here feels safe.

        return matchesSearch && matchesStatus;
    });

    const handleOpenDetails = (transfer: TransferOrder) => {
        setSelectedTransfer(transfer);
        setDetailsOpen(true);
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-20">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-headline text-foreground flex items-center gap-2">
                            <ArrowLeftRight className="h-8 w-8" />
                            Stock Transfers
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Manage inventory movement between your locations.
                        </p>
                    </div>
                    {activeStore && (
                        <Button onClick={() => setCreateOpen(true)} className="w-full md:w-auto">
                            <Plus className="mr-2 h-4 w-4" /> New Transfer
                        </Button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search transfers by ID or item..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[180px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Transfers List */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transfer ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Route</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransfers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                            No transfers found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransfers.map((transfer) => {
                                        const isIncoming = activeStore?.id === transfer.toStoreId;
                                        const isOutgoing = activeStore?.id === transfer.fromStoreId;

                                        return (
                                            <TableRow key={transfer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleOpenDetails(transfer)}>
                                                <TableCell className="font-medium">{transfer.maskedId}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {format(new Date(transfer.createdAt), 'MMM d, yyyy')}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm">
                                                        {isIncoming && <span className="flex items-center text-green-600 gap-1"><ArrowDownLeft className="h-3 w-3" /> From {transfer.fromStoreName}</span>}
                                                        {isOutgoing && <span className="flex items-center text-blue-600 gap-1"><ArrowUpRight className="h-3 w-3" /> To {transfer.toStoreName}</span>}
                                                        {!isIncoming && !isOutgoing && (
                                                            <span className="text-muted-foreground">{transfer.fromStoreName} ?? {transfer.toStoreName}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-foreground">
                                                        {transfer.items.length} item{transfer.items.length !== 1 && 's'}
                                                        <span className="text-muted-foreground ml-1">
                                                            ({transfer.items.reduce((acc, i) => acc + i.quantity, 0)} qty)
                                                        </span>
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={
                                                        transfer.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            transfer.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                'bg-gray-100 text-gray-700'
                                                    }>
                                                        {transfer.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>

            <CreateTransferDialog open={createOpen} onOpenChange={setCreateOpen} />
            <TransferDetailsDialog
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                transfer={selectedTransfer}
            />
        </DashboardLayout>
    );
}
