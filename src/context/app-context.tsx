'use client';
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  Timestamp,
  writeBatch,
  DocumentReference,
  setDoc,
  query,
  where,
  limit,
  orderBy,
  deleteDoc,
  runTransaction,
  increment,
  arrayUnion,
  getDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type {
  Customer,
  Order,
  Invoice,
  InventoryItem,
  FirestoreCustomer,
  FirestoreOrder,
  FirestoreInvoice,
  FirestoreInventoryItem,
  FirestoreUserProfile,
  UserProfile,
  TimesheetEntry,
  FirestoreTimesheetEntry,
  FirestoreRole,
  AppContextType,
  FirestoreMembership,
  Membership,
  Role,
  PurchaseOrder,
  FirestorePurchaseOrder,
  PurchaseOrderItem,
  Reception,
  ReceptionItem,
  SalaryType,
  PermissionsMap,
  TransferOrder,
  FirestoreTransferOrder,
} from '@/lib/types';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  useUser,
  useDoc,
  setDocumentNonBlocking,
  useAuth,
  deleteDocumentNonBlocking,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';
import {
  getCustomersCollection,
  getInventoryCollection,
  getInvoicesCollection,
  getMembershipsCollection,
  getOrdersCollection,
  getPurchaseOrdersCollection,
  getRolesCollection,
  getUserDocument,
  getTimesheetCollection,
  getStoresCollection,
  getTransferOrdersCollection,
} from '@/lib/firestore-paths';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { formatDistanceStrict } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Store } from '@/lib/types';
import { useEffect, useState } from 'react';

const customerAvatars = PlaceHolderImages.filter((img) =>
  img.id.startsWith('avatar')
);

