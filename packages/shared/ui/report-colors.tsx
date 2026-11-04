// Light colors stay unchanged. Dark colors use the same tinted treatment as danger.
export const statusColors = {
  open: 'bg-red-100 text-red-800 dark:bg-destructive/10 dark:text-destructive',
  in_progress: 'bg-orange-100 text-orange-800 dark:bg-report-progress/10 dark:text-report-progress',
  validation: 'bg-blue-100 text-blue-800 dark:bg-report-info/10 dark:text-report-info',
  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-report-success/10 dark:text-report-success',
};

export const priorityColors = {
  low: 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-report-warning/10 dark:text-report-warning',
  high: 'bg-red-100 text-red-800 dark:bg-destructive/10 dark:text-destructive',
};

export const pinColors = {
  low: 'bg-slate-600 dark:bg-neutral-600',
  medium: 'bg-amber-600 dark:bg-report-warning dark:text-background',
  high: 'bg-red-600 dark:bg-destructive dark:text-background',
};

export const notificationColors = {
  created: 'bg-emerald-100 text-emerald-800 dark:bg-report-success/10 dark:text-report-success',
  status_changed: 'bg-amber-100 text-amber-800 dark:bg-report-warning/10 dark:text-report-warning',
  reply: 'bg-violet-100 text-violet-800 dark:bg-primary/15 dark:text-accent-foreground',
};
