import type { ComponentProps } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export function DashboardPage(props: Omit<ComponentProps<'main'>, 'className'>) {
  return <main {...props} className="flex w-full flex-col gap-5 px-4 pt-5 pb-8 sm:px-5 lg:gap-6 lg:px-6 lg:pt-6 lg:pb-10" />;
}

export function DashboardBackLink() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex min-h-8 w-fit items-center gap-2 rounded-sm text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      Tutti i progetti
    </Link>
  );
}
