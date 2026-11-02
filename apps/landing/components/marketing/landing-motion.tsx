'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/** Decorative motion only: server-rendered content stays visible without JavaScript. */
export function LandingMotion({ children, className }: { children: ReactNode; className: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const pending = new Set(container.querySelectorAll<HTMLElement>('[data-reveal]'));
    const animations = new Map<HTMLElement, Animation>();
    let observer: IntersectionObserver | undefined;
    let activeCard: HTMLElement | null = null;
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    function resetCard() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (!activeCard) return;
      activeCard.removeAttribute('data-pointer-active');
      activeCard.style.removeProperty('--tilt-x');
      activeCard.style.removeProperty('--tilt-y');
      activeCard.style.removeProperty('--spot-x');
      activeCard.style.removeProperty('--spot-y');
      activeCard = null;
    }
    function updateCard() {
      frame = 0;
      if (!activeCard || reduced.matches || !finePointer.matches) return;
      const rect = activeCard.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = Math.min(1, Math.max(0, (pointerX - rect.left) / rect.width));
      const y = Math.min(1, Math.max(0, (pointerY - rect.top) / rect.height));
      activeCard.style.setProperty('--spot-x', `${x * 100}%`);
      activeCard.style.setProperty('--spot-y', `${y * 100}%`);
      activeCard.style.setProperty('--tilt-x', `${(0.5 - y) * 3}deg`);
      activeCard.style.setProperty('--tilt-y', `${(x - 0.5) * 3}deg`);
      activeCard.dataset.pointerActive = 'true';
    }
    function onPointerMove(event: PointerEvent) {
      if (document.documentElement.hasAttribute('data-reporty-demo-selecting')) { resetCard(); return; }
      if (event.pointerType !== 'mouse' || reduced.matches || !finePointer.matches) return;
      const card = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-spotlight]') : null;
      if (card !== activeCard) { resetCard(); activeCard = card; }
      if (!card) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(updateCard);
    }
    function cancelReveals() {
      animations.forEach(animation => animation.cancel());
      animations.clear();
    }
    function configureMotion() {
      observer?.disconnect();
      cancelReveals();
      resetCard();
      if (reduced.matches || !('IntersectionObserver' in window)) return;
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          observer?.unobserve(element);
          pending.delete(element);
          // A link reached by keyboard should be available immediately.
          if (element.contains(document.activeElement) || typeof element.animate !== 'function') continue;
          const delay = Math.min(240, Math.max(0, Number(element.dataset.revealDelay) || 0));
          const animation = element.animate([
            { opacity: 0, translate: '0 22px' },
            { opacity: 1, translate: '0 0' },
          ], { duration: 620, delay, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' });
          animations.set(element, animation);
          animation.onfinish = () => { animations.delete(element); window.dispatchEvent(new Event('reporty:layout-settled')); };
        }
      }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
      pending.forEach(element => observer?.observe(element));
    }
    function onFocus(event: FocusEvent) {
      if (!(event.target instanceof Node)) return;
      for (const [element, animation] of animations) {
        if (element.contains(event.target)) { animation.cancel(); animations.delete(element); }
      }
      resetCard();
    }
    configureMotion();
    reduced.addEventListener('change', configureMotion);
    finePointer.addEventListener('change', resetCard);
    container.addEventListener('pointermove', onPointerMove, { passive: true });
    container.addEventListener('pointerleave', resetCard);
    container.addEventListener('focusin', onFocus);
    window.addEventListener('blur', resetCard);
    // Scrolling invalidates the pointer position relative to a card.
    window.addEventListener('scroll', resetCard, { passive: true });
    return () => {
      observer?.disconnect(); cancelReveals(); resetCard();
      reduced.removeEventListener('change', configureMotion);
      finePointer.removeEventListener('change', resetCard);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', resetCard);
      container.removeEventListener('focusin', onFocus);
      window.removeEventListener('blur', resetCard);
      window.removeEventListener('scroll', resetCard);
    };
  }, []);

  return <div ref={root} className={className} data-reporty-demo-page>{children}</div>;
}
