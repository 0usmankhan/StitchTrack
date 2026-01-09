import type { Order, KpiData, InventoryItem, Invoice, Customer } from './types';
import { PlaceHolderImages } from './placeholder-images';

const customerAvatars = PlaceHolderImages.filter((img) =>
  img.id.startsWith('avatar')
);

const getRandomAvatar = () => {
  return customerAvatars[Math.floor(Math.random() * customerAvatars.length)];
};

export const orders: Order[] = [
  {
    id: '#3210',
    customer: {
      name: 'Olivia Martin',
      email: 'olivia.martin@email.com',
      avatar: getRandomAvatar().imageUrl,
      imageHint: getRandomAvatar().imageHint,
    },
    type: 'Order',
    stitchTypes: 'Chain Stitch, Lock Stitch',
    materials: 'Cotton, Silk Thread',
    deliveryDate: '2024-08-15',
    status: 'In Progress',
    amount: 150.0,
    completionTimestamps: {
      designComplete: '2024-07-20T10:00:00Z',
    },
  },
  {
    id: '#3209',
    customer: {
      name: 'Jackson Lee',
      email: 'jackson.lee@email.com',
      avatar: getRandomAvatar().imageUrl,
      imageHint: getRandomAvatar().imageHint,
    },
    type: 'Repair',
    stitchTypes: 'Zigzag Stitch',
    materials: 'Denim Patch',
    deliveryDate: '2024-08-10',
    status: 'Completed',
    amount: 45.5,
    damageDescription: 'Torn knee on jeans.',
    repairInstructions: 'Reinforce with a matching denim patch.',
    completionTimestamps: {
      designComplete: '2024-07-18T10:00:00Z',
      stitchingComplete: '2024-07-19T14:30:00Z',
      qualityCheckComplete: '2024-07-19T16:00:00Z',
    },
  },
  {
    id: '#3208',
    customer: {
      name: 'Ava Garcia',
      email: 'ava.garcia@email.com',
      avatar: getRandomAvatar().imageUrl,
      imageHint: getRandomAvatar().imageHint,
    },
    type: 'Order',
    stitchTypes: 'Satin Stitch',
    materials: 'Linen, Embroidery Floss',
    deliveryDate: '2024-08-25',
    status: 'Placed',
    amount: 280.0,
  },
  {
    id: '#3207',
    customer: {
      name: 'Noah Taylor',
      email: 'noah.taylor@email.com',
      avatar: getRandomAvatar().imageUrl,
      imageHint: getRandomAvatar().imageHint,
    },
    type: 'Order',
    stitchTypes: 'Cross Stitch',
    materials: 'Aida cloth, Cotton Floss',
    deliveryDate: '2024-09-01',
    status: 'Placed',
    amount: 95.75,
  },
  {
    id: '#3206',
    customer: {
      name: 'Sophia Rodriguez',
      email: 'sophia.rodriguez@email.com',
      avatar: getRandomAvatar().imageUrl,
      imageHint: getRandomAvatar().imageHint,
    },
    type: 'Shipped',
    stitchTypes: 'Backstitch',
    materials: 'Wool, Yarn',
    deliveryDate: '2024-07-30',
    status: 'Shipped',
    amount: 210.2,
    completionTimestamps: {
      designComplete: '2024-07-15T10:00:00Z',
      stitchingComplete: '2024-07-18T14:30:00Z',
      qualityCheckComplete: '2024-07-19T16:00:00Z',
    },
  },
  {
    id: '#3205',
    customer: {
      name: 'Liam Hernandez',
      email: 'liam.hernandez@email.com',
      avatar: getRandomAvatar().imageUrl,
      imageHint: getRandomAvatar().imageHint,
    },
    type: 'Repair',
    stitchTypes: 'Blind Hem Stitch',
    materials: 'Matching Thread',
    deliveryDate: '2024-08-05',
    status: 'In Progress',
    amount: 30.0,
    damageDescription: 'Fallen hem on trousers.',
    repairInstructions: 'Re-stitch hem neatly.',
    completionTimestamps: {
      designComplete: '2024-07-21T11:00:00Z',
    },
  },
];

export const kpiData: KpiData = {
  productSales: { value: 12, change: 5.5 },
  pendingRepairs: { value: 5, change: -15.2 },
  totalRevenue: { value: 4850.35, change: 8.2 },
  lowStockItems: { value: 3, change: 0 },
};

