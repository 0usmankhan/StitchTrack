
'use client';
import { forwardRef } from 'react';
import type { Invoice } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface PrintableReceiptProps {
  invoice: Invoice;
}

export const PrintableReceipt = forwardRef<HTMLDivElement, PrintableReceiptProps>(({ invoice }, ref) => {
  const { storeDetails } = useSettings();

  const formatDate = (date: any) => {
    try {
      if (!date) return 'N/A';
      if (typeof date === 'string') return format(parseISO(date), 'MM/dd/yyyy h:mm a');
      if (date.toDate) return format(date.toDate(), 'MM/dd/yyyy h:mm a');
      if (date instanceof Date) return format(date, 'MM/dd/yyyy h:mm a');
      if (date.seconds) return format(new Date(date.seconds * 1000), 'MM/dd/yyyy h:mm a');
      return format(new Date(date), 'MM/dd/yyyy h:mm a');
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <div ref={ref} className="bg-white text-black text-xs font-mono w-[80mm] p-2">
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold">{storeDetails.name}</h1>
        <p>{storeDetails.address}</p>
        <p>{storeDetails.phone}</p>
        <p>{storeDetails.website}</p>
      </div>

      <div className="mb-4 border-b border-black pb-2">
        <p>Receipt #: {invoice.maskedId}</p>
        <p>Date: {formatDate(invoice.date)}</p>
        <p>Customer: {invoice.customer.name}</p>
      </div>

      <div className="mb-4">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-black">
              <th className="pb-1">Item</th>
              <th className="pb-1 text-right">Qty</th>
              <th className="pb-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index}>
                <td className="py-1">{item.name}</td>
                <td className="py-1 text-right">{item.quantity}</td>
                <td className="py-1 text-right">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-black pt-2 mb-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(invoice.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>{formatCurrency(invoice.tax)}</span>
        </div>
        <div className="flex justify-between font-bold text-sm mt-1">
          <span>Total:</span>
          <span>{formatCurrency(invoice.total)}</span>
        </div>
        {invoice.deposit && invoice.deposit > 0 && (
          <div className="flex justify-between mt-1">
            <span>Paid:</span>
            <span>{formatCurrency(invoice.deposit)}</span>
          </div>
        )}
        <div className="flex justify-between mt-1">
          <span>Due:</span>
          <span>{formatCurrency(invoice.amountDue || 0)}</span>
        </div>
      </div>

      <div className="text-center text-[10px] mt-4">
        <p>Payment: {invoice.paymentMethod || 'N/A'}</p>
        <p className="mt-2">Thank you for your business!</p>
      </div>
    </div>
  )
});
PrintableReceipt.displayName = "PrintableReceipt";
