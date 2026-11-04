import { statusColors as colors, notificationColors } from '@reporty/shared/ui/report-colors';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, ArrowRightLeft, CheckCheck, FilePlus2, MessageSquare } from 'lucide-react';
import { formatReportDateTime, notificationKind, type ReportNotification } from '@reporty/shared';

const labels = { open: 'Aperta', in_progress: 'In lavorazione', validation: 'Validazione', resolved: 'Chiusa' };
const events = {
  created: { label: 'Nuova segnalazione', icon: FilePlus2, style: notificationColors.created },
  status_changed: { label: 'Cambio di stato', icon: ArrowRightLeft, style: notificationColors.status_changed },
  reply: { label: 'Nuova risposta', icon: MessageSquare, style: notificationColors.reply },
};
export function NotificationContent({ item, showProject = false }: { item: ReportNotification; showProject?: boolean }) {
  const kind = notificationKind(item);
  const event = events[kind];
  const Icon = event.icon;
  return <div className="flex items-start gap-3">
    <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${event.style}`}><Icon className="size-4" aria-hidden="true" /></span>
    <div className="min-w-0 flex-1 space-y-2">
      <div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${event.style}`}>{event.label}</span>{!item.read_at ? <span className="size-2 shrink-0 rounded-full bg-red-600 dark:bg-primary" aria-label="Non letta" /> : null}</div>
      {kind === 'created' ? <><p className="line-clamp-3 break-words text-sm font-medium">{item.body}</p><p className="text-xs text-muted-foreground">Creata da {item.actor_name}</p></> : kind === 'reply' ? <><p className="text-xs text-muted-foreground">{item.actor_name} ha risposto</p><p className="line-clamp-3 whitespace-pre-wrap break-words rounded-r-lg border-l-2 border-violet-400 dark:border-accent-foreground bg-muted/50 px-3 py-2 text-sm">{item.reply_body ?? 'Apri la segnalazione per leggere la risposta.'}</p><p className="line-clamp-2 break-words text-xs text-muted-foreground">Segnalazione: {item.body}</p></> : <><p className="text-xs text-muted-foreground">{item.actor_name} ha cambiato lo stato</p><div className="flex flex-wrap items-center gap-2 text-xs">{item.previous_status ? <span className={`rounded-full px-2 py-1 ${colors[item.previous_status]}`}>{labels[item.previous_status]}</span> : null}<ArrowRight className="size-3" aria-label="Diventa" /><span className={`rounded-full px-2 py-1 ${colors[item.status]}`}>{labels[item.status]}</span></div><p className="line-clamp-2 break-words text-sm">{item.body}</p></>}
      {showProject ? <p className="break-all text-xs text-muted-foreground">{item.project_name} · {item.environment_name} · {item.page_path}</p> : null}
      <time className="block text-xs text-muted-foreground" dateTime={item.created_at}>{formatReportDateTime(item.created_at)}</time>
    </div>
  </div>;
}

export function NotificationRowsSkeleton({ showProject = false }: { showProject?: boolean }) {
  return <div role="status" aria-label="Caricamento notifiche" className="space-y-3">{[0,1,2].map(item => <div key={item} className="flex items-start gap-3 rounded-lg border p-4"><Skeleton className="size-9 shrink-0 rounded-xl" /><div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-5 w-28 rounded-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-2/3" />{showProject ? <Skeleton className="h-3 w-4/5" /> : null}<Skeleton className="h-3 w-24" /></div></div>)}</div>;
}

export function NotificationCard({ item, showProject = false, disabled, reading, onOpen, onMarkRead }: {
  item: ReportNotification; showProject?: boolean; disabled: boolean; reading: boolean;
  onOpen: () => Promise<void>; onMarkRead: () => Promise<void>;
}) {
  return <div className={`rounded-lg border ${item.read_at ? '' : 'border-primary/30 bg-primary/5'}`}>
    <button type="button" data-notification-open disabled={disabled} onClick={() => void onOpen()} className="block w-full rounded-lg p-4 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"><NotificationContent item={item} showProject={showProject} /></button>
    {!item.read_at ? <div className="flex justify-end px-4 pb-3"><Button variant="ghost" size="sm" disabled={disabled} aria-label="Segna come letta" onClick={event => {
      const button = event.currentTarget;
      const list = button.closest<HTMLElement>('[data-notification-list]');
      void onMarkRead().then(() => requestAnimationFrame(() => {
        if (!button.isConnected && list?.isConnected) (list.querySelector<HTMLButtonElement>('[data-notification-open]:not(:disabled)') ?? list).focus();
      }));
    }}><CheckCheck className="size-4" aria-hidden="true" />{reading ? <><Skeleton className="h-4 w-28" /><span role="status" className="sr-only">Lettura in aggiornamento</span></> : 'Segna come letta'}</Button></div> : null}
  </div>;
}
