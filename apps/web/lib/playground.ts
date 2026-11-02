import { getPageContext } from '@reporty/shared';

export type PlaygroundEnvironment = { id: string; name: string; origin: string; publicKey: string; enabled: boolean };
export type Viewport = { width: number; height: number };

export function playgroundFrameLayout(viewport: Viewport, available: Viewport, fluid: boolean) {
  const width = Math.max(0, Math.floor(available.width));
  const height = Math.max(0, Math.floor(available.height));
  const size = fluid ? { width, height } : viewport;
  const scale = width && height ? fluid ? 1 : Math.min(1, width / size.width, height / size.height) : 0;
  return { ...size, scale };
}
export const viewportPresets = [
  { label: 'Desktop', width: 1440, height: 900 },
  { label: 'Tablet', width: 768, height: 1024 },
  { label: 'Mobile', width: 390, height: 844 },
] as const;

export function playgroundUrl(input: string, origin: string) {
  const url = new URL(input, `${origin}/`);
  if (url.username || url.password || getPageContext(url.href).origin !== origin) throw new Error('Inserisci un URL dell’ambiente selezionato, con lo stesso protocollo e porta.');
  return url.href;
}

/** page_path is the current identity; context.url may predate a page move. */
export function playgroundReportUrl(report: { url: string; pagePath: string }, origin: string) {
  const url = new URL(playgroundUrl(report.url, origin));
  if (getPageContext(url.href).pagePath === report.pagePath) return url.href;
  const current = new URL(playgroundUrl(report.pagePath, origin));
  if (getPageContext(current.href).pagePath !== report.pagePath) throw new Error('Percorso della segnalazione non valido.');
  url.pathname = current.pathname;
  const previousRoute = url.hash.startsWith('#/') || url.hash.startsWith('#!/');
  const routeQuery = previousRoute && url.hash.includes('?') ? url.hash.slice(url.hash.indexOf('?')) : '';
  if (current.hash) url.hash = current.hash + routeQuery;
  else if (previousRoute) url.hash = '';
  return url.href;
}

export function isViewportDimension(value: number) {
  return Number.isInteger(value) && value >= 240 && value <= 3840;
}

export function isPlaygroundMessage(event: MessageEvent, frame: HTMLIFrameElement, origin: string, nonce: string) {
  return event.source === frame.contentWindow && event.origin === origin && event.data !== null && typeof event.data === 'object' && event.data.nonce === nonce;
}
