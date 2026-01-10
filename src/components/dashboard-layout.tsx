'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  Home,
  Package,
  Users,
  Wrench,
  Warehouse,
  LineChart,
  UserCircle,
  Search,
  ShoppingCart,
  FileText,
  Settings,
  LogOut,
  Trash2,
  Headphones,
  MessageSquare,
  Phone,
  Bug,
  Moon,
  Sun,
  Clock,
  ClipboardList,
} from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuFooter,
} from '@/components/ui/dropdown-menu';
import { Input } from './ui/input';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Skeleton } from './ui/skeleton';
import { useTheme } from 'next-themes';
import { useApp } from '@/context/app-context';
import { formatDistanceToNow, intervalToDuration } from 'date-fns';
import { Badge } from './ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

const StitchTrackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-8 h-8 text-primary"
  >
    <path d="M15.5 21a1.5 1.5 0 0 1-1.5-1.5V18a1.5 1.5 0 0 1 3 0v1.5a1.5 1.5 0 0 1-1.5 1.5Z" />
    <path d="M18.5 15a1.5 1.5 0 0 1-1.5-1.5V12a1.5 1.5 0 0 1 3 0v1.5a1.5 1.5 0 0 1-1.5 1.5Z" />
    <path d="M7 13.5v-1a2 2 0 1 1 4 0v1" />
    <path d="M6 18H4.5a1.5 1.5 0 0 1-1.5-1.5V12a1.5 1.5 0 0 1 1.5-1.5H6" />
    <path d="M13 3v2" />
    <path d="M18 3v2" />
    <path d="m5 6 1-3" />
    <path d="m11 6-1-3" />
    <path d="M2 12h1.5" />
    <path d="M22 12h-1.5" />
    <path d="M7 18h1.5" />
    <path d="M17 18h-1.5" />
  </svg>
);

const initialNotifications = [
  {
    id: '1',
    title: 'New Order: #3211',
    description: 'From Ava Garcia for Linen Dress.',
  },
  {
    id: '2',
    title: 'Low Stock Alert',
    description: 'Satin Embroidery Floss is low.',
    variant: 'destructive',
  },
  {
    id: '3',
    title: 'Repair Completed: #3209',
    description: "Jackson Lee's jeans repair is ready.",
  },
];

function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="rounded-full hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/*  Replace the entire ClockInOut function with this block            */
/* ------------------------------------------------------------------ */
function ClockInOut() {
  const { activeTimesheet, clockIn, clockOut } = useApp();
  const [timer, setTimer] = useState('00:00:00');
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false); // <-- controlled

  /* ----------  running timer  ---------- */
  useEffect(() => {
    if (!activeTimesheet) return;
    const i = setInterval(() => {
      const d = intervalToDuration({
        start: activeTimesheet.startTime.toDate(),
        end: new Date(),
      });
      setTimer(
        `${(d.hours ?? 0).toString().padStart(2, '0')}:${(
          d.minutes ?? 0
        )
          .toString()
          .padStart(2, '0')}:${(d.seconds ?? 0).toString().padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(i);
  }, [activeTimesheet]);

  /* ----------  clock-out handler  ---------- */
  const handleClockOut = () => {
    if (!activeTimesheet) return;
    clockOut(activeTimesheet.id, notes);
    setNotes('');
    setOpen(false);
  };

  /* ----------  UI  ---------- */
  if (activeTimesheet) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {/* wrapper must be a single node */}
          <div
            className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => setOpen((v) => !v)}
          >
            <Clock className="mr-2 h-4 w-4" />
            <span>Clock Out</span>
            <Badge
              variant="destructive"
              className="bg-destructive/80 text-destructive-foreground"
            >
              {timer}
            </Badge>
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-80" side="top" align="center">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Clock Out</h4>
              <p className="text-sm text-muted-foreground">
                Add any notes before clocking out.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="What did you work on?"
                className="h-24"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button onClick={handleClockOut} className="w-full">
              Confirm Clock Out
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  /* ----------  NOT clocked-in  ---------- */
  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault();
        clockIn();
      }}
    >
      <Clock className="mr-2 h-4 w-4" />
      <span>Clock In</span>
    </DropdownMenuItem>
  );
}
/* ------------------------------------------------------------------ */


function StoreSwitcher() {
  const { stores, activeStore, setActiveStore } = useApp();

  if (!stores || stores.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hidden md:flex gap-2 items-center mr-2">
          <Warehouse className="h-4 w-4" />
          <span>{activeStore?.name || "All Locations"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Switch Location</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {stores.map(store => (
          <DropdownMenuItem key={store.id} onClick={() => setActiveStore(store)}>
            {activeStore?.id === store.id && <span className="mr-2">✓</span>}
            {store.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">Manage Locations</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const { permissions } = useApp();
  const auth = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/login');
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-2">
            <StitchTrackIcon />
            <h1 className="text-xl font-semibold font-headline">StitchTrack</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/">
                  <Home />
                  <span>Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {permissions?.pos?.read && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/pos">
                    <ShoppingCart />
                    <span>POS</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {permissions?.orders?.read && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/orders">
                    <Package />
                    <span>Orders</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {permissions?.purchaseOrders?.read && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/purchase-orders">
                    <ClipboardList />
                    <span>Purchase Orders</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {permissions?.customers?.read && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/customers">
                    <Users />
                    <span>Customers</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {permissions?.invoices?.read && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/invoices">
                    <FileText />
                    <span>Invoices</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {permissions?.repairs?.read && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/repairs">
                    <Wrench />
                    <span>Repairs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {permissions?.inventory?.read && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/inventory">
                    <Warehouse />
                    <span>Inventory</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {permissions?.reports?.read && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/reports">
                    <LineChart />
                    <span>Reports</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {permissions?.users?.read && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/users">
                    <Users />
                    <span>Team</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {permissions?.settings?.read && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/settings">
                    <UserCircle />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {permissions?.customization?.read && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/customization">
                    <Settings />
                    <span>Customization</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <p className="text-xs text-sidebar-foreground/60">
            © 2024 StitchTrack POS
          </p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 bg-background border-b">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <div className="relative hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-white dark:bg-zinc-800"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StoreSwitcher />
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full relative hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 focus:ring-0"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                  )}
                  <span className="sr-only">Toggle notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                  <>
                    {notifications.map((notification) => (
                      <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1">
                        <p className={`font-medium ${notification.variant === 'destructive' ? 'text-destructive' : ''}`}>{notification.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {notification.description}
                        </p>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuFooter>
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => setNotifications([])}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                      </Button>
                    </DropdownMenuFooter>
                  </>
                ) : (
                  <p className="p-4 text-sm text-center text-muted-foreground">No new notifications</p>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <UserCircle className="h-6 w-6" />
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ClockInOut />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
