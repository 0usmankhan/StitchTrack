
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/context/settings-context';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { Invoice, Order, Customer } from '@/lib/types';
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface TemplateManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'receipt' | 'invoice' | 'label';
}

export const TemplateManagerModal = ({ isOpen, onClose, type }: TemplateManagerModalProps) => {
    const {
        storeDetails,
        receiptTemplate, setReceiptTemplate,
        invoiceTemplate, setInvoiceTemplate,
        labelTemplate, setLabelTemplate
    } = useSettings();

    const [localTemplate, setLocalTemplate] = useState('');

    // Initial load
    useEffect(() => {
        if (isOpen) {
            if (type === 'receipt') setLocalTemplate(receiptTemplate);
            else if (type === 'invoice') setLocalTemplate(invoiceTemplate || ''); // Handle undefined logic for invoice
            else if (type === 'label') setLocalTemplate(labelTemplate);
        }
    }, [isOpen, type, receiptTemplate, invoiceTemplate, labelTemplate]);

    const handleSave = () => {
        if (type === 'receipt') setReceiptTemplate(localTemplate);
        else if (type === 'invoice') setInvoiceTemplate(localTemplate.trim() === '' ? undefined : localTemplate);
        else if (type === 'label') setLabelTemplate(localTemplate);

        onClose();
    };

    // --- Dummy Data for Preview ---
    const dummyCustomer: Customer = {
        id: 'cust_123',
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '555-0123',
        firstName: 'Jane',
        lastName: 'Doe',
        avatar: '',
        imageHint: '',
    };

    const dummyInvoice: Invoice = {
        id: 'inv_123',
        maskedId: 'INV-0001',
        customerId: 'cust_123',
        customer: dummyCustomer,
        date: new Date().toISOString(),
        dueDate: new Date().toISOString(),
        status: 'Paid',
        items: [
            { id: '1', name: 'Cotton Fabric', quantity: 2, price: 15.00, total: 30.00 },
            { id: '2', name: 'Silk Thread', quantity: 5, price: 2.50, total: 12.50 },
        ],
        subtotal: 42.50,
        tax: 3.40,
        total: 45.90,
        amountDue: 0,
        deposit: 45.90,
        paymentMethod: 'Credit Card',
    };

    const dummyOrder: Order = {
        id: 'ord_123',
        maskedId: 'ORD-9999',
        customerId: 'cust_123',
        customer: dummyCustomer,
        type: 'Order',
        status: 'In Progress',
        amount: 50.00,
        deliveryDate: new Date().toISOString(),
        items: [
            { id: '1', name: 'Custom Dress', price: 50.00, quantity: 1, materials: [] }
        ]
    };

    // --- Rendering Logic (Duplicated/Simplified from Printable components) ---
    const renderPreview = () => {
        let output = localTemplate;

        // Formatting Helper
        const formatDate = (date: any) => {
            try {
                return format(new Date(date), 'MM/dd/yyyy h:mm a');
            } catch { return 'Invalid Date'; }
        };

        // Shared Replacements
        output = output.replace(/\{\{store_name\}\}/g, storeDetails.name);
        output = output.replace(/\{\{store_address\}\}/g, storeDetails.address);
        output = output.replace(/\{\{store_phone\}\}/g, storeDetails.phone);
        output = output.replace(/\{\{store_website\}\}/g, storeDetails.website);
        output = output.replace(/\{\{date\}\}/g, formatDate(new Date()));

        if (type === 'receipt') {
            output = output.replace(/\{\{invoice.id\}\}/g, dummyInvoice.maskedId);
            output = output.replace(/\{\{invoice.date\}\}/g, formatDate(dummyInvoice.date));
            output = output.replace(/\{\{customer.name\}\}/g, dummyInvoice.customer.name);
            output = output.replace(/\{\{invoice.subtotal\}\}/g, formatCurrency(dummyInvoice.subtotal));
            output = output.replace(/\{\{invoice.tax\}\}/g, formatCurrency(dummyInvoice.tax));
            output = output.replace(/\{\{invoice.total\}\}/g, formatCurrency(dummyInvoice.total));
            output = output.replace(/\{\{invoice.amountDue\}\}/g, formatCurrency(dummyInvoice.amountDue ?? 0));
            output = output.replace(/\{\{payment_method\}\}/g, dummyInvoice.paymentMethod || 'N/A');
            output = output.replace(/\{\{ticket_no\}\}/g, dummyInvoice.items?.[0]?.orderId?.substring(0, 8) || 'DOC-1234');
            output = output.replace(/\{\{footer.message\}\}/g, "Thank you for your business!");

            // Paid logic
            const ifPaidRegex = /\{\{#if invoice.paid\}\}([\s\S]*?)\{\{\/if\}\}/g;
            if (dummyInvoice.deposit && dummyInvoice.deposit > 0) {
                output = output.replace(ifPaidRegex, (match, content) => content);
                output = output.replace(/\{\{invoice.paid\}\}/g, formatCurrency(dummyInvoice.deposit));
            } else { output = output.replace(ifPaidRegex, ''); }

            // Loop
            const itemsRegex = /\{\{#each items\}\}([\s\S]*?)\{\{\/each\}\}/g;
            const itemMatch = itemsRegex.exec(output);
            if (itemMatch) {
                const itemTemplate = itemMatch[1];
                const itemsHtml = dummyInvoice.items.map((item: any) => {
                    let name = item.name.padEnd(12);
                    let qty = item.quantity.toString().padEnd(16);
                    return itemTemplate
                        .replace(/\{\{this.name\}\}/g, name)
                        .replace(/\{\{this.quantity\}\}/g, qty)
                        .replace(/\{\{this.total\}\}/g, formatCurrency(item.total));
                }).join('\n');
                output = output.replace(itemsRegex, itemsHtml);
            }

            return <pre className="whitespace-pre-wrap font-code text-xs bg-white text-black p-2 shadow-sm min-h-[300px]">{output}</pre>;
        }

        else if (type === 'invoice') {
            // If empty, show message about default
            if (!localTemplate || localTemplate.trim() === '') {
                return (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm p-8 text-center border-2 border-dashed rounded">
                        Default Professional Template Active. <br /> Start typing to override.
                    </div>
                )
            }

            // Invoice replacements
            output = output.replace(/\{\{invoice.id\}\}/g, dummyInvoice.maskedId);
            output = output.replace(/\{\{invoice.date\}\}/g, formatDate(dummyInvoice.date));
            output = output.replace(/\{\{invoice.dueDate\}\}/g, formatDate(dummyInvoice.dueDate));
            output = output.replace(/\{\{customer.name\}\}/g, dummyInvoice.customer.name);
            output = output.replace(/\{\{customer.email\}\}/g, dummyInvoice.customer.email || '');
            output = output.replace(/\{\{customer.phone\}\}/g, dummyInvoice.customer.phone || '');
            output = output.replace(/\{\{customer.address\}\}/g, dummyInvoice.customer.address || '');

            output = output.replace(/\{\{invoice.subtotal\}\}/g, formatCurrency(dummyInvoice.subtotal));
            output = output.replace(/\{\{invoice.tax\}\}/g, formatCurrency(dummyInvoice.tax));
            output = output.replace(/\{\{invoice.total\}\}/g, formatCurrency(dummyInvoice.total));
            output = output.replace(/\{\{invoice.amountDue\}\}/g, formatCurrency(dummyInvoice.amountDue ?? 0));
            output = output.replace(/\{\{invoice.paid\}\}/g, formatCurrency(dummyInvoice.deposit || 0));

            // Items Loop
            const itemsRegex = /\{\{#each items\}\}([\s\S]*?)\{\{\/each\}\}/g;
            const itemMatch = itemsRegex.exec(output);
            if (itemMatch) {
                const itemTemplate = itemMatch[1];
                const itemsHtml = dummyInvoice.items.map((item) => {
                    return itemTemplate
                        .replace(/\{\{this.name\}\}/g, item.name)
                        .replace(/\{\{this.quantity\}\}/g, item.quantity.toString())
                        .replace(/\{\{this.price\}\}/g, formatCurrency(item.price))
                        .replace(/\{\{this.total\}\}/g, formatCurrency(item.total));
                }).join('');
                output = output.replace(itemsRegex, itemsHtml);
            }

            return (
                <div className="bg-white text-black p-6 font-sans shadow-sm min-h-[400px] overflow-auto scale-75 origin-top-left w-[133%]">
                    <div dangerouslySetInnerHTML={{ __html: output }} />
                </div>
            );
        }

        else if (type === 'label') {
            // Label Replacements
            const item = dummyInvoice.items[0];
            output = output.replace(/\{\{customer.name\}\}/g, dummyInvoice.customer.name);
            output = output.replace(/\{\{order.id\}\}/g, dummyOrder.maskedId);
            output = output.replace(/\{\{item.name\}\}/g, item.name);
            output = output.replace(/\{\{item.price\}\}/g, item.price.toFixed(2));

            return (
                <div className="bg-white text-black p-4 font-sans shadow-sm min-h-[150px] inline-block">
                    <div dangerouslySetInnerHTML={{ __html: output }} />
                </div>
            );
        }

        return null;
    };

    const getTitle = () => {
        switch (type) {
            case 'receipt': return 'Thermal Receipt Template';
            case 'invoice': return 'Standard Invoice Template';
            case 'label': return 'Label Template';
            default: return 'Template Editor';
        }
    }

    const getDescription = () => {
        switch (type) {
            case 'receipt': return 'Edit the template for your 80mm thermal receipts. Use the available macros to include dynamic information.';
            case 'invoice': return 'Customize the A4 invoice design. Leave blank to use the default professional layout.';
            case 'label': return 'Design your labels for products or shipping.';
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[70vw] h-[80vh] flex flex-col p-0 gap-0">
                <div className="p-6 pb-2">
                    <DialogHeader>
                        <DialogTitle>{getTitle()}</DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1.5">{getDescription()}</p>
                    </DialogHeader>
                </div>

                <div className="flex-1 grid grid-cols-2 min-h-0 bg-background/50 border-y">
                    {/* Editor Column */}
                    <div className="border-r flex flex-col p-4 bg-zinc-950/5 relative group">
                        <div className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Template Editor</div>
                        {type === 'receipt' || type === 'label' ? (
                            <textarea
                                className="flex-1 w-full bg-zinc-900 text-zinc-100 font-mono text-sm p-4 rounded-md focus:outline-none focus:ring-1 focus:ring-primary resize-none border border-zinc-800"
                                value={localTemplate}
                                onChange={(e) => setLocalTemplate(e.target.value)}
                                placeholder="Type your template here..."
                                spellCheck={false}
                            />
                        ) : (
                            <div className="bg-white text-black flex-1 rounded-md overflow-hidden flex flex-col">
                                <ReactQuill
                                    theme="snow"
                                    value={localTemplate}
                                    onChange={setLocalTemplate}
                                    className="h-full flex flex-col [&_.ql-container]:flex-1 [&_.ql-editor]:h-full"
                                />
                            </div>
                        )}
                    </div>

                    {/* Preview Column */}
                    <div className="flex flex-col p-4 bg-zinc-100/50 dark:bg-zinc-900/50 overflow-hidden">
                        <div className="mb-2 flex justify-between items-center">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Live Preview</div>
                            {/* Optional: Add 'Print Test' button here later */}
                        </div>
                        <div className="flex-1 overflow-auto border rounded-md shadow-inner bg-zinc-200/50 dark:bg-zinc-950/50 p-4 flex justify-center items-start">
                            {renderPreview()}
                        </div>
                    </div>
                </div>

                <div className="p-4 flex justify-end gap-2 bg-background">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Template</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
