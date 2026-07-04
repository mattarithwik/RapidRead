"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { COUNTRIES, countryLabel } from "@/lib/constants";
import type { CountryCode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CountryPickerProps {
  value: CountryCode[];
  onChange: (countries: CountryCode[]) => void;
}

export function CountryPicker({ value, onChange }: CountryPickerProps) {
  const [open, setOpen] = useState(false);

  const groupedCountries = useMemo(() => {
    const groups = new Map<string, typeof COUNTRIES>();
    for (const country of COUNTRIES) {
      const list = groups.get(country.region) ?? [];
      list.push(country);
      groups.set(country.region, list);
    }
    return Array.from(groups.entries());
  }, []);

  function toggle(country: CountryCode) {
    onChange(value.includes(country) ? value.filter((item) => item !== country) : [...value, country]);
  }

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {value.length ? `${value.length} countries selected` : "Select countries..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,28rem)] p-0" align="start">
          <Command className="max-h-[min(60vh,26rem)]">
            <CommandInput placeholder="Search countries..." />
            <CommandList className="max-h-[min(52vh,22rem)] overflow-y-auto overscroll-contain">
              <CommandEmpty>No country found.</CommandEmpty>
              {groupedCountries.map(([region, countries]) => (
                <CommandGroup key={region} heading={region}>
                  {countries.map((country) => (
                    <CommandItem
                      key={country.id}
                      value={`${country.label} ${country.region} ${country.id}`}
                      onSelect={() => toggle(country.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value.includes(country.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{country.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length ? (
        <div className="max-h-32 overflow-y-auto overscroll-contain rounded-md border bg-muted/30 p-2">
          <div className="flex flex-wrap gap-2">
            {value.map((country) => (
              <Badge key={country} variant="secondary" className="gap-1 pr-1">
                {countryLabel(country)}
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-background/60"
                  aria-label={`Remove ${countryLabel(country)}`}
                  onClick={() => toggle(country)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Choose at least one country or region.</p>
      )}
    </div>
  );
}
