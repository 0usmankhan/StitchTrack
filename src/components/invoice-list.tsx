'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  MoreHorizontal,
  ChevronDown,
  Search,
  Calendar as CalendarIcon,
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
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { Invoice, InvoiceStatus } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { InvoiceDetails } from './invoice-details';
import { useApp } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

type InvoiceListProps = {
  invoices: Invoice[];
};

const statusColors: Record<InvoiceStatus, string> = {
  Paid: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  Pending:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  Overdue: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  'Partially Paid':
    'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
};

export function InvoiceList({ invoices: initialInvoices }: InvoiceListProps) {
  const { deleteInvoices } = useApp();
  const { toast } = useToast();
  const [invoices, setInvoices] = React.useState<Invoice[]>(initialInvoices);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [date, setDate] = React.useState<Date | undefined>();
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(
    null
  );
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [statusFilters, setStatusFilters] = React.useState<
    Record<InvoiceStatus, boolean>
  >({
    Paid: true,
    Pending: true,
    Overdue: true,
    'Partially Paid': true,
  });
  const [selectedInvoiceIds, setSelectedInvoiceIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    setInvoices(initialInvoices);
  }, [initialInvoices]);

  const filteredInvoices = React.useMemo(() => {
    return invoices
      .filter((invoice) => {
        // Status filter
        return statusFilters[invoice.status];
      })
      .filter((invoice) => {
        // Date filter
        if (!date) return true;
        try {
          const invoiceDate = parseISO(invoice.date);
          return format(invoiceDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
        } catch (e) {
          return false; // Don't show if date is invalid
        }
      })
      .filter((invoice) => {
        // Search term filter
        if (!searchTerm) return true;
        const lowercasedTerm = searchTerm.toLowerCase();
        return (
          invoice.maskedId.toLowerCase().includes(lowercasedTerm) ||
          invoice.customer.name.toLowerCase().includes(lowercasedTerm)
        );
      });
  }, [invoices, searchTerm, date, statusFilters]);

  React.useEffect(() => {
    // Clear selection when filters change
    setSelectedInvoiceIds([]);
  }, [searchTerm, date, statusFilters]);

  const handleStatusChange = (status: InvoiceStatus, checked: boolean) => {
    setStatusFilters((prev) => ({ ...prev, [status]: checked }));
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsSheetOpen(true);
  };

  const handleBulkDelete = () => {
    deleteInvoices(selectedInvoiceIds);
    toast({
      title: 'Invoices Deleted',
      description: `${selectedInvoiceIds.length} invoices have been deleted.`,
    });
    setSelectedInvoiceIds([]);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoiceIds(filteredInvoices.map((i) => i.id));
    } else {
      setSelectedInvoiceIds([]);
    }
  };

  const handleSelectRow = (checked: boolean, invoiceId: string) => {
    if (checked) {
      setSelectedInvoiceIds((prev) => [...prev, invoiceId]);
    } else {
      setSelectedInvoiceIds((prev) => prev.filter((id) => id !== invoiceId));
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            A list of all invoices from your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Invoice ID or Customer..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              {selectedInvoiceIds.length > 0 && (
                 <Button variant="destructive" onClick={handleBulkDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete ({selectedInvoiceIds.length})
                </Button>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal sm:w-[240px]',
                      !date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    Status <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(Object.keys(statusFilters) as InvoiceStatus[]).map(
                    (status) => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        checked={statusFilters[status]}
                        onCheckedChange={(checked) =>
                          handleStatusChange(status, Boolean(checked))
                        }
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead className="w-10">
                   <Checkbox
                    checked={
                      selectedInvoiceIds.length > 0 &&
                      selectedInvoiceIds.length === filteredInvoices.length
                    }
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Amount Due</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    data-state={selectedInvoiceIds.includes(invoice.id) && 'selected'}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedInvoiceIds.includes(invoice.id)}
                        onCheckedChange={(checked) =>
                          handleSelectRow(Boolean(checked), invoice.id)
                        }
                        aria-label={`Select invoice ${invoice.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium" onClick={() => handleViewDetails(invoice)}>{invoice.maskedId}</TableCell>
                    <TableCell onClick={() => handleViewDetails(invoice)}>
                      <div className="flex items-center gap-3">
                        {invoice.customer.avatar && (
                          <Image
                            src={invoice.customer.avatar}
                            alt={invoice.customer.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                            data-ai-hint={invoice.customer.imageHint}
                          />
                        )}
                        <div className="font-medium">
                          {invoice.customer.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell" onClick={() => handleViewDetails(invoice)}>
                      {format(parseISO(invoice.date), 'PPP')}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell" onClick={() => handleViewDetails(invoice)}>
                      <Badge
                        className={statusColors[invoice.status]}
                        variant="outline"
                      >
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={() => handleViewDetails(invoice)}>
                      {formatCurrency(invoice.total)}
                    </TableCell>
                    <TableCell className="text-right font-medium" onClick={() => handleViewDetails(invoice)}>
                      {formatCurrency(invoice.amountDue ?? 0)}
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
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(invoice)}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                          <DropdownMenuItem>Download PDF</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                                deleteInvoices([invoice.id]);
                                toast({ title: 'Invoice Deleted', description: `Invoice ${invoice.maskedId} has been deleted.` });
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
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No invoices found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-lg w-[90vw] overflow-y-auto">
          {selectedInvoice && <InvoiceDetails invoice={selectedInvoice} />}
        </SheetContent>
      </Sheet>
    </>
  );
}
