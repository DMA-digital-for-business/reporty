'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { FolderClosed, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function DashboardNav({ projects }: { projects: { id: string; name: string }[] }) {
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const filteredProjects = projects.filter(project => project.name.toLocaleLowerCase('it').includes(search.toLocaleLowerCase('it')));

  return <nav aria-label="Navigazione principale" className="-m-1 min-h-0 flex-1 space-y-5 overflow-y-auto p-1">
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sidebar-foreground/60" />
      <Input aria-label="Cerca progetti nella sidebar" placeholder="Cerca progetto…" className="h-9 border-sidebar-foreground/25 bg-background pl-9 text-sidebar-foreground placeholder:text-sidebar-foreground/60 dark:bg-background" value={search} onChange={event => setSearch(event.target.value)} />
    </div>
    <section aria-label="Progetti" className="space-y-2">
      <h2 className="px-2.5 text-xs font-medium text-muted-foreground">Progetti</h2>
      <ul className="space-y-1">
        {filteredProjects.map(project => {
          const active = pathname === `/dashboard/projects/${project.id}`;
          return <li key={project.id}>
            <Link href={`/dashboard/projects/${project.id}`} aria-current={active ? 'page' : undefined} className={`flex h-9 min-w-0 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/50 motion-reduce:transition-none ${active ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : 'text-sidebar-foreground/75 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground'}`}>
              <FolderClosed aria-hidden="true" className={`size-4 shrink-0 ${active ? 'text-sidebar-accent-foreground' : 'text-muted-foreground'}`} />
              <span className="min-w-0 flex-1 truncate" title={project.name}>{project.name}</span>
            </Link>
          </li>;
        })}
      </ul>
      {!filteredProjects.length ? <p className="px-2.5 text-xs text-muted-foreground">{projects.length ? 'Nessun progetto trovato.' : 'Nessun progetto.'}</p> : null}
    </section>
  </nav>;
}
