import React, { forwardRef } from 'react';
import { Invoice } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';
import { useSettings } from '@/context/settings-context';

interface StandardInvoiceProps {
    invoice: Invoice;
}

export const StandardInvoice = forwardRef<HTMLDivElement, StandardInvoiceProps>(({ invoice }, ref) => {
    const { storeDetails, invoiceTemplate } = useSettings();

    const formatDate = (date: any) => {
        try {
            if (!date) return 'N/A';
            if (typeof date === 'string') return format(parseISO(date), 'PPP');
            if (date.toDate) return format(date.toDate(), 'PPP'); // Handle Firebase Timestamp
            if (date instanceof Date) return format(date, 'PPP');
            // If it's a seconds/nanoseconds object that didn't get turned into a Timestamp prototype
            if (date.seconds) return format(new Date(date.seconds * 1000), 'PPP');

            return format(new Date(date), 'PPP');
        } catch (e) {
            return 'Invalid Date';
        }
    };

    if (invoiceTemplate) {
        let output = invoiceTemplate;
        // Basic Intepolation
        output = output.replace(/\{\{store_name\}\}/g, storeDetails.name);
        output = output.replace(/\{\{store_address\}\}/g, storeDetails.address);
        output = output.replace(/\{\{store_phone\}\}/g, storeDetails.phone);
        output = output.replace(/\{\{store_website\}\}/g, storeDetails.website);

        output = output.replace(/\{\{invoice.id\}\}/g, invoice.maskedId);
        output = output.replace(/\{\{invoice.date\}\}/g, formatDate(invoice.date));
        output = output.replace(/\{\{invoice.dueDate\}\}/g, formatDate(invoice.dueDate));
        output = output.replace(/\{\{customer.name\}\}/g, invoice.customer.name);
        output = output.replace(/\{\{customer.email\}\}/g, invoice.customer.email || '');
        output = output.replace(/\{\{customer.phone\}\}/g, invoice.customer.phone || '');
        output = output.replace(/\{\{customer.address\}\}/g, invoice.customer.address || ''); // Added address

        output = output.replace(/\{\{invoice.subtotal\}\}/g, formatCurrency(invoice.subtotal));
        output = output.replace(/\{\{invoice.tax\}\}/g, formatCurrency(invoice.tax));
        output = output.replace(/\{\{invoice.total\}\}/g, formatCurrency(invoice.total));
        output = output.replace(/\{\{invoice.amountDue\}\}/g, formatCurrency(invoice.amountDue ?? 0));
        output = output.replace(/\{\{invoice.paid\}\}/g, formatCurrency(invoice.deposit || 0));

        // Items Loop
        const itemsRegex = /\{\{#each items\}\}([\s\S]*?)\{\{\/each\}\}/g;
        const itemMatch = itemsRegex.exec(output);
        if (itemMatch) {
            const itemTemplate = itemMatch[1];
            const itemsHtml = invoice.items.map((item) => {
                return itemTemplate
                    .replace(/\{\{this.name\}\}/g, item.name)
                    .replace(/\{\{this.quantity\}\}/g, item.quantity.toString())
                    .replace(/\{\{this.price\}\}/g, formatCurrency(item.price)) // Added price
                    .replace(/\{\{this.total\}\}/g, formatCurrency(item.total));
            }).join('');
            output = output.replace(itemsRegex, itemsHtml);
        }

        // Remove loop tags if they still exist (case where no items loop was found irrelevant if we matched above, but good for cleanup)
        // Actually the replacement above consumes the tags. 

        return (
            <div ref={ref} className="bg-white text-black p-8 font-sans max-w-[210mm] mx-auto min-h-[297mm] relative invoice-template-container">
                <div dangerouslySetInnerHTML={{ __html: output }} />
                <style jsx global>{`
                    .invoice-template-container img { max-width: 100%; }
                    @media print {
                        .invoice-template-container { 
                            -webkit-print-color-adjust: exact; 
                        }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div ref={ref} className="bg-white text-black p-8 font-sans max-w-[210mm] mx-auto min-h-[297mm] relative">
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold text-primary mb-2">{storeDetails.name}</h1>
                    <p className="text-sm text-gray-600">{storeDetails.address}</p>
                    <p className="text-sm text-gray-600">Phone: {storeDetails.phone}</p>
                    <p className="text-sm text-gray-600">Email: {storeDetails.email}</p>
                    <p className="text-sm text-gray-600">{storeDetails.website}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-light text-gray-400 mb-4">INVOICE</h2>
                    <p className="text-sm text-gray-600 font-bold">Invoice #: {invoice.maskedId}</p>
                    <p className="text-sm text-gray-600">Date: {formatDate(invoice.date)}</p>
                    <p className="text-sm text-gray-600">Due Date: {formatDate(invoice.dueDate)}</p>
                    <div className={`mt-2 inline-block px-3 py-1 rounded text-sm font-bold border ${invoice.status === 'Paid' ? 'border-green-600 text-green-700 bg-green-50' :
                        invoice.status === 'Overdue' ? 'border-red-600 text-red-700 bg-red-50' :
                            'border-yellow-600 text-yellow-700 bg-yellow-50'
                        }`}>
                        {invoice.status.toUpperCase()}
                    </div>
                </div>
            </div>

            {/* Bill To */}
            <div className="mb-12">
                <h3 className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-2">Bill To</h3>
                <p className="font-bold text-lg">{invoice.customer.name}</p>
                {invoice.customer.phone && <p className="text-sm text-gray-600">{invoice.customer.phone}</p>}
                {invoice.customer.email && <p className="text-sm text-gray-600">{invoice.customer.email}</p>}
            </div>

            {/* Items Table */}
            <table className="w-full mb-8 border-collapse">
                <thead>
                    <tr className="border-b-2 border-gray-800">
                        <th className="text-left py-2 font-bold text-sm uppercase">Item Description</th>
                        <th className="text-center py-2 font-bold text-sm uppercase w-24">Qty</th>
                        <th className="text-right py-2 font-bold text-sm uppercase w-32">Price</th>
                        <th className="text-right py-2 font-bold text-sm uppercase w-32">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                            <td className="py-3 text-sm">
                                <p className="font-bold">{item.name}</p>
                            </td>
                            <td className="py-3 text-center text-sm">{item.quantity}</td>
                            <td className="py-3 text-right text-sm">{formatCurrency(item.price)}</td>
                            <td className="py-3 text-right text-sm font-bold">{formatCurrency(item.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-1/2">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-bold text-gray-600">Subtotal</span>
                        <span className="text-sm font-bold">{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-bold text-gray-600">Tax</span>
                        <span className="text-sm font-bold">{formatCurrency(invoice.tax)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b-2 border-gray-800">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-lg font-bold">{formatCurrency(invoice.total)}</span>
                    </div>
                    {invoice.deposit !== undefined && invoice.deposit > 0 && (
                        <div className="flex justify-between py-2 border-b border-gray-100 text-green-700">
                            <span className="text-sm font-bold">Amount Paid</span>
                            <span className="text-sm font-bold">({formatCurrency(invoice.deposit)})</span>
                        </div>
                    )}
                    <div className="flex justify-between py-2">
                        <span className="text-lg font-bold">Amount Due</span>
                        <span className="text-lg font-bold">{formatCurrency(invoice.amountDue ?? 0)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 left-8 right-8 text-center text-xs text-gray-500 border-t pt-4">
                <p className="mb-1">Thank you for your business!</p>
                <p>If you have any questions about this invoice, please contact us at {storeDetails.phone}</p>
            </div>
        </div>
    );
});

StandardInvoice.displayName = "StandardInvoice";
