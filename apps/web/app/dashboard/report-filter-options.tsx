'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export type ReportFilterOptionsProps = {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  searchable?: boolean;
  disabled?: boolean;
  mobile?: boolean;
};

const PAGE_SIZE = 20;

export function ReportFilterOptions({ label, options, selected, onChange, searchable = false, disabled = false, mobile = false }: ReportFilterOptionsProps) {
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const root = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const query = search.trim().toLocaleLowerCase('it');
  const matches = useMemo(() => searchable && query
    ? options.filter(option => option.label.toLocaleLowerCase('it').includes(query))
    : options, [options, query, searchable]);
  const visible = searchable ? matches.slice(0, limit) : matches;
  const hasMore = visible.length < matches.length;

  useEffect(() => {
    if (!hasMore || !root.current || !sentinel.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer.disconnect();
        setLimit(count => count + PAGE_SIZE);
      }
    }, { root: root.current });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, limit, query]);

  return <fieldset disabled={disabled} aria-label={label} className="min-h-0 space-y-2">
    {searchable ? <Input type="search" aria-label={`Cerca nelle opzioni: ${label}`} placeholder={label === 'Pagine' ? 'Cerca pagine…' : 'Cerca utenti…'} value={search} onChange={event => {
      setSearch(event.target.value);
      setLimit(PAGE_SIZE);
      root.current?.scrollTo({ top: 0 });
    }} /> : null}
    <div ref={root} className={`${mobile ? 'max-h-[50dvh]' : 'max-h-64'} space-y-1 overflow-y-auto overscroll-contain`}>
      {visible.map((option, index) => <label key={option.value} className={`flex cursor-pointer items-center gap-3 rounded-lg text-sm transition-colors hover:bg-primary/10 hover:text-primary ${mobile ? 'min-h-12 p-3' : 'p-2'}`}>
        <Checkbox checked={selected.includes(option.value)} onFocus={() => {
          // Keep the next batch reachable when navigating with Tab.
          if (hasMore && index === visible.length - 1) setLimit(count => count + PAGE_SIZE);
        }} onCheckedChange={checked => onChange(checked ? [...selected, option.value] : selected.filter(value => value !== option.value))} />
        <span className="min-w-0 break-words [overflow-wrap:anywhere]">{option.label}</span>
      </label>)}
      {!matches.length ? <p className="p-2 text-sm text-muted-foreground">{query ? 'Nessun risultato trovato.' : 'Nessuna opzione disponibile.'}</p> : null}
      {hasMore ? <div ref={sentinel} aria-hidden="true" className="h-px" /> : null}
    </div>
  </fieldset>;
}
