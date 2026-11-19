import assert from 'node:assert/strict';
import test from 'node:test';
import { scrollToLinkedReport } from '../apps/extension/lib/report-link-scroll.ts';

function page(readyState = 'complete') {
  let timer;
  return {
    document: { readyState },
    innerHeight: 800,
    scrollX: 0,
    scrollY: 0,
    setTimeout(callback) { timer = callback; return 1; },
    clearTimeout() { timer = undefined; },
    scrollTo({ top, left }) { this.scrollY = top; this.scrollX = left; },
    scrollBy({ top }) { this.scrollY += top; },
    tick(times = 1) {
      for (let i = 0; i < times && timer; i++) {
        const callback = timer;
        timer = undefined;
        callback();
      }
    },
  };
}

test('re-centers the pin after the host performs a delayed fragment scroll', () => {
  const view = page('interactive');
  let completed = false;
  scrollToLinkedReport(() => ({ x: 10, y: 2000 - view.scrollY }), undefined, () => { completed = true; }, view);
  view.tick(5);
  assert.equal(view.scrollY, 1600);
  assert.equal(completed, false);

  view.scrollY = 600;
  view.document.readyState = 'complete';
  view.tick(6);
  assert.equal(view.scrollY, 1600);
  assert.equal(completed, true);
});

test('uses the saved scroll to reach lazy content, then centers the recovered target', () => {
  const view = page();
  let completed = false;
  scrollToLinkedReport(() => view.scrollY >= 1000 ? { x: 10, y: 1800 - view.scrollY } : null,
    { x: 0, y: 1000 }, () => { completed = true; }, view);
  view.tick();
  assert.equal(view.scrollY, 1000);
  view.tick(6);
  assert.equal(view.scrollY, 1400);
  assert.equal(completed, true);
});

test('falls back to the captured scroll when the original element is gone', () => {
  const view = page();
  let completed = false;
  scrollToLinkedReport(() => null, { x: 0, y: 1000 }, () => { completed = true; }, view);
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
