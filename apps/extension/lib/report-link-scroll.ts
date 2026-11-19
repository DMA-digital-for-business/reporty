type Point = { x: number; y: number };

/** Wait for the site's initial scroll and layout, while allowing lazy content to load. */
export function scrollToLinkedReport(
  locate: () => Point | null,
  savedScroll: Point | undefined,
  onComplete: () => void,
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
      // The host page can change the scroll position even when the target hasn't moved.
      stable = view.document.readyState === 'complete' && previous &&
        Math.abs(previous.documentY - documentY) < 2 && Math.abs(previous.scrollY - scrollY) < 2
        ? stable + 1 : 0;
      previous = { documentY, scrollY };
      const distance = point.y - view.innerHeight / 2;
      if (Math.abs(distance) >= 2) view.scrollBy({ top: distance, behavior: 'instant' });
    } else {
      previous = undefined;
      stable = 0;
      if (savedScroll && (scrollY !== savedScroll.y || view.scrollX !== savedScroll.x)) {
        view.scrollTo({ top: savedScroll.y, left: savedScroll.x, behavior: 'instant' });
      }
    }
    if (stable >= 3 || ++attempts >= 40) {
      onComplete();
      return;
    }
    timer = view.setTimeout(move, 250);
  }

  timer = view.setTimeout(move, 250);
  return () => view.clearTimeout(timer);
}
