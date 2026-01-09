'use client';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { Invoice, InvoiceStatus } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from './ui/button';
import { Printer } from 'lucide-react';
import { PrintableReceipt } from './printable-receipt';


type InvoiceDetailsProps = {
  invoice: Invoice;
};

const statusColors: Record<InvoiceStatus, string> = {
  Paid: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  Pending:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  Overdue: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  'Partially Paid':
    'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
};

export function InvoiceDetails({ invoice }: InvoiceDetailsProps) {
  const componentToPrintRef = useRef(null);

  const handlePrint = useReactToPrint({
    content: () => componentToPrintRef.current,
    pageStyle: `
      @page { 
        size: 80mm auto; 
        margin: 0mm;
      } 
      @media print {
        body { 
          -webkit-print-color-adjust: exact; 
          font-family: "Source Code Pro", monospace;
        }
      }
    `,
  });

  return (
    <>
      <div style={{ display: 'none' }}>
        <PrintableReceipt ref={componentToPrintRef} invoice={invoice} />
      </div>

      <SheetHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <SheetTitle className="text-2xl">
              Invoice {invoice.maskedId}
            </SheetTitle>
            <SheetDescription>
              Details for invoice sent to {invoice.customer.name}.
            </SheetDescription>
          </div>
          <Button variant="outline" size="icon" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            <span className="sr-only">Print Invoice</span>
          </Button>
        </div>
      </SheetHeader>
      <div className="space-y-6">
        <Separator />
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Customer Information</h3>
          <div className="flex items-center gap-4">
            {invoice.customer.avatar && (
              <Image
                src={invoice.customer.avatar}
                alt={invoice.customer.name}
                width={56}
                height={56}
                className="rounded-full"
                data-ai-hint={invoice.customer.imageHint}
              />
            )}
            <div>
              <p className="font-medium text-foreground">
                {invoice.customer.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {invoice.customer.email}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Invoice Details</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <p className="text-muted-foreground">Status</p>
            <div className="text-right font-medium">
              <Badge
                className={statusColors[invoice.status]}
                variant="outline"
              >
                {invoice.status}
              </Badge>
            </div>

            <p className="text-muted-foreground">Invoice Date</p>
            <p className="text-right font-medium">
              {format(parseISO(invoice.date), 'PPP')}
            </p>

            <p className="text-muted-foreground">Due Date</p>
            <p className="text-right font-medium">
              {format(parseISO(invoice.dueDate), 'PPP')}
            </p>

            {invoice.paymentMethod && (
              <>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="text-right font-medium">
                  {invoice.paymentMethod}
                </p>
              </>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-lg mb-2">Items</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Payment Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>{formatCurrency(invoice.tax)}</span>
          </div>
          <div className="flex justify-between font-medium text-base">
            <span className="text-muted-foreground">Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>

          <Separator className="my-2" />

          {invoice.deposit !== undefined && invoice.deposit > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="text-muted-foreground">Amount Paid</span>
              <span>-{formatCurrency(invoice.deposit)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg">
            <span>Amount Due</span>
            <span>{formatCurrency(invoice.amountDue ?? 0)}</span>
          </div>
        </div>
      </div>
    </>
  );
}
