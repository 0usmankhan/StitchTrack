'use client';
import { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, cn } from '@/lib/utils';
import {
  PlusCircle,
  Search,
  Plus,
  X,
  Wrench,
  ShoppingBag,
  Shirt,
  CreditCard,
  DollarSign,
  ArrowLeft,
  ImageIcon,
  QrCode,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useSettings } from '@/context/settings-context';
import { useApp } from '@/context/app-context';
import type { Customer, Order, Invoice, InvoiceItem, FirestoreCustomer, FirestoreOrder, FirestoreInvoice, InventoryItem as InventoryItemType, OrderItem } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Timestamp } from 'firebase/firestore';
import { MaterialSearch } from '@/components/MaterialSearch';
import { CustomerInvoiceSearch } from '@/components/CustomerInvoiceSearch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { PrintableReceipt } from '@/components/printable-receipt';
import { StandardInvoice } from '@/components/standard-invoice';
import { Printer } from 'lucide-react';

type CartItem = {
  id: string; // Inventory ID for products, unique ID for repairs/orders
  name: string;
  price: number;
  qty: number;
  type: 'Product' | 'Repair' | 'StitchOrder';
  details?: string;
  materials: { id: string; name: string }[];
  materialId?: string; // To track inventory item used as material for stitch orders
};

type PaymentMethod = 'Card' | 'Cash';

const customerAvatars = PlaceHolderImages.filter((img) =>
  img.id.startsWith('avatar')
);

const getRandomAvatar = () => {
  return customerAvatars[Math.floor(Math.random() * customerAvatars.length)];
};