export const chartData = [
  { month: 'Jan', orders: 12, repairs: 5 },
  { month: 'Feb', orders: 19, repairs: 7 },
  { month: 'Mar', orders: 15, repairs: 4 },
  { month: 'Apr', orders: 22, repairs: 10 },
  { month: 'May', orders: 25, repairs: 8 },
  { month: 'Jun', orders: 24, repairs: 6 },
];

const inventoryImages = PlaceHolderImages.filter((img) =>
  img.id.startsWith('product')
);

const getRandomInventoryImage = () => {
  if (inventoryImages.length === 0) {
    // Fallback if no product images are defined
    const randomSeed = Math.floor(Math.random() * 1000);
    return {
      imageUrl: `https://picsum.photos/seed/${randomSeed}/400/400`,
      imageHint: 'product image',
    };
  }
  return inventoryImages[
    Math.floor(Math.random() * inventoryImages.length)
  ];
};

export const inventory: InventoryItem[] = [
  {
    id: 'INV001',
    name: 'Premium Cotton Thread',
    stock: 120,
    reorderLevel: 50,
    category: 'Threads',
    supplier: 'Stitch Co.',
    imageUrl: getRandomInventoryImage().imageUrl,
    imageHint: 'thread spool',
  },
  {
    id: 'INV002',
    name: 'Satin Embroidery Floss',
    stock: 45,
    reorderLevel: 50,
    category: 'Threads',
    supplier: 'Glamour Stitches',
    imageUrl: getRandomInventoryImage().imageUrl,
    imageHint: 'embroidery floss',
  },
  {
    id: 'INV003',
    name: 'Denim Repair Patch',
    stock: 75,
    reorderLevel: 30,
    category: 'Notions',
    supplier: 'Durable Denim',
    imageUrl: getRandomInventoryImage().imageUrl,
    imageHint: 'denim patch',
  },
  {
    id: 'INV004',
    name: 'Assorted Buttons',
    stock: 200,
    reorderLevel: 100,
    category: 'Notions',
    supplier: 'Button Bonanza',
    imageUrl: getRandomInventoryImage().imageUrl,
    imageHint: 'colorful buttons',
  },
  {
    id: 'INV005',
    name: '14-Count Aida Cloth',
    stock: 30,
    reorderLevel: 20,
    category: 'Fabrics',
    supplier: 'Fabric World',
    imageUrl: getRandomInventoryImage().imageUrl,
    imageHint: 'aida cloth',
  },
  {
    id: 'INV006',
    name: 'Heavy Duty Needles',
    stock: 150,
    reorderLevel: 75,
    category: 'Tools',
    supplier: 'Sharp Point Inc.',
    imageUrl: getRandomInventoryImage().imageUrl,
    imageHint: 'sewing needles',
  },
];

export const invoices: Invoice[] = [
  {
    id: 'INV-2024-001',
    customer: {
      name: 'Olivia Martin',
      email: 'olivia.martin@email.com',
      avatar: getRandomAvatar().imageUrl,
      imageHint: getRandomAvatar().imageHint,
    },
    date: '2024-07-20',
    dueDate: '2024-08-19',
    status: 'Paid',
    items: [
      { id: 'item1', name: 'Custom Stitch Order', quantity: 1, price: 150.0, total: 150.0 },
    ],
    subtotal: 150.0,
    tax: 12.0,
    total: 162.0,
  },
  {
    id: 'INV-2024-002',
    customer: {
      name: 'Jackson Lee',
      email: 'jackson.lee@email.com',
      avatar: getRandomAvatar().imageUrl,
      imageHint: getRandomAvatar().imageHint,
    },
    date: '2024-07-19',
    dueDate: '2024-08-18',
    status: 'Pending',
    items: [
      { id: 'item1', name: 'Jeans Repair', quantity: 1, price: 45.5, total: 45.5 },
      { id: 'item2', name: 'Denim Repair Patch', quantity: 1, price: 3.99, total: 3.99 },
    ],
    subtotal: 49.49,
    tax: 3.96,
    total: 53.45,
  },
  {
    id: 'INV-2024-003',
    customer: {
      name: 'Sophia Rodriguez',
      email: 'sophia.rodriguez@email.com',
      avatar: getRandomAvatar().imageUrl,
      imageHint: getRandomAvatar().imageHint,
    },
    date: '2024-07-19',
    dueDate: '2024-08-18',
    status: 'Paid',
    items: [
      { id: 'item1', name: 'Wool Yarn', quantity: 5, price: 10.0, total: 50.0 },
      { id: 'item2', name: 'Custom Order', quantity: 1, price: 160.2, total: 160.2 },
    ],
    subtotal: 210.2,
    tax: 16.82,
    total: 227.02,
  },
];
