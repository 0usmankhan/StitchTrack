'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useApp } from '@/context/app-context';
import type { Customer, Invoice } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import debounce from 'lodash.debounce';

type CustomerInvoiceSearchProps = {
  onSelectCustomer: (customer: Omit<Customer, 'totalOrders' | 'totalSpent'>) => void;
  onSelectInvoice: (invoice: Invoice) => void;
  disabled?: boolean;
};

export function CustomerInvoiceSearch({
  onSelectCustomer,
  onSelectInvoice,
  disabled,
}: CustomerInvoiceSearchProps) {
  const { customers, invoices } = useApp();
  const [query, setQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<{ type: string; data: Customer | Invoice }[]>([]);
  const [isPending, startTransition] = useTransition();
  const [showResults, setShowResults] = useState(false);

  const performSearch = (searchTerm: string) => {
    if (!searchTerm) {
      setFilteredResults([]);
      return;
    }
    const lowercasedTerm = searchTerm.toLowerCase();

    const matchedCustomers = customers
      .filter(
        (customer) =>
          customer.name.toLowerCase().includes(lowercasedTerm) ||
          customer.email.toLowerCase().includes(lowercasedTerm)
      )
      .map((c) => ({ type: 'customer', data: c as Customer }));

    const matchedInvoices = invoices
      .filter(
        (invoice) =>
          (invoice.status === 'Pending' || invoice.status === 'Partially Paid') &&
          (invoice.maskedId.toLowerCase().includes(lowercasedTerm) ||
            invoice.customer.name.toLowerCase().includes(lowercasedTerm))
      )
      .map((i) => ({ type: 'invoice', data: i as Invoice }));

    setFilteredResults([...matchedCustomers, ...matchedInvoices]);
  };

  const debouncedSearch = useCallback(
    debounce((newQuery: string) => {
      startTransition(() => {
        performSearch(newQuery);
      });
    }, 300),
    [customers, invoices]
  );

  const handleInputChange = (newQuery: string) => {
    setQuery(newQuery);
    if (newQuery.trim().length > 0) {
      setShowResults(true);
      debouncedSearch(newQuery);
    } else {
      setShowResults(false);
      setFilteredResults([]);
    }
  };

  const handleSelect = (result: { type: string; data: Customer | Invoice }) => {
    if (result.type === 'customer') {
      onSelectCustomer(result.data as Customer);
    } else {
      onSelectInvoice(result.data as Invoice);
    }
    setQuery('');
    setFilteredResults([]);
    setShowResults(false);
  };
  
  const handleBlur = () => {
    setTimeout(() => {
      setShowResults(false);
    }, 150);
  };

  return (
    <div className="flex items-center gap-2 w-full">
       <User className="w-5 h-5 text-muted-foreground" />
      <Command className="relative w-full overflow-visible">
        <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <CommandInput
            placeholder="Search customer or pending invoice..."
            className="pl-10"
            value={query}
            onValueChange={handleInputChange}
            onFocus={() => {
                if (query) setShowResults(true);
            }}
            onBlur={handleBlur}
            disabled={disabled}
            />
        </div>
        {showResults && (
          <CommandList className="absolute top-full z-50 mt-1 max-h-80 w-full overflow-auto rounded-md border bg-popover shadow-md">
            {isPending ? (
              <div className="p-4 flex justify-center items-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredResults.length > 0 ? (
              <ScrollArea className="h-auto max-h-72">
                <CommandGroup heading="Customers">
                  {filteredResults
                    .filter((r) => r.type === 'customer')
                    .map((result) => {
                      const customer = result.data as Customer;
                      return (
                        <CommandItem
                          key={`cust-${customer.id}`}
                          value={`${customer.name} ${customer.email}`}
                          onSelect={() => handleSelect(result)}
                          className="p-3 flex items-center gap-3 cursor-pointer"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={customer.avatar}
                              alt={customer.name}
                            />
                            <AvatarFallback>
                              {customer.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {customer.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {customer.email}
                            </p>
                          </div>
                        </CommandItem>
                      );
                    })}
                </CommandGroup>
                <CommandGroup heading="Pending Invoices">
                  {filteredResults
                    .filter((r) => r.type === 'invoice')
                    .map((result) => {
                      const invoice = result.data as Invoice;
                      return (
                        <CommandItem
                          key={`inv-${invoice.id}`}
                           value={`${invoice.maskedId} ${invoice.customer.name}`}
                          onSelect={() => handleSelect(result)}
                          className="p-3 flex justify-between cursor-pointer"
                        >
                          <div>
                            <p className="font-medium text-sm">
                              {invoice.maskedId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {invoice.customer.name}
                            </p>
                          </div>
                          <p className="font-semibold text-sm">
                            {formatCurrency(invoice.amountDue ?? invoice.total)}
                          </p>
                        </CommandItem>
                      );
                    })}
                </CommandGroup>
              </ScrollArea>
            ) : (
              query.length > 1 && <CommandEmpty>No results found.</CommandEmpty>
            )}
          </CommandList>
        )}
      </Command>
    </div>
  );
}
