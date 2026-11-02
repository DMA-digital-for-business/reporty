import { useEffect, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ReviewOverlay } from '@/components/review-overlay';
import { ToastProvider, useNotify } from '@/components/ui/toast';
import { initializeTheme } from '@/lib/theme';
import { shadowStyles } from '@/lib/shadow-styles';
import { isOpenerPosition } from '@/lib/opener-position';
import type { Site } from '@/lib/session';
import { createDemoStore } from '../../landing/lib/demo-store';
import { createLocalReviewTransport, DEMO_ENVIRONMENT_ID, DEMO_PROJECT_ID } from '../../landing/lib/demo-transport';
import css from '@/entrypoints/popup/style.css?inline';

const hostId = 'reporty-landing-demo';
const prefsKey = 'reporty:landing-demo:preferences:v1';
const store = createDemoStore();
const transport = createLocalReviewTransport(store, location.origin);
let root: Root | null = null;
let host: HTMLElement | null = null;
let disposeTheme: (() => void) | undefined;
let mounting = false;
let generation = 0;
const environment = { id: DEMO_ENVIRONMENT_ID, projectId: DEMO_PROJECT_ID, projectName: 'Reporty', name: 'Demo locale', origin: location.origin };
function selectionChanged(active: boolean) {
  if (active) document.documentElement.dataset.reportyDemoSelecting = 'true';
  else delete document.documentElement.dataset.reportyDemoSelecting;
}
function savedPreferences(): { hidden: boolean; position: Site['position'] } {
  try { const value = JSON.parse(localStorage.getItem(prefsKey) ?? '{}'); return { hidden: value?.hidden === true, position: isOpenerPosition(value?.position) ? value.position : 'bottom_right' }; }
  catch { return { hidden: false, position: 'bottom_right' }; }
}

function LocalReview({ host }: { host: HTMLElement }) {
  const [preferences, setPreferences] = useState(savedPreferences);
  const [revision, setRevision] = useState(0);
  const [resetRevision, setResetRevision] = useState(0);
  const [creationRequest, setCreationRequest] = useState<string>();
  const notify = useNotify();
  useEffect(() => store.subscribe(() => setRevision(value => value + 1)), []);
  useEffect(() => {
    const begin = () => {
      if (store.getSnapshot().error) { notify(store.getSnapshot().error!); return; }
      setPreferences(value => ({ ...value, hidden: false }));
      setCreationRequest(crypto.randomUUID());
    };
    const reset = () => {
      try { store.save({ version: 1, name: '', reports: [] }); setResetRevision(value => value + 1); notify('Dati della demo eliminati da questo browser.', 'success'); }
      catch (error) { notify(error instanceof Error ? error.message : 'Impossibile azzerare la demo.'); }
    };
    window.addEventListener('reporty-demo:create', begin);
    window.addEventListener('reporty-demo:reset', reset);
    window.dispatchEvent(new Event('reporty-demo:ready'));
    if (store.getSnapshot().error) notify(store.getSnapshot().error!);
    return () => { window.removeEventListener('reporty-demo:create', begin); window.removeEventListener('reporty-demo:reset', reset); };
  }, [notify]);
  async function savePreferences(next: typeof preferences) {
    try { localStorage.setItem(prefsKey, JSON.stringify(next)); }
    catch { throw new Error('Impossibile salvare le preferenze della demo in questo browser.'); }
    setPreferences(next);
  }
  return <ReviewOverlay key={resetRevision} host={host} site={{ environmentId: environment.id, ...preferences }} environment={environment} transport={transport} mediaEnabled={false} openCreatedReport creationRequest={creationRequest} onSelectionChange={selectionChanged} reportsRevision={revision} onHiddenChange={hidden => savePreferences({ ...preferences, hidden })} onPositionChange={position => savePreferences({ ...preferences, position })} />;
}

async function mount() {
  if (host || mounting || document.getElementById(hostId)) return;
  mounting = true;
  const instance = ++generation;
  const nextHost = document.createElement('div');
  nextHost.id = hostId;
  nextHost.dataset.reportyDemoUi = 'true';
  nextHost.style.cssText = 'all:initial!important;display:block!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;font:14px/1.5 system-ui,sans-serif!important';
  document.documentElement.append(nextHost);
  host = nextHost;
  const shadow = nextHost.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  const mountPoint = document.createElement('div');
  style.textContent = shadowStyles(css);
  shadow.append(style, mountPoint);
  store.load();
  try {
    const cleanup = await initializeTheme(nextHost, 'widget');
    if (instance !== generation) { cleanup(); return; }
    disposeTheme = cleanup;
    root = createRoot(mountPoint);
    root.render(<ToastProvider><LocalReview host={nextHost} /></ToastProvider>);
  } catch {
    unmount(); window.dispatchEvent(new Event('reporty-demo:error'));
  } finally { if (instance === generation) mounting = false; }
}
function unmount() {
  generation++; mounting = false;
  root?.unmount(); root = null;
  disposeTheme?.(); disposeTheme = undefined;
  host?.remove(); host = null;
  selectionChanged(false);
}
window.addEventListener('reporty-demo:mount', () => void mount());
window.addEventListener('reporty-demo:dispose', unmount);
window.addEventListener('pagehide', event => { if (!event.persisted) unmount(); });
void mount();
