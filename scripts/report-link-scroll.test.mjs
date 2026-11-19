import assert from 'node:assert/strict';
import test from 'node:test';
import { onManualReportScroll, scrollToLinkedReport } from '../apps/extension/lib/report-link-scroll.ts';

function page(readyState = 'complete') {
  let timer;
  return Object.assign(new EventTarget(), {
    moves: 0,
    document: { readyState },
    innerHeight: 800,
    scrollX: 0,
    scrollY: 0,
    setTimeout(callback) { timer = callback; return 1; },
    clearTimeout() { timer = undefined; },
    scrollTo({ top, left }) { this.moves++; this.scrollY = top; this.scrollX = left; },
    scrollBy({ top }) { this.moves++; this.scrollY += top; },
    tick(times = 1) {
      for (let i = 0; i < times && timer; i++) {
        const callback = timer;
        timer = undefined;
        callback();
      }
    },
  });
}

test('centers the pin once after the host performs a delayed fragment scroll', () => {
  const view = page('interactive');
  let completed = false;
  scrollToLinkedReport(() => ({ x: 10, y: 2000 - view.scrollY }), undefined, () => { completed = true; return true; }, view);
  view.tick(5);
  assert.equal(view.moves, 0);
  assert.equal(completed, false);

  view.scrollY = 600;
  view.document.readyState = 'complete';
  view.tick(6);
  assert.equal(view.scrollY, 1600);
  assert.equal(completed, true);
  view.scrollY = 1800;
  view.tick(40);
  assert.equal(view.scrollY, 1800);
  assert.equal(view.moves, 1);
});

test('waits for a late target before using the fallback position', () => {
  const view = page();
  let anchorLoaded = false;
  scrollToLinkedReport(() => anchorLoaded ? { x: 10, y: 1800 - view.scrollY } : null,
    { x: 0, y: 1000 }, () => true, view);
  view.tick(4);
  assert.equal(view.moves, 0);
  anchorLoaded = true;
  view.tick(6);
  assert.equal(view.scrollY, 1400);
  assert.equal(view.moves, 1);
});

test('falls back to the captured scroll when the original element is gone', () => {
  const view = page();
  let completed = false;
  scrollToLinkedReport(() => null, { x: 0, y: 1000 }, () => { completed = true; return true; }, view);
  view.tick(40);
  assert.equal(view.scrollY, 1000);
  assert.equal(completed, true);
});

test('cancels the pending scroll when the link is no longer active', () => {
  const view = page();
  const cancel = scrollToLinkedReport(() => ({ x: 10, y: 1200 }), undefined, () => assert.fail('unexpected completion'), view);
  cancel();
  view.tick();
  assert.equal(view.scrollY, 0);
});

test('manual scrolling cancels the deep link before it moves the viewport', () => {
  for (const event of [
    new Event('wheel'),
    new Event('touchmove'),
    Object.assign(new Event('keydown'), { key: 'PageDown' }),
  ]) {
    const view = page();
    const cancel = scrollToLinkedReport(() => null, { x: 0, y: 1000 }, () => assert.fail('unexpected scroll'), view);
    const stopListening = onManualReportScroll(cancel, view);
    view.tick(10);
    view.dispatchEvent(event);
    view.tick(40);
    stopListening();
    assert.equal(view.moves, 0);
  }
});

test('a target from a previous navigation cannot move the current page', () => {
  const view = page();
  scrollToLinkedReport(() => ({ x: 10, y: 1200 }), undefined, () => false, view);
  view.tick(40);
  assert.equal(view.moves, 0);
});
