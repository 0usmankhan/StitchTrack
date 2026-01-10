
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { StoreDetails, OrderStatus } from '@/lib/types';
import { useFirestore, setDocumentNonBlocking, useDoc } from '@/firebase';
import { getGeneralSettingsDocument } from '@/lib/firestore-paths';
import { doc, onSnapshot } from 'firebase/firestore';
import { useApp } from '@/context/app-context';

interface NotificationSettings {
  lowStock: boolean;
  newOrders: boolean;
}

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
  setStoreDetails: (details: StoreDetails) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

const initialProductCategories: string[] = [
  'Threads',
  'Notions',
  'Fabrics',
  'Tools',
  'Services'
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
  const firestore = useFirestore();
  const { userProfile } = useApp();
  // We can derive accountId from userProfile.associatedAccountId (for employees) or user.uid (owner - but we need user object for that)
  // However, useApp doesn't expose `user` directly, but `userProfile` has `associatedAccountId`.
  // If `associatedAccountId` is null, it means the user IS the owner, so we need their UID.
  // Actually, let's just grab `user` from `useUser` hook inside here to be safe and consistent with AppContext logic.
  // But wait, AppContext already calculates `accountId` internally. Let's see if we can expose it or re-derive it.
  // Re-deriving is safer than exposing if not already exposed.
  // The userProfile ID IS the user's UID.
  const accountId = userProfile?.associatedAccountId || userProfile?.id;


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
  const [storeDetails, setStoreDetailsState] = useState<StoreDetails>(initialStoreDetails);


  // Fetch Store Details from Firestore
  useEffect(() => {
    if (!firestore || !accountId) return;

    const settingsDocRef = doc(firestore, getGeneralSettingsDocument(accountId));

    // Use onSnapshot for real-time updates across the team
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setStoreDetailsState(docSnap.data() as StoreDetails);
      } else {
        // If document doesn't exist yet, we can optionally create it here or just keep defaults.
        // Keeping defaults in state is fine until they save for the first time.
      }
    });

    return () => unsubscribe();
  }, [firestore, accountId]);


  const setStoreDetails = async (details: StoreDetails) => {
    // Optimistic update
    setStoreDetailsState(details);

    if (!firestore || !accountId) return;
    const settingsDocRef = doc(firestore, getGeneralSettingsDocument(accountId));
    // Write to Firestore
    await setDocumentNonBlocking(settingsDocRef, details, { merge: true });
  };


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
