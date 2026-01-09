'use client';

import { useState, useTransition, useCallback } from 'react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useApp } from '@/context/app-context';
import type { Customer } from '@/lib/types';
import debounce from 'lodash.debounce';

type CustomerSearchProps = {
  onSelectCustomer: (customer: Omit<Customer, 'totalOrders' | 'totalSpent'>) => void;
  disabled?: boolean;
};

export function CustomerSearch({
  onSelectCustomer,
  disabled,
}: CustomerSearchProps) {
  const { customers } = useApp();
  const [query, setQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<Customer[]>([]);
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
      );

    setFilteredResults(matchedCustomers);
  };

  const debouncedSearch = useCallback(
    debounce((newQuery: string) => {
      startTransition(() => {
        performSearch(newQuery);
      });
    }, 300),
    [customers]
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

  const handleSelect = (customer: Customer) => {
    onSelectCustomer(customer);
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
    <div className="flex items-center gap-2">
      <Command className="relative w-full overflow-visible">
        <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <CommandInput
            placeholder="Search for a customer..."
            className="pl-10 w-full"
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
          <CommandList className="absolute top-full z-10 mt-1 max-h-80 w-full overflow-auto rounded-md border bg-popover shadow-md">
            {isPending ? (
              <div className="p-4 flex justify-center items-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredResults.length > 0 ? (
              <ScrollArea className="h-auto max-h-72">
                <CommandGroup heading="Customers">
                  {filteredResults.map((customer) => (
                        <CommandItem
                          key={`cust-${customer.id}`}
                          value={`${customer.name} ${customer.email}`}
                          onSelect={() => handleSelect(customer)}
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
                      )
                    )}
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
