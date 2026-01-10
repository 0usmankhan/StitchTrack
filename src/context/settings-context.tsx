
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type OrderStatus = {
  name: string;
  color: string;
};

interface NotificationSettings {
  lowStock: boolean;
  newOrders: boolean;
}

export interface StoreDetails {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

const defaultReceiptTemplate = `
              {{store_name}}
            {{store_address}}
        Phone: {{store_phone}}
        Website: {{store_website}}
------------------------------------------
Date: {{invoice.date}}
Invoice #: {{invoice.id}}
Ticket: {{ticket_no}}
Customer: {{customer.name}}
------------------------------------------
Item          Qty              Price
------------------------------------------
{{#each items}}
{{this.name}}
              {{this.quantity}}               {{this.total}}
{{/each}}
------------------------------------------
Sub Total:                  {{invoice.subtotal}}
Tax:                        {{invoice.tax}}
------------------------------------------
Total:                      {{invoice.total}}
{{#if invoice.paid}}
Paid:                       {{invoice.paid}}
{{/if}}
Amount Due:                 {{invoice.amountDue}}
------------------------------------------
Payment Method: {{payment_method}}

        {{footer.message}}
`;

const defaultInvoiceTemplate = undefined; // Undefined means it uses the React component by default

const defaultLabelTemplate = `
<div style="width: 100mm; height: 50mm; padding: 5mm; border: 1px solid black; font-family: sans-serif; display: flex; flex-direction: column; justify-content: space-between;">
  <div style="text-align: center; font-weight: bold; font-size: 16px;">{{store_name}}</div>
  <div style="font-size: 12px;">
    <strong>Customer:</strong> {{customer.name}}<br/>
    <strong>Order:</strong> {{order.id}}
  </div>
  <div style="text-align: center; font-size: 10px;">
    {{item.name}}
  </div>
</div>
`;


interface SettingsContextType {
  taxRate: number;
  setTaxRate: (rate: number) => void;
  taxName: string;
  setTaxName: (name: string) => void;
  productCategories: string[];
  setProductCategories: React.Dispatch<React.SetStateAction<string[]>>;
  orderStatuses: OrderStatus[];
  setOrderStatuses: React.Dispatch<React.SetStateAction<OrderStatus[]>>;
  suppliers: string[];
  setSuppliers: React.Dispatch<React.SetStateAction<string[]>>;
  notifications: NotificationSettings;
  setNotifications: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  storeDetails: StoreDetails;
  setStoreDetails: React.Dispatch<React.SetStateAction<StoreDetails>>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

const initialProductCategories: string[] = [
  'Threads',
  'Notions',
  'Fabrics',
  'Tools',
];

const initialOrderStatuses: OrderStatus[] = [
  { name: 'Placed', color: '#3b82f6' },
  { name: 'In Progress', color: '#f97316' },
  { name: 'Completed', color: '#22c55e' },
  { name: 'Shipped', color: '#8b5cf6' },
];

const initialSuppliers: string[] = [
  'Stitch Co.',
  'Glamour Stitches',
  'Durable Denim',
  'Button Bonanza',
  'Fabric World',
  'Sharp Point Inc.',
];

const initialNotifications: NotificationSettings = {
  lowStock: true,
  newOrders: false,
};

const initialStoreDetails: StoreDetails = {
  name: 'StitchTrack POS',
  address: '123 Main Street, Anytown, USA',
  phone: '555-123-4567',
  email: 'support@stitchtrack.com',
  website: 'www.stitchtrack.com',
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [taxRate, setTaxRate] = useState(0.08); // Default 8%
  const [taxName, setTaxName] = useState('Tax');
  const [productCategories, setProductCategories] = useState<string[]>(
    initialProductCategories
  );
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>(
    initialOrderStatuses
  );
  const [suppliers, setSuppliers] = useState<string[]>(initialSuppliers);
  const [notifications, setNotifications] = useState<NotificationSettings>(initialNotifications);
  const [storeDetails, setStoreDetails] = useState<StoreDetails>(initialStoreDetails);


  return (
    <SettingsContext.Provider
      value={{
        taxRate,
        setTaxRate,
        taxName,
        setTaxName,
        productCategories,
        setProductCategories,
        orderStatuses,
        setOrderStatuses,
        suppliers,
        setSuppliers,
        notifications,
        setNotifications,
        storeDetails,
        setStoreDetails,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
