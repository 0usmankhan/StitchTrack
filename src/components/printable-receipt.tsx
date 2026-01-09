
'use client';
import { forwardRef } from 'react';
import type { Invoice } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface PrintableReceiptProps {
  invoice: Invoice;
  customTemplate?: string;
}

export const PrintableReceipt = forwardRef<HTMLDivElement, PrintableReceiptProps>(({ invoice, customTemplate }, ref) => {
  const { receiptTemplate: savedTemplate } = useSettings();
  const templateToUse = customTemplate ?? savedTemplate;

  function renderTemplate(templateStr: string, invoiceData: Invoice) {
    let output = templateStr;
    
    // Simple replacements
    output = output.replace(/\{\{store_name\}\}/g, "StitchTrack POS");
    output = output.replace(/\{\{store_address\}\}/g, "123 Main Street, Anytown, USA");
    output = output.replace(/\{\{store_phone\}\}/g, "555-123-4567");
    output = output.replace(/\{\{store_website\}\}/g, "www.stitchtrack.com");
    output = output.replace(/\{\{invoice.id\}\}/g, invoiceData.maskedId);
    
    try {
      output = output.replace(/\{\{invoice.date\}\}/g, format(parseISO(invoiceData.date), 'MM/dd/yyyy h:mm a'));
    } catch(e) {
      output = output.replace(/\{\{invoice.date\}\}/g, new Date(invoiceData.date).toLocaleString());
    }

    output = output.replace(/\{\{customer.name\}\}/g, invoiceData.customer.name);
    output = output.replace(/\{\{invoice.subtotal\}\}/g, formatCurrency(invoiceData.subtotal));
    output = output.replace(/\{\{invoice.tax\}\}/g, formatCurrency(invoiceData.tax));
    output = output.replace(/\{\{invoice.total\}\}/g, formatCurrency(invoiceData.total));
    output = output.replace(/\{\{invoice.amountDue\}\}/g, formatCurrency(invoiceData.amountDue ?? 0));
    output = output.replace(/\{\{payment_method\}\}/g, invoiceData.paymentMethod || 'N/A');
    output = output.replace(/\{\{ticket_no\}\}/g, invoiceData.items?.[0]?.orderId?.substring(0, 8) || 'N/A');
    output = output.replace(/\{\{footer.message\}\}/g, "Thank you for your business!");
  
    const ifPaidRegex = /\{\{#if invoice.paid\}\}([\s\S]*?)\{\{\/if\}\}/g;
    if (invoiceData.deposit && invoiceData.deposit > 0) {
      output = output.replace(ifPaidRegex, (match, content) => content);
      output = output.replace(/\{\{invoice.paid\}\}/g, formatCurrency(invoiceData.deposit));
    } else {
      output = output.replace(ifPaidRegex, '');
    }
  
    const itemsRegex = /\{\{#each items\}\}([\s\S]*?)\{\{\/each\}\}/g;
    const itemMatch = itemsRegex.exec(output);
    if (itemMatch) {
        const itemTemplate = itemMatch[1];
        const itemsHtml = invoiceData.items.map((item: any) => {
            let name = item.name.padEnd(12);
            let qty = item.quantity.toString().padEnd(16);
            return itemTemplate
                .replace(/\{\{this.name\}\}/g, name)
                .replace(/\{\{this.quantity\}\}/g, qty)
                .replace(/\{\{this.total\}\}/g, formatCurrency(item.total));
        }).join('\n');
        output = output.replace(itemsRegex, itemsHtml);
    }
  
    return output;
  }

  const renderedContent = renderTemplate(templateToUse, invoice);

  return (
    <div ref={ref} className="bg-white text-black text-xs font-code w-full max-w-[302px] mx-auto p-2">
      <pre className="whitespace-pre-wrap font-code">{renderedContent}</pre>
    </div>
  )
});
PrintableReceipt.displayName = "PrintableReceipt";
