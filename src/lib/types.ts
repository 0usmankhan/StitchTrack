import { Timestamp, DocumentReference } from 'firebase/firestore';

export type OrderStatus =
  | 'Placed'
  | 'In Progress'
  | 'Completed'
  | 'Shipped';

export type WithId<T> = T & { id: string };

// Base types that are stored in Firestore

export interface FirestoreAccount {
  name: string;
  ownerId: string;
}

export type Permission = {
  read: boolean;
  write: boolean;
  delete: boolean;
};

export type PermissionsMap = {
  orders: Permission;
  inventory: Permission;
  reports: Permission;
  users: Permission;
  pos: Permission;
  repairs: Permission;
  customers: Permission;
  invoices: Permission;
  settings: Permission;
  customization: Permission;
  purchaseOrders: Permission;
};

export interface FirestoreRole {
  name: string;
  hierarchy: number;
  isDefault?: boolean;
  permissions: PermissionsMap;
}

export interface FirestoreMembership {
  invitedBy: string;
  status: 'invited' | 'accepted' | 'disabled';
  roleId: string;
  email: string;
  displayName: string;
}

export interface FirestoreInvitation {
  accountId: string;
  invitedEmail: string;
  invitedBy: string;
  roleId: string;
  status: 'pending' | 'accepted' | 'expired';
  type: 'google' | 'manual';
  createdAt: Timestamp;
  expiresAt: Timestamp;
  acceptToken: string;
  acceptedAt?: Timestamp;
}

export type SalaryType = 'HOURLY' | 'SALARY';

export interface FirestoreUserProfile {
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  accessPin?: string;
  pinSetAt?: Timestamp;
  salaryType?: SalaryType;
  hourlyRate?: number;
  baseSalary?: number;
  associatedAccountId?: string;
}


export interface FirestoreCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  avatar: string;
  imageHint: string;
}

export type FulfillmentStatus = 'Fulfilled' | 'Backordered' | 'Returned';

export interface OrderItem {
  id: string;
  name: string;
  details?: string;
  materials: { id: string; name: string }[];
  price: number;
  quantity: number;
  fulfillmentStatus?: FulfillmentStatus;
}


export interface FirestoreOrder {
  customerId: string;
  invoiceId?: string; // Link to the invoice
  type: 'Order' | 'Repair' | 'Shipped';
  stitchTypes?: string;
  materials?: string; // Comma-separated list of material names
  deliveryDate: Timestamp | string;
  status: OrderStatus;
  amount: number;
  damageDescription?: string;
  repairInstructions?: string;
  materialCost?: number;
  materialIds?: string[]; // Array of inventory item IDs
  items?: OrderItem[];
  completionTimestamps?: {
    designComplete?: string;
    stitchingComplete?: string;
    qualityCheckComplete?: string;
  };
}

