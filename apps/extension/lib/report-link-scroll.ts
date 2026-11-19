type Point = { x: number; y: number };

const scrollKeys = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

export function onManualReportScroll(cancel: () => void, view: Window = window) {
  const onKey = (event: KeyboardEvent) => {
    if (scrollKeys.has(event.key)) cancel();
  };
  view.addEventListener('wheel', cancel, { capture: true, passive: true });
  view.addEventListener('touchmove', cancel, { capture: true, passive: true });
  view.addEventListener('keydown', onKey, true);
  return () => {
    view.removeEventListener('wheel', cancel, true);
    view.removeEventListener('touchmove', cancel, true);
    view.removeEventListener('keydown', onKey, true);
  };
}

/** Wait for the site's initial scroll and layout, then move the viewport once. */
export function scrollToLinkedReport(
  locate: () => Point | null,
  savedScroll: Point | undefined,
  onReady: () => boolean,
  view: Window = window,
) {
  let previous: { documentY: number; scrollY: number } | undefined;
  let stable = 0;
  let attempts = 0;
  let timer: number;

  function move() {
    const point = locate();
    const scrollY = view.scrollY;
    if (point) {
      const documentY = point.y + scrollY;
      stable = view.document.readyState === 'complete' && previous &&
        Math.abs(previous.documentY - documentY) < 2 && Math.abs(previous.scrollY - scrollY) < 2
        ? stable + 1 : 0;
      previous = { documentY, scrollY };
    } else {
      previous = undefined;
      stable = 0;
    }
    if (stable >= 3 || ++attempts >= 40) {
      if (!onReady()) return;
      if (point) {
        const distance = point.y - view.innerHeight / 2;
        if (Math.abs(distance) >= 2) view.scrollBy({ top: distance, behavior: 'instant' });
      } else if (savedScroll) {
        view.scrollTo({ top: savedScroll.y, left: savedScroll.x, behavior: 'instant' });
      }
      return;
    }
    timer = view.setTimeout(move, 250);
  }

  timer = view.setTimeout(move, 250);
  return () => view.clearTimeout(timer);
}
