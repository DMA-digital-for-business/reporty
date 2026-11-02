/** Preserve write order per report while allowing different reports to save independently. */
export function createReportMoveQueue() {
  const pending = new Map<string, Promise<void>>();
  return (id: string, work: () => Promise<void>) => {
    const next = (pending.get(id) ?? Promise.resolve()).then(work, work);
    pending.set(id, next);
    void next.finally(() => {
      if (pending.get(id) === next) pending.delete(id);
    }).catch(() => {});
    return next;
  };
}