export interface InvoiceItem {
  id: string; // This can be an inventory ID or a unique ID for a custom item/repair
  orderId?: string; // Link back to the original order document
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface FirestoreInvoice {
  customerId: string;
  date: Timestamp | string;
  dueDate: Timestamp | string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  deposit?: number;
  amountDue?: number;
  paymentMethod?: string;
}

export interface FirestoreInventoryItem {
  name: string;
  stock: number;
  onOrder?: number;
  reorderLevel: number;
  category: string;
  supplier: string;
  imageUrl: string;
  imageHint: string;
  retailPrice: number;
  costPrice: number;
  showInPOS?: boolean;
}

export interface FirestoreTimesheetEntry {
  userId: string;
  startTime: Timestamp;
  endTime?: Timestamp | null;
  notes?: string;
}

export interface PurchaseOrderItem {
  inventoryItemId: string;
  name: string;
  quantity: number;
  cost: number;
  receivedQuantity?: number;
}

export interface ReceptionItem {
  inventoryItemId: string;
  name: string;
  quantityReceived: number;
}

export interface Reception {
  id: string;
  date: Timestamp | string;
  items: ReceptionItem[];
  notes?: string;
}

export type PurchaseOrderStatus = 'Draft' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';

export interface FirestorePurchaseOrder {
  supplier: string;
  orderDate: Timestamp | string;
  expectedDate: Timestamp | string;
  status: PurchaseOrderStatus;
  totalCost: number;
  items: PurchaseOrderItem[];
  receptions?: Reception[];
}


// Types that are used in the application UI, often combining Firestore data
export type Account = WithId<FirestoreAccount>;
export type Role = WithId<FirestoreRole> & { userCount: number };
export type Membership = WithId<FirestoreMembership> & { roleName: string };
export type Invitation = WithId<FirestoreInvitation>;
export type UserProfile = WithId<FirestoreUserProfile>;

export type Customer = WithId<FirestoreCustomer> & {
  name: string;
};


export type Order = WithId<FirestoreOrder> & {
  customer: Omit<Customer, 'totalOrders' | 'totalSpent'>;
  maskedId: string;
  invoiceId?: string;
  invoiceMaskedId?: string;
  items?: WithId<OrderItem>[];
  deliveryDate: string;
};

export type Invoice = WithId<FirestoreInvoice> & {
  customer: Omit<Customer, 'totalOrders' | 'totalSpent'>;
  maskedId: string;
};

export type PurchaseOrder = WithId<FirestorePurchaseOrder> & {
  maskedId: string;
}


export type KpiData = {
  totalRevenue: {
    value: number;
    change: number;
  };
  totalProfit?: {
    value: number;
    change: number;
  };
  productSales?: {
    value: number;
    change: number;
  };
  pendingRepairs: {
    value: number;
    change: number;
  };
  lowStockItems?: {
    value: number;
    change: number;
  };
  stitchingOrders?: {
    value: number;
    change: number;
  };
  totalCustomers?: {
    value: number;
    change: number;
  };
};

export type InventoryItem = WithId<FirestoreInventoryItem>;

export type TimesheetEntry = WithId<FirestoreTimesheetEntry> & {
  duration?: string;
};

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue' | 'Partially Paid';

export interface AppContextType {
  userProfile: UserProfile | null;
  updateUserProfile: (profile: Partial<FirestoreUserProfile>) => void;
  customers: Customer[];
  isCustomersLoading: boolean;
  addCustomer: (
    customer: Omit<FirestoreCustomer, 'totalOrders' | 'totalSpent'>
  ) => void;
  updateCustomer: (
    customerId: string,
    customer: Partial<FirestoreCustomer>
  ) => void;
  orders: Order[];
  addOrder: (
    order: Omit<FirestoreOrder, 'id'>
  ) => Promise<DocumentReference | undefined>;
  updateOrder: (orderId: string, order: Partial<FirestoreOrder>) => void;
  deleteOrders: (orderIds: string[]) => void;
  invoices: Invoice[];
  addInvoice: (invoice: Omit<FirestoreInvoice, 'id'>) => Promise<string>;
  updateInvoice: (
    invoiceId: string,
    invoice: Partial<FirestoreInvoice>
  ) => void;
  deleteInvoices: (invoiceIds: string[]) => void;
  inventory: InventoryItem[];
  addInventoryItem: (item: FirestoreInventoryItem) => void;
  updateInventoryItem: (
    itemId: string,
    item: Partial<FirestoreInventoryItem>
  ) => void;
  deleteInventoryItems: (itemIds: string[]) => void;
  purchaseOrders: PurchaseOrder[];
  addPurchaseOrder: (po: Omit<FirestorePurchaseOrder, 'id'>) => Promise<string>;
  updatePurchaseOrder: (poId: string, po: Partial<FirestorePurchaseOrder>) => void;
  receivePurchaseOrderItems: (poId: string, receivedItems: { inventoryItemId: string, name: string, quantityReceived: number }[], notes?: string) => void;
  timesheetEntries: TimesheetEntry[];
  activeTimesheet: TimesheetEntry | null;
  clockIn: () => void;
  clockOut: (entryId: string, notes: string) => void;
  roles: Role[];
  addRole: (roleName: string) => void;
  updateRole: (roleId: string, data: Partial<FirestoreRole>) => void;
  memberships: Membership[];
  addUser: (
    email: string,
    password_DO_NOT_USE: string,
    roleId: string,
    displayName: string,
    pin?: string,
    salaryType?: SalaryType,
    salaryAmount?: number
  ) => void;
  deleteMembership: (membershipId: string) => void;
  permissions: PermissionsMap;
}
