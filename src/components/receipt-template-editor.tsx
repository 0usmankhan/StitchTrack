
'use client';

import { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { PrintableReceipt } from '@/components/printable-receipt';
import type { Invoice } from '@/lib/types';
import { useSettings } from '@/context/settings-context';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';

const macros = [
    { macro: '{{store_name}}', description: 'The name of your store.' },
    { macro: '{{store_address}}', description: 'The address of your store.' },
    { macro: '{{store_phone}}', description: 'Your store\'s phone number.' },
    { macro: '{{store_website}}', description: 'Your store\'s website URL.' },
    { macro: '{{invoice.id}}', description: 'The unique identifier for the invoice (e.g., INV-0001).' },
    { macro: '{{invoice.date}}', description: 'The date the invoice was created.' },
    { macro: '{{customer.name}}', description: 'The name of the customer.' },
    { macro: '{{#each items}}...{{/each}}', description: 'Loop through each line item.' },
    { macro: '{{this.name}}', description: 'The name of the line item (inside an #each loop).' },
    { macro: '{{this.quantity}}', description: 'The quantity of the line item (inside an #each loop).' },
    { macro: '{{this.total}}', description: 'The total price for the line item (inside an #each loop).' },
    { macro: '{{invoice.subtotal}}', description: 'The subtotal before taxes.' },
    { macro: '{{invoice.tax}}', description: 'The total tax amount.' },
    { macro: '{{invoice.total}}', description: 'The final total amount.' },
    { macro: '{{#if invoice.paid}}...{{/if}}', description: 'Conditional block for paid amount.'},
    { macro: '{{invoice.paid}}', description: 'The amount already paid by the customer.' },
    { macro: '{{invoice.amountDue}}', description: 'The remaining amount due.' },
    { macro: '{{footer.message}}', description: 'A closing message for the footer.' },
    { macro: '{{ticket_no}}', description: 'The order/ticket number.' },
    { macro: '{{payment_method}}', description: 'The method of payment (e.g., Card, Cash).'},
  ];

const dummyInvoice: Invoice = {
  id: 'dummy-inv',
  maskedId: 'INV-0001',
  date: new Date().toISOString(),
  dueDate: new Date().toISOString(),
  status: 'Paid',
  customer: { 
    id: 'dummy-cust',
    name: 'Walk-in Customer',
    firstName: 'Walk-in',
    lastName: 'Customer',
    email: 'customer@example.com',
    avatar: 'https://picsum.photos/seed/avatar1/40/40',
    imageHint: 'person portrait'
  },
  items: [
    { id: '1', name: 'Sample Item 1', quantity: 2, price: 9.99, total: 19.98 },
    { id: '2', name: 'Another Sample Item', quantity: 1, price: 25.00, total: 25.00 },
  ],
  subtotal: 44.98,
  tax: 3.60,
  total: 48.58,
  deposit: 50.00,
  amountDue: -1.42,
  paymentMethod: 'Card',
};

type ReceiptTemplateEditorProps = {
  onClose: () => void;
};

export function ReceiptTemplateEditor({ onClose }: ReceiptTemplateEditorProps) {
  const { receiptTemplate, setReceiptTemplate } = useSettings();
  const { toast } = useToast();
  const [template, setTemplate] = useState(receiptTemplate);
  const ref = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => ref.current!,
    documentTitle: 'Receipt-Test-Print',
  });

  const handleSave = () => {
    setReceiptTemplate(template);
    toast({
      title: 'Template Saved',
      description: 'Your thermal receipt template has been updated.',
    });
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="p-6">
        <SheetTitle className="text-2xl">Thermal Receipt Template</SheetTitle>
        <SheetDescription>
          Edit the template for your 80mm thermal receipts. Use the available macros to include dynamic information.
        </SheetDescription>
      </SheetHeader>
      
      <Separator />

      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <Card className="flex-grow">
            <CardHeader>
              <CardTitle>Template Editor</CardTitle>
              <CardDescription>
                Modify the receipt structure. Use a monospace font for best results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="h-96 font-code text-xs"
                placeholder="Enter your receipt template here..."
              />
            </CardContent>
          </Card>
          <Card>
             <CardHeader>
              <CardTitle>Available Macros</CardTitle>
              <CardDescription>
                Use these placeholders to insert dynamic invoice data.
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto">
               <ul className="space-y-2 text-sm">
                {macros.map((m, i) => (
                  <li key={i} className="flex items-start">
                    <code className="font-semibold text-primary mr-2 bg-primary/10 px-1 py-0.5 rounded text-xs whitespace-nowrap">{m.macro}</code>
                    <span className="text-muted-foreground">{m.description}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>An approximate preview of the printed receipt.</CardDescription>
                </div>
                <Button variant="outline" onClick={handlePrint}>Print Test</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded bg-muted/30 p-2">
                 <PrintableReceipt ref={ref} invoice={dummyInvoice} customTemplate={template} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <SheetFooter className="p-6 border-t bg-background">
        <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Template</Button>
        </div>
      </SheetFooter>
    </div>
  );
}