export default function PosPage() {
  const { toast } = useToast();
  const { taxRate, taxName } = useSettings();
  const { addCustomer, addOrder, updateInvoice, addInvoice, inventory, updateInventoryItem, invoices, updateOrder } = useApp();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [repairDetails, setRepairDetails] = useState<{
    name: string;
    details: string;
    price: string;
    materials: { id: string; name: string }[];
  }>({
    name: '',
    details: '',
    price: '',
    materials: [],
  });
  const [stitchOrderDetails, setStitchOrderDetails] = useState({
    name: '',
    measurements: '',
    materials: '',
    price: '',
    materialId: ''
  });
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // New State for Success Dialog
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);

  const receiptRef = useRef(null);
  const standardInvoiceRef = useRef(null);

  const handlePrintReceipt = useReactToPrint({
    content: () => receiptRef.current,
    pageStyle: `
      @page { size: 80mm auto; margin: 0mm; } 
      @media print { body { -webkit-print-color-adjust: exact; font-family: "Source Code Pro", monospace; } }
    `,
  });

  const handlePrintInvoice = useReactToPrint({
    content: () => standardInvoiceRef.current,
    documentTitle: `Invoice-${lastInvoice?.maskedId}`,
  });

  const [newCustomer, setNewCustomer] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [currentCustomer, setCurrentCustomer] = useState<Omit<Customer, 'totalOrders' | 'totalSpent'> | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [amountPaid, setAmountPaid] = useState('');
  const [changeDue, setChangeDue] = useState(0);

  const cartSubTotal = cart.reduce(
    (total, item) => total + item.price * item.qty,
    0
  );
  const tax = cartSubTotal * taxRate;
  const cartTotal = cartSubTotal + tax;
  const amountDue = activeInvoice ? activeInvoice.amountDue || 0 : cartTotal;

  useEffect(() => {
    if (isCheckoutDialogOpen) {
      setAmountPaid(amountDue.toFixed(2));
    } else {
      setPaymentMethod(null);
      setChangeDue(0);
    }
  }, [isCheckoutDialogOpen, amountDue]);

  useEffect(() => {
    const paid = parseFloat(amountPaid);
    if (paymentMethod === 'Cash' && !isNaN(paid) && paid > amountDue) {
      setChangeDue(paid - amountDue);
    } else {
      setChangeDue(0);
    }
  }, [amountPaid, amountDue, paymentMethod]);

  const handleAddToCart = (product: {
    id: string;
    name: string;
    price: number;
    stock: number;
  }) => {
    const existingCartItem = cart.find(item => item.id === product.id && item.type === 'Product');

    setCart((prevCart) => {
      if (existingCartItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...product, qty: 1, type: 'Product', materials: [] }];
    });
    toast({
      title: 'Item Added',
      description: `${product.name} has been added to the cart.`,
    });
  };

  const handleAddRepairToCart = () => {
    if (!repairDetails.name || !repairDetails.price) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a repair name and price.',
      });
      return;
    }

    for (const material of repairDetails.materials) {
      const materialItem = inventory.find(item => item.id === material.id);
      if (!materialItem || materialItem.stock <= 0) {
        toast({
          variant: "destructive",
          title: "Material Out of Stock",
          description: `Cannot use "${material.name}". Please adjust inventory.`,
        });
        return;
      }
    }

    const repairItem: CartItem = {
      id: `repair-${Date.now()}`,
      name: `Repair: ${repairDetails.name}`,
      details: repairDetails.details,
      materials: repairDetails.materials,
      price: parseFloat(repairDetails.price),
      qty: 1,
      type: 'Repair',
    };
    setCart((prevCart) => [...prevCart, repairItem]);
    setRepairDetails({ name: '', details: '', price: '', materials: [] });
    toast({
      title: 'Repair Added',
      description: `${repairItem.name} has been added to the cart.`,
    });
  };

  const handleAddStitchOrderToCart = () => {
    if (!stitchOrderDetails.name || !stitchOrderDetails.price) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description:
          'Please provide an item name and price for the stitch order.',
      });
      return;
    }

    if (stitchOrderDetails.materialId) {
      const materialItem = inventory.find(item => item.id === stitchOrderDetails.materialId);
      if (!materialItem || materialItem.stock <= 0) {
        toast({
          variant: "destructive",
          title: "Material Out of Stock",
          description: `Cannot use "${stitchOrderDetails.materials}". Please adjust inventory.`,
        });
        return;
      }
    }

    const stitchOrderItem: CartItem = {
      id: `stitch-${Date.now()}`,
      name: `Custom: ${stitchOrderDetails.name}`,
      details: `Measurements: ${stitchOrderDetails.measurements}`,
      materials: stitchOrderDetails.materials ? [{ id: stitchOrderDetails.materialId, name: stitchOrderDetails.materials }] : [],
      materialId: stitchOrderDetails.materialId,
      price: parseFloat(stitchOrderDetails.price),
      qty: 1,
      type: 'StitchOrder',
    };
    setCart((prevCart) => [...prevCart, stitchOrderItem]);
    setStitchOrderDetails({
      name: '',
      measurements: '',
      materials: '',
      price: '',
      materialId: ''
    });
    toast({
      title: 'Stitch Order Added',
      description: `Custom order for ${stitchOrderDetails.name} has been added to the cart.`,
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    if (activeInvoice) return; // Prevent modification when paying an invoice
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const handleUpdateCartQuantity = (itemId: string, newQty: number) => {
    if (activeInvoice) return;

    if (newQty < 1) {
      handleRemoveFromCart(itemId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, qty: newQty } : item
      )
    );
  };

  const handleSaveCustomer = () => {
    if (activeInvoice) return;
    if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.email) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description:
          'Please enter first name, last name, and email for the customer.',
      });
      return;
    }

    const randomAvatar = getRandomAvatar();
    const newCustomerData: Omit<FirestoreCustomer, 'totalOrders' | 'totalSpent'> = {
      firstName: newCustomer.firstName,
      lastName: newCustomer.lastName,
      email: newCustomer.email,
      phone: newCustomer.phone,
      avatar: randomAvatar.imageUrl,
      imageHint: randomAvatar.imageHint,
    };

    addCustomer(newCustomerData);

    const tempCustomer: Omit<Customer, 'totalOrders' | 'totalSpent'> = {
      id: 'temp-' + Date.now(),
      ...newCustomerData,
      name: `${newCustomer.firstName} ${newCustomer.lastName}`,
    }
    setCurrentCustomer(tempCustomer);

    setNewCustomer({ firstName: '', lastName: '', email: '', phone: '' });
    setIsCustomerDialogOpen(false);
    toast({
      title: 'Customer Saved',
      description: `${tempCustomer.name} has been added to the order.`,
    });
  };

  const resetPos = () => {
    setCart([]);
    setCurrentCustomer(null);
    setPaymentMethod(null);
    setIsCheckoutDialogOpen(false);
    setActiveInvoice(null);
    setAmountPaid('');
  };


  const processOrder = async (paidAmount: number, finalPaymentMethod?: PaymentMethod) => {
    // The amount to be credited to the invoice, capped at the amount due.
    const creditedAmount = Math.min(paidAmount, amountDue);

    if (activeInvoice) { // This is a payment for an existing invoice
      const existingInvoice = invoices.find(inv => inv.id === activeInvoice.id);
      if (existingInvoice) {
        const newTotalPaid = (existingInvoice.deposit || 0) + creditedAmount;
        const newAmountDue = existingInvoice.total - newTotalPaid;
        let newStatus: 'Paid' | 'Pending' | 'Partially Paid' | 'Overdue' = existingInvoice.status;

        if (newAmountDue <= 0) {
          newStatus = 'Paid';
        } else if (newTotalPaid > 0) {
          newStatus = 'Partially Paid';
        }

        const updatePayload: Partial<FirestoreInvoice> = {
          status: newStatus,
          deposit: newTotalPaid,
          amountDue: newAmountDue,
        };

        if (finalPaymentMethod) {
          updatePayload.paymentMethod = finalPaymentMethod;
        }

        updateInvoice(activeInvoice.id, updatePayload);
        return { ...existingInvoice, ...updatePayload } as Invoice;
      }
      // If we are paying a non-existent invoice (should theoretically not happen if activeInvoice is set)
      return null;
    }

    if (cart.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Cart is empty',
        description: 'Add items to the cart before creating an order.',
      });
      return false;
    }

    // Final stock check before processing
    for (const item of cart) {
      if (item.type === 'Product') {
        const inventoryItem = inventory.find(invItem => invItem.id === item.id);
      } else if (item.materials) {
        for (const material of item.materials) {
          const materialItem = inventory.find(invItem => invItem.id === material.id);
          if (materialItem && materialItem.stock < 1) { // Assuming 1 unit per material
            toast({
              variant: 'destructive',
              title: 'Processing Failed: Material Out of Stock',
              description: `"${materialItem.name}" is out of stock.`,
            });
            return null;
          }
        }
      }
    }


    const customerIdForOrder = currentCustomer?.id || 'walk-in';
    const invoiceItems: InvoiceItem[] = [];
    const orderCreationPromises: Promise<{ cartItemId: string, orderId: string | undefined }>[] = [];

    // Group repairs
    const repairItems = cart.filter(item => item.type === 'Repair');
    const nonRepairItems = cart.filter(item => item.type !== 'Repair');

    if (repairItems.length > 0) {
      const totalRepairAmount = repairItems.reduce((sum, item) => sum + item.price * item.qty, 0);
      const allMaterials = repairItems.flatMap(item => item.materials);
      const allMaterialIds = [...new Set(allMaterials.map(m => m.id))];
      const allMaterialNames = [...new Set(allMaterials.map(m => m.name))].join(', ');
      const totalMaterialCost = allMaterialIds.reduce((sum, id) => {
        const invItem = inventory.find(i => i.id === id);
        return sum + (invItem?.costPrice || 0);
      }, 0);

      allMaterialIds.forEach(id => {
        const invItem = inventory.find(i => i.id === id);
        if (invItem) updateInventoryItem(id, { stock: invItem.stock - 1 });
      });

      const consolidatedRepairOrder: Omit<FirestoreOrder, 'id'> = {
        customerId: customerIdForOrder,
        type: 'Repair',
        stitchTypes: 'Various',
        materials: allMaterialNames,
        deliveryDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        status: 'Placed',
        amount: totalRepairAmount,
        materialCost: totalMaterialCost,
        materialIds: allMaterialIds,
        damageDescription: repairItems.map(item => `${item.name}: ${item.details}`).join('\n---\n'),
        repairInstructions: repairItems.map(item => item.details).join('\n---\n'),
        items: repairItems.map(item => ({
          id: item.id,
          name: item.name,
          details: item.details,
          materials: item.materials,
          price: item.price,
          quantity: item.qty,
        })),
      };
      const repairOrderPromise = addOrder(consolidatedRepairOrder).then(docRef => ({
        cartItemId: 'consolidated-repair',
        orderId: docRef?.id
      }));
      orderCreationPromises.push(repairOrderPromise);
    }

    // Process other items individually
    nonRepairItems.forEach(item => {
      let materialCost = 0;
      if (item.type === 'Product') {
        const productItem = inventory.find(inv => inv.id === item.id);
        if (productItem) {
          updateInventoryItem(productItem.id, { stock: productItem.stock - item.qty });
          materialCost = (productItem.costPrice || 0) * item.qty;
        }
      } else if (item.materials) { // StitchOrder
        item.materials.forEach(material => {
          const materialItem = inventory.find(inv => inv.id === material.id);
          if (materialItem) {
            updateInventoryItem(materialItem.id, { stock: materialItem.stock - 1 });
            materialCost += (materialItem.costPrice || 0);
          }
        });
      }

      const newOrderData: Partial<FirestoreOrder> = {
        customerId: customerIdForOrder,
        type: item.type === 'StitchOrder' ? 'Order' : 'Shipped',
        stitchTypes: item.type === 'StitchOrder' ? 'Custom' : 'N/A',
        materials: item.materials.map(m => m.name).join(', '),
        deliveryDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
        status: item.type === 'Product' ? 'Completed' : 'Placed',
        amount: item.price * item.qty,
        materialCost: materialCost,
        materialIds: item.materials.map(m => m.id),
      };

      if (item.type === 'StitchOrder') {
        newOrderData.damageDescription = item.details;
        if (item.details) newOrderData.repairInstructions = item.details;
      }

      const orderPromise = addOrder(newOrderData as Omit<FirestoreOrder, 'id'>).then(docRef => ({
        cartItemId: item.id,
        orderId: docRef?.id
      }));
      orderCreationPromises.push(orderPromise);
    });

    const createdOrders = await Promise.all(orderCreationPromises);

    // Map created orders back to invoice items
    for (const item of cart) {
      let correspondingOrder;
      if (item.type === 'Repair') {
        correspondingOrder = createdOrders.find(o => o.cartItemId === 'consolidated-repair');
      } else {
        correspondingOrder = createdOrders.find(o => o.cartItemId === item.id);
      }

      invoiceItems.push({
        id: item.id,
        orderId: correspondingOrder?.orderId,
        name: item.name,
        quantity: item.qty,
        price: item.price,
        total: item.price * item.qty,
      });
    }

    const finalCreditedAmount = Math.min(paidAmount, cartTotal);

    let invoiceStatus: 'Paid' | 'Pending' | 'Partially Paid';
    if (finalCreditedAmount >= cartTotal) {
      invoiceStatus = 'Paid';
    } else if (finalCreditedAmount > 0) {
      invoiceStatus = 'Partially Paid';
    } else {
      invoiceStatus = 'Pending';
    }

    const invoicePayload: Omit<FirestoreInvoice, 'id'> = {
      customerId: customerIdForOrder,
      date: Timestamp.now(),
      dueDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
      status: invoiceStatus,
      items: invoiceItems,
      subtotal: cartSubTotal,
      tax: tax,
      total: cartTotal,
      deposit: finalCreditedAmount,
      amountDue: cartTotal - finalCreditedAmount,
    };

    if (finalPaymentMethod) {
      invoicePayload.paymentMethod = finalPaymentMethod;
    }


    const newInvoiceId = await addInvoice(invoicePayload);

    // Now update all created orders with the new invoiceId
    if (newInvoiceId) {
      const orderUpdatePromises = createdOrders
        .filter(o => o.orderId)
        .map(o => updateOrder(o.orderId!, { invoiceId: newInvoiceId }));

      await Promise.all(orderUpdatePromises);
    }

    // Construct full Invoice object to return
    const customerObj = currentCustomer ?
      { ...currentCustomer, totalOrders: 0, totalSpent: 0 } as Customer :
      { id: 'walk-in', name: 'Walk-in Customer', email: '', firstName: 'Walk-in', lastName: 'Customer', avatar: '', imageHint: '' } as Customer;

    const createdInvoice: Invoice = {
      id: newInvoiceId,
      maskedId: 'INV-NEW', // This will be updated by listeners eventually, but for immediate print we might need to fetch or approximate
      ...invoicePayload,
      customer: customerObj
    } as Invoice;

    return createdInvoice;
  };

  const handleCreateOrder = async () => {
    const result = await processOrder(0);
    if (result) {
      setLastInvoice(result);
      setIsSuccessDialogOpen(true);
    }
  };

  const handleFinalizeCheckout = async () => {
    if (!paymentMethod) {
      toast({
        variant: 'destructive',
        title: 'Payment method not selected',
        description: 'Please select a payment method to proceed.',
      });
      return;
    }
    const paidAmountValue = parseFloat(amountPaid);
    if (isNaN(paidAmountValue) || paidAmountValue < 0) {
      toast({ variant: 'destructive', title: 'Invalid amount', description: 'Please enter a valid amount paid.' });
      return;
    }

    const result = await processOrder(paidAmountValue, paymentMethod);
    if (result) {
      setLastInvoice(result);
      setIsSuccessDialogOpen(true);
    }
  };

  const products = inventory
    .filter(item => item.showInPOS ?? true) // Filter based on showInPOS flag
    .map(item => ({
      id: item.id,
      name: item.name,
      price: item.retailPrice,
      category: item.category,
      stock: item.stock,
    }));

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const productsByCategory = filteredProducts.reduce((acc, product) => {
    (acc[product.category] = acc[product.category] || []).push(product);
    return acc;
  }, {} as Record<string, typeof products>);

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
    setProductSearch('');
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setProductSearch('');
  };

  const handleSelectCustomer = (customer: Omit<Customer, 'totalOrders' | 'totalSpent'>) => {
    if (activeInvoice) return;
    setCurrentCustomer(customer);
  };

  const handleSelectInvoice = (invoice: Invoice) => {
    const cartItems: CartItem[] = invoice.items.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: item.quantity,
      type: 'Product', // Simplified, but sufficient for display
      materials: [],
    }));
    setCart(cartItems);
    setCurrentCustomer(invoice.customer);
    setActiveInvoice(invoice);
  };

  const handleSelectMaterial = (material: InventoryItemType) => {
    // prevent duplicates
    if (repairDetails.materials.some(m => m.id === material.id)) {
      return;
    }
    setRepairDetails(prev => ({
      ...prev,
      materials: [...prev.materials, { id: material.id, name: material.name }]
    }));
  };

  const handleRemoveMaterial = (materialId: string) => {
    setRepairDetails(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m.id !== materialId)
    }));
  };

  const handleSelectStitchMaterial = (material: InventoryItemType) => {
    setStitchOrderDetails({ ...stitchOrderDetails, materials: material.name, materialId: material.id });
  };

  const showCreateOrderButton = useMemo(() => {
    if (activeInvoice) return false;
    // Show if there is at least one item that is not a 'Product'
    return cart.some(item => item.type !== 'Product');
  }, [cart, activeInvoice]);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start h-[calc(100vh-theme(spacing.24))]">
        {/* Middle Column - Order & Cart */}
        <div className="xl:col-span-2 flex flex-col gap-8 h-full">
          <Card>
            <CardHeader>
              <CardTitle>Customer &amp; Invoice</CardTitle>
              <CardDescription>
                {activeInvoice ? 'Paying invoice for customer.' : 'Search for a customer or a pending invoice.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {currentCustomer ? (
                  <div className="flex items-center gap-4 w-full">
                    <Avatar>
                      <AvatarImage src={currentCustomer.avatar} alt={currentCustomer.name} />
                      <AvatarFallback>
                        {currentCustomer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="font-medium">
                      <p>{currentCustomer.name}</p>
                      {activeInvoice && <p className="text-sm text-muted-foreground">Invoice: {activeInvoice.maskedId}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => { if (!activeInvoice) setCurrentCustomer(null); }} className="ml-auto" disabled={!!activeInvoice}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <CustomerInvoiceSearch
                      onSelectCustomer={handleSelectCustomer}
                      onSelectInvoice={handleSelectInvoice}
                      disabled={!!activeInvoice}
                    />
                    <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          disabled={!!activeInvoice}
                        >
                          <Plus className="w-4 h-4" />
                          <span className="sr-only">Add Customer</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add New Customer</DialogTitle>
                          <DialogDescription>
                            Enter the details for the new customer. Click save
                            when you're done.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="first-name" className="text-right">
                              First Name
                            </Label>
                            <Input
                              id="first-name"
                              placeholder="John"
                              className="col-span-3"
                              value={newCustomer.firstName}
                              onChange={e => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="last-name" className="text-right">
                              Last Name
                            </Label>
                            <Input
                              id="last-name"
                              placeholder="Doe"
                              className="col-span-3"
                              value={newCustomer.lastName}
                              onChange={e => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                              Email
                            </Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="john.doe@example.com"
                              className="col-span-3"
                              value={newCustomer.email}
                              onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">
                              Phone
                            </Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="(123) 456-7890"
                              className="col-span-3"
                              value={newCustomer.phone}
                              onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleSaveCustomer}>Save Customer</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="flex-grow flex flex-col">
            <CardHeader>
              <CardTitle>{activeInvoice ? `Paying Invoice #${activeInvoice.maskedId}` : 'Current Order'}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="w-[100px] text-center">Qty</TableHead>
                    <TableHead className="w-[120px] text-right">
                      Price
                    </TableHead>
                    <TableHead className="w-[120px] text-right">
                      Total
                    </TableHead>
                    <TableHead className="w-[50px]">
                      <span className="sr-only">Remove</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.length > 0 ? (
                    cart.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.name}
                          {(item.details || item.materials.length > 0) && (
                            <p className="text-xs text-muted-foreground">
                              {item.details}{item.details && item.materials.length > 0 && '; '}{item.materials.map(m => m.name).join(', ')}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {activeInvoice ? (
                            item.qty
                          ) : (
                            <Input
                              type="number"
                              value={item.qty}
                              onChange={(e) =>
                                handleUpdateCartQuantity(
                                  item.id,
                                  parseInt(e.target.value, 10) || 1
                                )
                              }
                              className="w-16 h-8 text-center"
                              min="1"
                              disabled={item.type !== 'Product' || !!activeInvoice}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.price * item.qty)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFromCart(item.id)}
                            disabled={!!activeInvoice}
                          >
                            <X className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-12"
                      >
                        No items in the order
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            {cart.length > 0 && (
              <CardFooter className="flex flex-col gap-2 bg-muted/50 p-4 mt-auto">
                {!activeInvoice && (
                  <>
                    <div className="flex justify-between items-center w-full text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(cartSubTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center w-full text-sm">
                      <span>{taxName} ({taxRate * 100}%)</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center w-full font-bold text-lg mt-2">
                  <span>{activeInvoice ? 'Amount Due' : 'Total'}</span>
                  <span>{formatCurrency(amountDue)}</span>
                </div>
              </CardFooter>
            )}
          </Card>

          <div className="flex justify-end gap-2 mt-auto">
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={resetPos}
            >
              Cancel
            </Button>
            {showCreateOrderButton ? (
              <Button
                variant="outline"
                onClick={handleCreateOrder}
                disabled={cart.length === 0}
              >
                Create Order
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => processOrder(0)}
                disabled={cart.length === 0}
              >
                Create Invoice
              </Button>
            )}
            <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={cart.length === 0}
                  className="min-w-[150px] bg-primary hover:bg-primary/90"
                >
                  Checkout
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{activeInvoice ? 'Pay Invoice' : 'Complete Checkout'}</DialogTitle>
                  <DialogDescription>
                    Select a payment method and confirm the amount paid.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border bg-background p-4 flex flex-col justify-center items-center">
                      <span className="text-sm text-muted-foreground">Amount Due</span>
                      <span className="text-2xl font-bold">{formatCurrency(amountDue)}</span>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount-paid">Amount Paid</Label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                        <Input id="amount-paid" type="number" placeholder="0.00" className="pl-7 text-lg h-full text-right" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {changeDue > 0 && paymentMethod === 'Cash' && (
                    <div className="rounded-lg border-2 border-primary bg-primary/10 p-4 flex flex-col justify-center items-center text-primary">
                      <span className="text-sm font-medium">Change Due</span>
                      <span className="text-2xl font-bold">{formatCurrency(changeDue)}</span>
                    </div>
                  )}

                  <Separator />
                  <p className="text-sm text-muted-foreground text-center">Choose payment method</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={paymentMethod === 'Card' ? 'default' : 'outline'}
                      className="py-8 text-lg flex flex-col gap-2"
                      onClick={() => setPaymentMethod('Card')}
                    >
                      <CreditCard className="w-8 h-8" />
                      <span>Card</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'Cash' ? 'default' : 'outline'}
                      className="py-8 text-lg flex flex-col gap-2"
                      onClick={() => setPaymentMethod('Cash')}
                    >
                      <DollarSign className="w-8 h-8" />
                      <span>Cash</span>
                    </Button>
                  </div>
                </div>
                <DialogFooter className="mt-4 sm:justify-between gap-2">
                  <DialogClose asChild>
                    <Button type="button" variant="secondary" className="w-full sm:w-auto">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button onClick={handleFinalizeCheckout} disabled={!paymentMethod || !amountPaid} className="w-full sm:w-auto">Proceed</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="flex flex-col gap-4 h-full">
          <Tabs defaultValue="sale" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="sale" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span className="truncate">New Sale</span>
              </TabsTrigger>
              <TabsTrigger value="repair" className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                <span className="truncate">Create Repair</span>
              </TabsTrigger>
              <TabsTrigger value="stitch-order" className="flex items-center gap-2">
                <Shirt className="w-4 h-4" />
                <span className="truncate">New Stitch Order</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="sale">
              <Card>
                <CardHeader>
                  {!selectedCategory ? (
                    <>
                      <CardTitle>Sell a Product</CardTitle>
                      <CardDescription>
                        Select a category to view products.
                      </CardDescription>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="-ml-2" onClick={handleBackToCategories}>
                        <ArrowLeft className="w-5 h-5" />
                        <span className="sr-only">Back to categories</span>
                      </Button>
                      <div>
                        <CardTitle>{selectedCategory}</CardTitle>
                        <CardDescription>
                          Search for a product to add to the order.
                        </CardDescription>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search for products..."
                        className="pl-8"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        disabled={!!activeInvoice || !!selectedCategory}
                      />
                    </div>
                  </div>
                  {selectedCategory ? (
                    <>
                      <div className="space-y-2">
                        {(productsByCategory[selectedCategory] || [])
                          .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                          .map((product) => (
                            <Card
                              key={product.id}
                              className="p-3 flex justify-between items-center"
                            >
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <div className="text-sm text-muted-foreground flex gap-4">
                                  <span>{formatCurrency(product.price)}</span>
                                  <span className={cn(product.stock <= 0 ? 'text-destructive' : '')}>
                                    {product.stock} in stock
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAddToCart(product)}
                                disabled={!!activeInvoice}
                              >
                                <PlusCircle className="mr-2 h-4 w-4" /> Add
                              </Button>
                            </Card>
                          ))}
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.keys(productsByCategory).map((category) => (
                        <Card
                          key={category}
                          className="p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => { if (!activeInvoice) handleSelectCategory(category) }}
                        >
                          <ImageIcon className="w-10 h-10 text-muted-foreground" />
                          <p className="font-semibold text-sm text-center">{category}</p>
                        </Card>
                      ))}
                    </div>
                  )}

                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="repair">
              <Card>
                <CardHeader>
                  <CardTitle>Create a Repair Order</CardTitle>
                  <CardDescription>
                    Fill in the details for the repair.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="repair-name">Repair/Item Name</Label>
                    <Input
                      id="repair-name"
                      placeholder="e.g., 'Jeans Hemming', 'Jacket Zipper'"
                      value={repairDetails.name}
                      onChange={(e) =>
                        setRepairDetails({
                          ...repairDetails,
                          name: e.target.value,
                        })
                      }
                      disabled={!!activeInvoice}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repair-details">
                      Repair Details (Optional)
                    </Label>
                    <Textarea
                      id="repair-details"
                      placeholder="Describe the issue or customer request..."
                      value={repairDetails.details}
                      onChange={(e) =>
                        setRepairDetails({
                          ...repairDetails,
                          details: e.target.value,
                        })
                      }
                      disabled={!!activeInvoice}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repair-materials">Materials</Label>
                    <MaterialSearch
                      onSelectMaterial={handleSelectMaterial}
                      disabled={!!activeInvoice}
                    />
                    <div className="flex flex-wrap gap-2 pt-2">
                      {repairDetails.materials.map(material => (
                        <Badge key={material.id} variant="secondary" className="pl-2 pr-1 py-1 text-sm">
                          {material.name}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 ml-1"
                            onClick={() => handleRemoveMaterial(material.id)}
                          >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Remove {material.name}</span>
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="repair-price">Price</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="repair-price"
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                        value={repairDetails.price}
                        onChange={(e) =>
                          setRepairDetails({
                            ...repairDetails,
                            price: e.target.value,
                          })
                        }
                        disabled={!!activeInvoice}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" onClick={handleAddRepairToCart} disabled={!!activeInvoice}>
                    <PlusCircle className="mr-2" /> Add Repair to Order
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="stitch-order">
              <Card>
                <CardHeader>
                  <CardTitle>Create a New Stitch Order</CardTitle>
                  <CardDescription>
                    Enter details for a new custom garment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stitch-name">Item Name</Label>
                    <Input
                      id="stitch-name"
                      placeholder="e.g., 'Custom Linen Shirt', 'Tailored Trousers'"
                      value={stitchOrderDetails.name}
                      onChange={(e) =>
                        setStitchOrderDetails({
                          ...stitchOrderDetails,
                          name: e.target.value,
                        })
                      }
                      disabled={!!activeInvoice}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stitch-materials">Materials & Fabric</Label>
                    <MaterialSearch
                      onSelectMaterial={handleSelectStitchMaterial}
                      initialMaterialName={stitchOrderDetails.materials}
                      disabled={!!activeInvoice}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stitch-measurements">Measurements</Label>
                    <Textarea
                      id="stitch-measurements"
                      placeholder="Enter customer measurements..."
                      value={stitchOrderDetails.measurements}
                      onChange={(e) =>
                        setStitchOrderDetails({
                          ...stitchOrderDetails,
                          measurements: e.target.value,
                        })
                      }
                      disabled={!!activeInvoice}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stitch-price">Price</Label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="stitch-price"
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                        value={stitchOrderDetails.price}
                        onChange={(e) =>
                          setStitchOrderDetails({
                            ...stitchOrderDetails,
                            price: e.target.value,
                          })
                        }
                        disabled={!!activeInvoice}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={handleAddStitchOrderToCart}
                    disabled={!!activeInvoice}
                  >
                    <PlusCircle className="mr-2" /> Add Stitch Order
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Hidden components for printing */}
      <div className="hidden">
        {lastInvoice && <StandardInvoice ref={standardInvoiceRef} invoice={lastInvoice} />}
        {lastInvoice && <PrintableReceipt ref={receiptRef} invoice={lastInvoice} />}
      </div>

      {/* Success Dialog */}
      <Dialog open={isSuccessDialogOpen} onOpenChange={setIsSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Placed Successfully</DialogTitle>
            <DialogDescription>
              Order #{lastInvoice?.maskedId} has been created. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button onClick={handlePrintReceipt} variant="outline" className="w-full justify-start">
              <Printer className="mr-2 h-4 w-4" /> Print Thermal Receipt (80mm)
            </Button>
            <Button onClick={handlePrintInvoice} variant="outline" className="w-full justify-start">
              <Printer className="mr-2 h-4 w-4" /> Print Standard Invoice (A4)
            </Button>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button onClick={() => { setIsSuccessDialogOpen(false); resetPos(); }} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> New Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