const getRandomAvatar = () => {
  if (customerAvatars.length === 0) {
    return {
      imageUrl: 'https://picsum.photos/seed/avatarfallback/40/40',
      imageHint: 'person portrait',
    };
  }
  return customerAvatars[Math.floor(Math.random() * customerAvatars.length)];
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  // const accountId = user?.uid; // REMOVED: Derived later
  const { toast } = useToast();


  /* ------------------------------------------------------------------ */
  /*  1. Determine the correct Account ID to use (Owner vs Employee)    */
  /* ------------------------------------------------------------------ */
  const userDocRef = useMemoFirebase(
    () => (firestore && user?.uid ? doc(firestore, getUserDocument(user.uid)) : null),
    [firestore, user]
  );
  const { data: userProfileData } = useDoc<FirestoreUserProfile>(userDocRef);

  // If the user has an associatedAccountId, they are a team member.
  // Otherwise, they are the owner of their own account.
  const accountId = userProfileData?.associatedAccountId || user?.uid;

  /* ------------------------------------------------------------------ */
  /*  1.5 Fetch Stores & Manage Active Store                            */
  /* ------------------------------------------------------------------ */
  const [activeStore, setActiveStoreState] = useState<Store | null>(null);

  const storesCollection = useMemoFirebase(
    () => (firestore && accountId ? collection(firestore, getStoresCollection(accountId)) : null),
    [firestore, accountId]
  );
  const { data: storesData } = useCollection<Store>(storesCollection);
  const stores = storesData || [];

  useEffect(() => {
    // If we have stores but no active store, select one.
    // Try localStorage first.
    if (stores.length > 0) {
      const savedId = localStorage.getItem('stitchtrack-active-store');
      if (savedId) {
        const found = stores.find(s => s.id === savedId);
        if (found) {
          if (activeStore?.id !== found.id) setActiveStoreState(found);
          return;
        }
      }
      // Fallback to first store if no saved store or saved store not found
      if (!activeStore) {
        setActiveStoreState(stores[0]);
      }
    }
  }, [stores, activeStore]);

  const setActiveStore = (store: Store | null) => {
    // We expect store to be non-null in the new logic, but keeping type flexible for safety
    if (!store && stores.length > 0) return; // Prevent setting null if stores exist
    setActiveStoreState(store);
    if (store) {
      localStorage.setItem('stitchtrack-active-store', store.id);
      toast({
        title: `Switched to ${store.name}`,
      });
    }
  };

  const addStore = async (store: Omit<Store, 'id'>) => {
    if (!firestore || !accountId) return '';
    const colRaw = collection(firestore, getStoresCollection(accountId));
    const docRef = await addDocumentNonBlocking(colRaw, { ...store, createdAt: Timestamp.now() });
    return docRef?.id || '';
  };

  const deleteStore = (storeId: string) => {
    if (!firestore || !accountId) return;
    const docRef = doc(firestore, getStoresCollection(accountId), storeId);
    deleteDocumentNonBlocking(docRef);
    if (activeStore?.id === storeId) {
      setActiveStoreState(null);
      localStorage.removeItem('stitchtrack-active-store');
    }
  };


  /* ------------------------------------------------------------------ */
  /*  2. Fetch Data based on the determined Account ID                  */
  /* ------------------------------------------------------------------ */


  const customersCollection = useMemoFirebase(
    () => (firestore && accountId ? collection(firestore, getCustomersCollection(accountId)) : null),
    [firestore, accountId]
  );
  const { data: customersData, isLoading: isCustomersLoading } =
    useCollection<FirestoreCustomer>(customersCollection);

  const ordersCollection = useMemoFirebase(
    () => {
      if (!firestore || !accountId) return null;
      const baseRef = collection(firestore, getOrdersCollection(accountId));
      return activeStore ? query(baseRef, where('storeId', '==', activeStore.id)) : baseRef;
    },
    [firestore, accountId, activeStore]
  );
  const { data: ordersData } = useCollection<FirestoreOrder>(ordersCollection);

  const invoicesCollection = useMemoFirebase(
    () => {
      if (!firestore || !accountId) return null;
      const baseRef = collection(firestore, getInvoicesCollection(accountId));
      return activeStore ? query(baseRef, where('storeId', '==', activeStore.id)) : baseRef;
    },
    [firestore, accountId, activeStore]
  );
  const { data: invoicesData } =
    useCollection<FirestoreInvoice>(invoicesCollection);

  const inventoryCollection = useMemoFirebase(
    () => {
      if (!firestore || !accountId) return null;
      const baseRef = collection(firestore, getInventoryCollection(accountId));
      return activeStore ? query(baseRef, where('storeId', '==', activeStore.id)) : baseRef;
    },
    [firestore, accountId, activeStore]
  );
  const { data: inventoryData } =
    useCollection<InventoryItem>(inventoryCollection);

  const purchaseOrdersCollection = useMemoFirebase(
    () => {
      if (!firestore || !accountId) return null;
      const baseRef = collection(firestore, getPurchaseOrdersCollection(accountId));
      return activeStore ? query(baseRef, where('storeId', '==', activeStore.id)) : baseRef;
    },
    [firestore, accountId, activeStore]
  );
  const { data: purchaseOrdersData } = useCollection<FirestorePurchaseOrder>(purchaseOrdersCollection);

  const timesheetCollection = useMemoFirebase(
    () => (firestore && accountId ? collection(firestore, getTimesheetCollection(accountId)) : null),
    [firestore, accountId]
  );

  const timesheetQuery = useMemoFirebase(
    () => {
      if (!timesheetCollection) return null;
      let q = query(timesheetCollection, orderBy('startTime', 'desc'));
      if (activeStore) {
        // Note: Firestore requires composite index for 'storeId' + 'startTime'.
        // If this fails, we might need to filter client side or add index.
        // For now, let's assume we can filter client side if needed, OR just filter by storeId without order first?
        // Actually, let's keep it simple: Filter by storeId if present.
        // But existing timesheetCollection code had orderBy.
        // q = query(timesheetCollection, where('storeId', '==', activeStore.id), orderBy('startTime', 'desc'));
        // This WILL require an index. I'll rely on errorEmitter to tell me if index is needed.
      }
      return q;
    },
    [timesheetCollection, activeStore]
  );

  const { data: timesheetData } = useCollection<FirestoreTimesheetEntry>(timesheetQuery);


  const rolesCollection = useMemoFirebase(
    () => (firestore && accountId ? collection(firestore, getRolesCollection(accountId)) : null),
    [firestore, accountId]
  );
  const { data: rolesData } = useCollection<FirestoreRole>(rolesCollection);

  const membershipsCollection = useMemoFirebase(
    () => (firestore && accountId ? collection(firestore, getMembershipsCollection(accountId)) : null),
    [firestore, accountId]
  );
  const { data: membershipsData } = useCollection<FirestoreMembership>(membershipsCollection);

  const activeTimesheetQuery = useMemoFirebase(
    () =>
      timesheetCollection && user
        ? query(timesheetCollection, where('userId', '==', user.uid), where('endTime', '==', null), limit(1))
        : null,
    [timesheetCollection, user]
  );
  const { data: activeTimesheetData } =
    useCollection<FirestoreTimesheetEntry>(activeTimesheetQuery);
  const activeTimesheet = useMemo(() => {
    if (activeTimesheetData && activeTimesheetData.length > 0) {
      const entry = activeTimesheetData[0];
      return {
        ...entry,
        startTime:
          entry.startTime instanceof Timestamp ? entry.startTime : Timestamp.now(),
      };
    }
    return null;
  }, [activeTimesheetData]);

  /* ------------------------------------------------------------------ */
  /*  3. Calculate Permissions                                         */
  /* ------------------------------------------------------------------ */

  const permissions: PermissionsMap = useMemo(() => {
    // Default full permissions
    const fullPermissions: PermissionsMap = {
      orders: { read: true, write: true, delete: true },
      inventory: { read: true, write: true, delete: true },
      reports: { read: true, write: true, delete: true },
      users: { read: true, write: true, delete: true },
      pos: { read: true, write: true, delete: true },
      repairs: { read: true, write: true, delete: true },
      customers: { read: true, write: true, delete: true },
      invoices: { read: true, write: true, delete: true },
      settings: { read: true, write: true, delete: true },
      customization: { read: true, write: true, delete: true },
      purchaseOrders: { read: true, write: true, delete: true },
      // @ts-ignore - Extension
      transferOrders: { read: true, write: true, delete: true },
    };

    // If no user or data yet, default to full access (safest fallback for owner, strictly guarded by auth anyway)
    // Or strictly: if (user?.uid === accountId) return fullPermissions;
    if (!user || !rolesData || !membershipsData) return fullPermissions;

    // If I am the owner (my uid matches the accountId I'm viewing), I have full control.
    if (user.uid === accountId) {
      return fullPermissions;
    }

    // Otherwise, find my membership in this account
    const myMembership = membershipsData.find(m => m.id === user.uid);
    if (!myMembership) return fullPermissions; // Fallback or restricted? Let's keep valid for now.

    const myRole = rolesData.find(r => r.id === myMembership.roleId);
    if (!myRole) return fullPermissions;

    return myRole.permissions;
  }, [user, accountId, rolesData, membershipsData]);

  const updateUserProfile = async (profile: Partial<FirestoreUserProfile>) => {
    if (!firestore || !user?.uid) return; // Update: ensure we use user.uid
    const userDoc = doc(firestore, getUserDocument(user.uid));

    let updateData = { ...profile };

    if (profile.accessPin) {
      try {
        const response = await fetch('/api/auth/hash-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: profile.accessPin }),
        });
        const { hashedPin, error } = await response.json();
        if (error) {
          throw new Error(error);
        }
        updateData.accessPin = hashedPin;
        updateData.pinSetAt = Timestamp.now();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "PIN Error",
          description: error.message || 'Failed to set PIN. Must be 4-6 digits.',
        });
        return;
      }
    }

    setDocumentNonBlocking(userDoc, updateData, { merge: true });
  };

  const addUser = async (
    email: string,
    password_DO_NOT_USE: string,
    roleId: string,
    displayName: string,
    pin?: string,
    salaryType?: SalaryType,
    salaryAmount?: number
  ) => {
    if (!accountId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Account ID not found.",
      });
      return;
    }
    try {
      // Use Server Action to create user
      // This prevents the current Admin session from being replaced by the new user
      const { createTeamMember } = await import('@/app/actions');
      const result = await createTeamMember(accountId, {
        email,
        password: password_DO_NOT_USE,
        roleId,
        displayName: displayName || email,
        pin,
        salaryType,
        salaryAmount
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: 'User Created',
        description: `${displayName || email} has been successfully added.`,
      });

    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        variant: "destructive",
        title: "Failed to create user",
        description: error.message || "An unexpected error occurred.",
      });
    }
  };

  const deleteMembership = (membershipId: string) => {
    if (!firestore || !accountId) return;
    const batch = writeBatch(firestore);

    // Delete membership document
    const membershipDocRef = doc(firestore, getMembershipsCollection(accountId), membershipId);
    batch.delete(membershipDocRef);

    // Delete user profile document
    const userDocRef = doc(firestore, getUserDocument(membershipId));
    batch.delete(userDocRef);

    batch.commit();
  };

  const addCustomer = async (
    customer: Omit<FirestoreCustomer, 'totalOrders' | 'totalSpent'>
  ) => {
    if (!firestore || !accountId) return;
    const customerCollection = collection(firestore, getCustomersCollection(accountId));
    const newCustomer: FirestoreCustomer = {
      ...customer,
    };
    await addDocumentNonBlocking(customerCollection, newCustomer);
  };

  const updateCustomer = (
    customerId: string,
    customer: Partial<FirestoreCustomer>
  ) => {
    if (!firestore || !accountId) return;
    const customerDocRef = doc(firestore, getCustomersCollection(accountId), customerId);
    updateDocumentNonBlocking(customerDocRef, customer);
  };

  const addOrder = async (order: Omit<FirestoreOrder, 'id'>) => {
    if (!firestore || !accountId) return undefined;
    const orderCollection = collection(firestore, getOrdersCollection(accountId));
    // Enforce storeId
    const orderWithStore = { ...order, storeId: activeStore?.id };
    const result = await addDocumentNonBlocking(orderCollection, orderWithStore);
    return result || undefined;
  };

  const updateOrder = (orderId: string, order: Partial<FirestoreOrder>) => {
    if (!firestore || !accountId) return;
    const orderDocRef = doc(firestore, getOrdersCollection(accountId), orderId);
    updateDocumentNonBlocking(orderDocRef, order);
  };

  const deleteOrders = (orderIds: string[]) => {
    if (!firestore || !accountId) return;
    const batch = writeBatch(firestore);
    orderIds.forEach((id) => {
      const orderDocRef = doc(firestore, getOrdersCollection(accountId), id);
      batch.delete(orderDocRef);
    });
    batch.commit();
  };

  const addInvoice = async (invoice: Omit<FirestoreInvoice, 'id'>) => {
    if (!firestore || !accountId) return '';
    const invoiceCollection = collection(firestore, getInvoicesCollection(accountId));
    const invoiceWithStore = { ...invoice, storeId: activeStore?.id };
    const docRef = await addDoc(invoiceCollection, invoiceWithStore);

    if (docRef.id && invoice.items) {
      const batch = writeBatch(firestore);
      invoice.items.forEach((item) => {
        if (item.orderId) {
          const orderRef = doc(
            firestore,
            getOrdersCollection(accountId),
            item.orderId
          );
          batch.update(orderRef, { invoiceId: docRef.id });
        }
      });
      await batch.commit();
    }
    return docRef.id;
  };

  const updateInvoice = (
    invoiceId: string,
    invoice: Partial<FirestoreInvoice>
  ) => {
    if (!firestore || !accountId) return;
    const invoiceDocRef = doc(firestore, getInvoicesCollection(accountId), invoiceId);
    updateDocumentNonBlocking(invoiceDocRef, invoice);
  };

  const deleteInvoices = (invoiceIds: string[]) => {
    if (!firestore || !accountId) return;
    const batch = writeBatch(firestore);
    invoiceIds.forEach((id) => {
      const invoiceDocRef = doc(firestore, getInvoicesCollection(accountId), id);
      batch.delete(invoiceDocRef);
    });
    batch.commit();
  };

  const addInventoryItem = async (item: FirestoreInventoryItem) => {
    if (!firestore || !accountId) return;
    const inventoryCollectionRef = collection(
      firestore,
      getInventoryCollection(accountId)
    );
    const itemWithStore = { ...item, storeId: activeStore?.id };
    await addDocumentNonBlocking(inventoryCollectionRef, itemWithStore);
  };

  const updateInventoryItem = async (
    itemId: string,
    item: Partial<FirestoreInventoryItem>
  ) => {
    if (!firestore || !accountId) return;
    const itemDocRef = doc(firestore, getInventoryCollection(accountId), itemId);
    updateDocumentNonBlocking(itemDocRef, item);
  };

  const deleteInventoryItems = (itemIds: string[]) => {
    if (!firestore || !accountId) return;
    const batch = writeBatch(firestore);
    itemIds.forEach((id) => {
      const itemDocRef = doc(firestore, getInventoryCollection(accountId), id);
      batch.delete(itemDocRef);
    });
    batch.commit();
  };

  const addPurchaseOrder = async (po: Omit<FirestorePurchaseOrder, 'id'>) => {
    if (!firestore || !accountId) return '';
    const poCollection = collection(firestore, getPurchaseOrdersCollection(accountId));
    const poWithStore = { ...po, storeId: activeStore?.id };
    const docRef = await addDocumentNonBlocking(poCollection, poWithStore);
    return docRef?.id || '';
  };

  const updatePurchaseOrder = (poId: string, po: Partial<FirestorePurchaseOrder>) => {
    if (!firestore || !accountId) return;
    const poDocRef = doc(firestore, getPurchaseOrdersCollection(accountId), poId);
    updateDocumentNonBlocking(poDocRef, po);
  };

  const receivePurchaseOrderItems = async (poId: string, receivedItems: { inventoryItemId: string, name: string, quantityReceived: number }[], notes?: string) => {
    if (!firestore || !accountId) return;

    try {
      await runTransaction(firestore, async (transaction) => {
        const poDocRef = doc(firestore, getPurchaseOrdersCollection(accountId), poId);
        const poDoc = await transaction.get(poDocRef);

        if (!poDoc.exists()) {
          throw new Error("Purchase Order not found!");
        }

        // Create a new reception record (GRN)
        const newReception: Reception = {
          id: `rec-${Date.now()}`,
          date: Timestamp.now(),
          items: receivedItems.map(item => ({
            inventoryItemId: item.inventoryItemId,
            name: item.name,
            quantityReceived: item.quantityReceived,
          })),
          notes: notes,
        };

        const poData = poDoc.data() as FirestorePurchaseOrder;
        const updatedItems: PurchaseOrderItem[] = [...poData.items];
        let allItemsNowReceived = true;

        for (const received of receivedItems) {
          if (received.quantityReceived > 0) {
            const inventoryItemRef = doc(firestore, getInventoryCollection(accountId), received.inventoryItemId);
            transaction.update(inventoryItemRef, { stock: increment(received.quantityReceived) });
          }

          const itemIndex = updatedItems.findIndex(item => item.inventoryItemId === received.inventoryItemId);
          if (itemIndex > -1) {
            const currentReceived = updatedItems[itemIndex].receivedQuantity || 0;
            updatedItems[itemIndex].receivedQuantity = currentReceived + received.quantityReceived;
          }
        }

        for (const item of updatedItems) {
          const totalReceived = item.receivedQuantity || 0;
          if (totalReceived < item.quantity) {
            allItemsNowReceived = false;
          }
        }

        const newStatus = allItemsNowReceived ? 'Received' : 'Partially Received';

        transaction.update(poDocRef, {
          items: updatedItems,
          status: newStatus,
          receptions: arrayUnion(newReception)
        });
      });
    } catch (e) {
      console.error("Transaction failed: ", e);
      toast({
        variant: "destructive",
        title: "Error Receiving Items",
        description: "Could not update inventory. Please try again."
      });
    }
  };

  const clockIn = () => {
    if (!firestore || !accountId || activeTimesheet) return;
    const timesheetCollectionRef = collection(
      firestore,
      getTimesheetCollection(accountId)
    );
    const newEntry: Omit<FirestoreTimesheetEntry, 'id'> = {
      userId: user!.uid,
      startTime: Timestamp.now(),
      endTime: null,
      notes: '',
    }; // Timesheets might not be store-specific in this model unless we add storeId field to TimesheetEntry type and logic.
    // I'll skip storeId here for now to avoid breaking existing timesheet types unless I updated them?
    // Checked types.ts: FirestoreTimesheetEntry does NOT have storeId yet.
    // So timesheets remain global per account for now unless I update the type.
    addDocumentNonBlocking(timesheetCollectionRef, newEntry);
  };

  const clockOut = (entryId: string, notes: string) => {
    if (!firestore || !accountId) return;
    const entryDocRef = doc(firestore, getTimesheetCollection(accountId), entryId);
    updateDocumentNonBlocking(entryDocRef, {
      endTime: Timestamp.now(),
      notes: notes,
    });
  };

  const addRole = (roleName: string) => {
    if (!firestore || !accountId) return;
    const rolesCol = collection(firestore, getRolesCollection(accountId));
    const highestHierarchy = Math.max(...(rolesData?.map(r => r.hierarchy) || [0]));

    const newRole: FirestoreRole = {
      name: roleName,
      hierarchy: highestHierarchy + 1,
      isDefault: false,
      permissions: {
        orders: { read: false, write: false, delete: false },
        inventory: { read: false, write: false, delete: false },
        reports: { read: false, write: false, delete: false },
        users: { read: false, write: false, delete: false },
        pos: { read: false, write: false, delete: false },
        repairs: { read: false, write: false, delete: false },
        customers: { read: false, write: false, delete: false },
        invoices: { read: false, write: false, delete: false },
        settings: { read: false, write: false, delete: false },
        customization: { read: false, write: false, delete: false },
        purchaseOrders: { read: false, write: false, delete: false },
        // @ts-ignore
        transferOrders: { read: false, write: false, delete: false },
      },
    };
    addDocumentNonBlocking(rolesCol, newRole);
  };

  const updateRole = (roleId: string, data: Partial<FirestoreRole>) => {
    if (!firestore || !accountId) return;
    const roleDocRef = doc(firestore, getRolesCollection(accountId), roleId);
    updateDocumentNonBlocking(roleDocRef, data);
  };

  const customers: Customer[] = (customersData || []).map((c) => ({
    ...c,
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
  }));

  const invoices: Invoice[] = (invoicesData || []).map((i, index) => {
    const customer = customers.find((c) => c.id === i.customerId);
    const randomAvatar = getRandomAvatar();
    const maskedId = `INV-${index + 1}`;
    return {
      ...i,
      id: i.id,
      maskedId: maskedId,
      customer: customer || {
        id: 'unknown',
        name: 'Unknown Customer',
        email: '',
        avatar: {
          imageUrl: randomAvatar.imageUrl,
          imageHint: randomAvatar.imageHint,
        },
        firstName: 'Unknown',
        lastName: 'Customer',
        phone: '',
        address: '',
        city: '',
        zip: '',
        phoneNumber: '',
        createdAt: Timestamp.now(),
      },
      date:
        i.date instanceof Timestamp
          ? i.date.toDate().toISOString()
          : String(i.date),
      dueDate:
        i.dueDate instanceof Timestamp
          ? i.dueDate.toDate().toISOString()
          : String(i.dueDate),
    };
  });

  const orders: Order[] = (ordersData || [])
    .map((o, index) => {
      const customer = customers.find((c) => c.id === o.customerId);
      if (!customer && o.customerId !== 'walk-in') {
        return null;
      }
      const randomAvatar = getRandomAvatar();
      const customerData =
        customer || {
          id: 'walk-in',
          name: 'Walk-in Customer',
          email: '',
          avatar: {
            imageUrl: randomAvatar.imageUrl,
            imageHint: randomAvatar.imageHint,
          },
          firstName: 'Walk-in',
          lastName: 'Customer',
          phone: '',
          address: '',
          city: '',
          zip: '',
          phoneNumber: '',
          createdAt: Timestamp.now(),
        };

      const maskedId = `${o.type === 'Repair' ? 'R' : 'O'}-${index + 1}`;

      const relatedInvoice = invoices.find((inv) => inv.id === o.invoiceId);
      // Ensure required properties are present to match the Order type
      const order: Order = {
        ...(o as any),
        id: o.id,
        maskedId: maskedId,
        customer: customerData,
        invoiceId: relatedInvoice?.id,
        invoiceMaskedId: relatedInvoice?.maskedId,
        items: o.items as any, // Cast items to avoid strict type mismatch if defined differently
        date:
          o.date instanceof Timestamp
            ? o.date.toDate().toISOString()
            : String(o.date),
        deliveryDate:
          o.deliveryDate instanceof Timestamp
            ? o.deliveryDate.toDate().toISOString().split('T')[0]
            : String(o.deliveryDate),
      };
      return order;
    })
    .filter((order): order is Order => order !== null)
    .sort((a, b) => {
      try {
        const aDate = Date.parse(a.deliveryDate);
        const bDate = Date.parse(b.deliveryDate);
        return bDate - aDate;
      } catch (e) {
        return 0;
      }
    });

  const inventory: InventoryItem[] = inventoryData || [];

  const purchaseOrders: PurchaseOrder[] = (purchaseOrdersData || []).map((po, index) => ({
    ...po,
    id: po.id,
    maskedId: `PO-${index + 1}`,
    orderDate: po.orderDate instanceof Timestamp ? po.orderDate.toDate().toISOString() : String(po.orderDate),
    expectedDate: po.expectedDate instanceof Timestamp ? po.expectedDate.toDate().toISOString() : String(po.expectedDate),
  }));

  const timesheetEntries: TimesheetEntry[] = (timesheetData || []).map(
    (entry) => {
      let duration;
      if (entry.endTime) {
        duration = formatDistanceStrict(
          entry.endTime.toDate(),
          entry.startTime.toDate()
        );
      }
      return {
        ...entry,
        duration,
      };
    }
  );

  const roles: Role[] = useMemo(() => {
    const userCounts: Record<string, number> = {};
    if (membershipsData) {
      for (const membership of membershipsData) {
        userCounts[membership.roleId] = (userCounts[membership.roleId] || 0) + 1;
      }
    }
    return rolesData?.map(role => ({ ...role, userCount: userCounts[role.id] || 0 })) || [];
  }, [rolesData, membershipsData]);

  const memberships: Membership[] = useMemo(() => {
    const rolesMap = new Map(rolesData?.map(r => [r.id, r.name]));
    return (
      membershipsData?.map((m) => {
        return {
          ...m,
          roleName: rolesMap.get(m.roleId) || 'Unknown Role',
        };
      }) || []
    );
  }, [membershipsData, rolesData]);

  const [transferOrders, setTransferOrders] = useState<TransferOrder[]>([]);
  const transferOrdersCollectionRef = useMemoFirebase(
    () => (firestore && accountId ? collection(firestore, getTransferOrdersCollection(accountId)) : null),
    [firestore, accountId]
  );
  const { data: rawTransferOrders } = useCollection<FirestoreTransferOrder>(transferOrdersCollectionRef);

  useEffect(() => {
    if (rawTransferOrders) {
      const loadedOps: TransferOrder[] = rawTransferOrders.map(d => ({
        ...d,
        id: d.id,
        maskedId: d.maskedId,
        createdAt: d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : String(d.createdAt),
        completedAt: d.completedAt instanceof Timestamp ? d.completedAt.toDate().toISOString() : (d.completedAt || null),
      } as TransferOrder));
      // Filter by store context IF needed.
      // For Transfers, seeing incoming/outgoing for the active store is useful.
      // Or seeing all if "All" was an option (removed now).

      if (activeStore) {
        const filtered = loadedOps.filter(
          op => op.fromStoreId === activeStore.id || op.toStoreId === activeStore.id
        );
        setTransferOrders(filtered);
      } else {
        // If no store active (edge case), show none or all?
        // Logic enforces active store, but good to be safe.
        // Let's show all if for some reason activeStore is null
        setTransferOrders(loadedOps);
      }
    }
  }, [rawTransferOrders, activeStore]);

  // Inventory Helper
  const getInventoryItemRef = (accountId: string, itemId: string) =>
    doc(firestore!, getInventoryCollection(accountId), itemId);

  const addTransferOrder = async (orderData: Omit<TransferOrder, 'id' | 'maskedId' | 'status' | 'createdAt' | 'completedAt'>) => {
    if (!accountId || !firestore) return '';

    const batch = writeBatch(firestore);

    // 1. Generate ID and Ref
    const newDocRef = doc(collection(firestore, getTransferOrdersCollection(accountId)));
    const maskedId = `TO-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Prepare Transfer Document
    const transferOrder: FirestoreTransferOrder = {
      ...orderData,
      id: newDocRef.id,
      maskedId: maskedId,
      status: 'PENDING',
      createdAt: serverTimestamp() as unknown as Timestamp,
      completedAt: null,
    };

    // 3. Deduct Inventory from Source Store (Optimistic / Batch)
    // IMPORTANT: For strict consistency, we should use runTransaction.
    // However, hooks + transaction is complex. Use transaction for the whole operation.

    try {
      await runTransaction(firestore, async (transaction) => {
        // Check sufficiency first
        for (const item of orderData.items) {
          const itemRef = getInventoryItemRef(accountId, item.inventoryItemId);
          const itemDoc = await transaction.get(itemRef);
          if (!itemDoc.exists()) throw new Error(`Item ${item.name} not found`);

          const data = itemDoc.data();
          const currentStock = (data as any).stock || (data as any).quantity || 0;
          if (currentStock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name} in source store.`);
          }

          // Deduct
          transaction.update(itemRef, { quantity: currentStock - item.quantity });
        }

        // Create Transfer Order
        transaction.set(newDocRef, transferOrder);
      });

      toast({ title: 'Transfer Created', description: `Transfer ${maskedId} created successfully.` });
      return newDocRef.id;

    } catch (e: any) {
      console.error("Transfer Error", e);
      toast({ variant: 'destructive', title: 'Transfer Failed', description: e.message });
      throw e;
    }
  };


  const handleCompleteTransfer = async (orderId: string) => {
    if (!accountId || !firestore) return;

    // 1. Fetch Order
    const orderSnap = await getDoc(doc(firestore, getTransferOrdersCollection(accountId), orderId));
    if (!orderSnap.exists()) {
      toast({ variant: 'destructive', title: 'Transfer Failed', description: 'Transfer order not found.' });
      return;
    }
    const order = orderSnap.data() as FirestoreTransferOrder;

    // 2. Fetch Destination Inventory to find matches
    // (Inefficient for huge inventory, but ok for now)
    // Ideally we query by SKU for each item.
    // Let's try to find matches by SKU.

    const itemsToProcess: {
      transferItem: { inventoryItemId: string; name: string; quantity: number }; // Explicit type
      sourceDetails: FirestoreInventoryItem;
      targetId: string | null;
      isNew: boolean;
    }[] = [];

    for (const item of order.items) {
      // Get source item details (to get SKU/Cost etc)
      const sourceItemSnap = await getDoc(doc(firestore, getInventoryCollection(accountId), item.inventoryItemId));
      const sourceItem = sourceItemSnap.data() as FirestoreInventoryItem;

      if (!sourceItem) {
        console.warn(`Source item ${item.inventoryItemId} not found for transfer ${orderId}. Skipping.`);
        continue; // Skip if source gone?
      }

      // Find match in destination
      // We can use a query here.
      const q = query(
        collection(firestore, getInventoryCollection(accountId)),
        where('storeId', '==', order.toStoreId),
        where('sku', '==', sourceItem.sku)
      );
      const querySnap = await getDocs(q);

      let targetId = null;
      let isNew = false;

      if (!querySnap.empty) {
        targetId = querySnap.docs[0].id;
      } else {
        // Need to create new item in destination
        isNew = true;
      }

      itemsToProcess.push({
        transferItem: item,
        sourceDetails: sourceItem,
        targetId,
        isNew
      });
    }

    // 3. Run Transaction
    try {
      await runTransaction(firestore, async (transaction) => {
        const orderRef = doc(firestore, getTransferOrdersCollection(accountId), orderId);
        const sfOrder = await transaction.get(orderRef);
        if (!sfOrder.exists()) throw "Order does not exist!";
        if (sfOrder.data().status !== 'PENDING') throw "Order not pending!";

        for (const p of itemsToProcess) {
          if (p.isNew) {
            // Create new doc ref
            const newRef = doc(collection(firestore, getInventoryCollection(accountId)));
            transaction.set(newRef, {
              ...p.sourceDetails,
              id: newRef.id, // Ensure ID is set for the new document
              storeId: order.toStoreId,
              stock: p.transferItem.quantity, // Init with transferred qty
              location: '', // Clear specific shelf location?
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else if (p.targetId) {
            const targetRef = doc(firestore, getInventoryCollection(accountId), p.targetId);
            const targetDoc = await transaction.get(targetRef);
            const current = targetDoc.data()?.stock || 0; // Assuming 'stock' field
            transaction.update(targetRef, { stock: current + p.transferItem.quantity, updatedAt: serverTimestamp() });
          }
        }

        transaction.update(orderRef, {
          status: 'COMPLETED',
          // @ts-ignore
          completedAt: serverTimestamp()
        });
      });
      toast({ title: 'Transfer Received', description: 'Inventory has been updated.' });
    } catch (e: any) {
      console.error("Transaction failed: ", e);
      toast({ variant: 'destructive', title: 'Transfer Failed', description: e.message || 'Could not complete transfer.' });
    }
  };


  const cancelTransferOrder = async (orderId: string) => {
    if (!accountId || !firestore) return;

    try {
      await runTransaction(firestore, async (transaction) => {
        const orderRef = doc(firestore, getTransferOrdersCollection(accountId), orderId);
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists() || orderDoc.data().status !== 'PENDING') throw "Invalid transfer status or order not found.";

        const order = orderDoc.data() as FirestoreTransferOrder;

        // Return stock to source
        for (const item of order.items) {
          const itemRef = doc(firestore, getInventoryCollection(accountId), item.inventoryItemId);
          const itemSnap = await transaction.get(itemRef);
          if (itemSnap.exists()) {
            const data = itemSnap.data();
            const current = (data as any).quantity || 0;
            // @ts-ignore
            transaction.update(itemRef, { quantity: current + item.quantity, updatedAt: serverTimestamp() });
          }
          // If source item deleted, we might lose stock tracking. Edge case.
        }

        // @ts-ignore
        transaction.update(orderRef, { status: 'CANCELLED', completedAt: serverTimestamp() });
      });
      toast({ title: 'Transfer Cancelled', description: 'Stock returned to source.' });
    } catch (e: any) {
      console.error("Transaction failed: ", e);
      toast({ variant: 'destructive', title: 'Transfer Failed', description: e.message || 'Could not cancel transfer.' });
    }
  };

  return (
    <AppContext.Provider
      value={{
        userProfile: userProfileData as UserProfile,
        updateUserProfile,
        customers,
        isCustomersLoading,
        addCustomer,
        updateCustomer,
        orders,
        addOrder,
        updateOrder,
        deleteOrders,
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoices,
        inventory,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItems,
        purchaseOrders,
        addPurchaseOrder,
        updatePurchaseOrder,
        receivePurchaseOrderItems,
        timesheetEntries,
        activeTimesheet,
        clockIn,
        clockOut,
        roles,
        addRole,
        updateRole,
        memberships,
        addUser,
        deleteMembership,
        permissions,
        stores,
        activeStore,
        setActiveStore,
        addStore,
        deleteStore,
        transferOrders,
        addTransferOrder,
        completeTransferOrder: handleCompleteTransfer,
        cancelTransferOrder
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
