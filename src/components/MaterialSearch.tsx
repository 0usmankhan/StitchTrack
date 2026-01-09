'use client';

import { useState, useTransition, useCallback, useEffect } from 'react';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import type { InventoryItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import debounce from 'lodash.debounce';
import { useApp } from '@/context/app-context';
import { useToast } from '@/hooks/use-toast';

type MaterialSearchProps = {
  onSelectMaterial: (material: InventoryItem) => void;
  initialMaterialName?: string;
  disabled?: boolean;
};

export function MaterialSearch({ onSelectMaterial, initialMaterialName, disabled }: MaterialSearchProps) {
  const { inventory } = useApp();
  const { toast } = useToast();
  const [query, setQuery] = useState(initialMaterialName || '');
  const [filteredResults, setFilteredResults] = useState<InventoryItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const [showResults, setShowResults] = useState(false);

  const performSearch = (searchTerm: string) => {
    if (!searchTerm) {
      setFilteredResults([]);
      return;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    const results = inventory.filter(item =>
      item.name.toLowerCase().includes(lowercasedTerm)
    );
    setFilteredResults(results);
  };

  const debouncedSearch = useCallback(
    debounce((newQuery: string) => {
      startTransition(() => {
        performSearch(newQuery);
      });
    }, 300),
    [inventory] // Re-create debounce if inventory changes
  );

  useEffect(() => {
    // When the component gets a new initial name, update the internal state
    setQuery(initialMaterialName || '');
  }, [initialMaterialName]);

  const handleInputChange = (newQuery: string) => {
    setQuery(newQuery);
    if(newQuery.trim().length > 0) {
        setShowResults(true);
        debouncedSearch(newQuery);
    } else {
        setShowResults(false);
        setFilteredResults([]);
    }
  };

  const handleSelect = (material: InventoryItem) => {
    if (material.stock <= 0) {
      toast({
        variant: "destructive",
        title: "Out of Stock",
        description: `"${material.name}" is out of stock and cannot be selected.`,
      });
      return;
    }
    // For popover usage, don't set the query on select
    // setQuery(material.name); 
    onSelectMaterial(material);
    setQuery(''); // Reset query after selection
    setShowResults(false);
  };
  
  const handleBlur = () => {
    // Delay hiding results to allow click events on items to register
    setTimeout(() => {
        setShowResults(false);
    }, 150);
  }

  return (
    <Command className="relative w-full overflow-visible">
      <CommandInput
        placeholder="Search materials..."
        value={query}
        onValueChange={handleInputChange}
        onFocus={() => { if(query) setShowResults(true); }}
        onBlur={handleBlur}
        disabled={disabled}
      />
      {showResults && (
        <CommandList
          className='absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md'
        >
          {isPending ? (
            <div className="p-4 flex justify-center items-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredResults.length > 0 ? (
            filteredResults.map((result) => (
              <CommandItem
                key={result.id}
                value={result.name}
                onSelect={() => handleSelect(result)}
                className="cursor-pointer flex justify-between aria-selected:bg-accent"
              >
                <span>{result.name}</span>
                {result.stock > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    Stock: {result.stock}
                  </span>
                ) : (
                  <span className="text-xs text-red-500 font-semibold">
                    Out of Stock
                  </span>
                )}
              </CommandItem>
            ))
          ) : (
             query.length > 1 && <CommandEmpty>No results found.</CommandEmpty>
          )}
        </CommandList>
      )}
    </Command>
  );
}
