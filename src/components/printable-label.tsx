import React, { forwardRef } from 'react';
import { useSettings } from '@/context/settings-context';
import { Customer, Order } from '@/lib/types';
import { format } from 'date-fns';

interface PrintableLabelProps {
    order: Order;
    item: { name: string; price: number };
    customer: Customer;
}

export const PrintableLabel = forwardRef<HTMLDivElement, PrintableLabelProps>(
    ({ order, item, customer }, ref) => {
        const { labelTemplate, storeDetails } = useSettings();

        const processTemplate = (template: string) => {
            let processed = template;

            const replacements: Record<string, string> = {
                '{{store_name}}': storeDetails.name,
                '{{customer.name}}': customer.name,
                '{{order.id}}': order.maskedId,
                '{{item.name}}': item.name,
                '{{item.price}}': item.price.toFixed(2),
                '{{date}}': format(new Date(), 'PPP'),
            };

            Object.entries(replacements).forEach(([key, value]) => {
                processed = processed.replace(new RegExp(key, 'g'), value);
            });

            return processed;
        };

        return (
            <div ref={ref} className="printable-label">
                <div
                    dangerouslySetInnerHTML={{ __html: processTemplate(labelTemplate) }}
                />
                <style jsx global>{`
          @media print {
            .printable-label {
              page-break-inside: avoid;
            }
          }
        `}</style>
            </div>
        );
    }
);

PrintableLabel.displayName = 'PrintableLabel';
