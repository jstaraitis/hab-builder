/**
 * ModalPortal
 *
 * Renders overlay content into document.body instead of leaving it where it
 * sits in the tree.
 *
 * This exists because of a subtle CSS rule rather than a preference. The app's
 * <main> element carries `transform: scale(zoom/100)` for the zoom control,
 * and *any* transform other than `none` makes an element the containing block
 * for `position: fixed` descendants. `scale(1)` counts — so even at the default
 * 100% zoom, a modal using `fixed inset-0` was being positioned against the
 * full height of <main> rather than the viewport. On a long page, centring
 * inside that put the modal most of a screen below the fold.
 *
 * Portalling to body puts the modal back outside the transformed subtree,
 * where `fixed` means what it is supposed to mean, at any zoom level.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalPortalProps {
  readonly children: ReactNode;
  /** Skips the portal entirely when false, so callers can gate on isOpen. */
  readonly active?: boolean;
}

export function ModalPortal({ children, active = true }: ModalPortalProps) {
  // Rendered only after mount: document.body does not exist during SSR or the
  // first render pass, and touching it there would throw.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // While a modal is up, the page behind it should not scroll. Restoring the
  // previous value rather than clearing it keeps nested or stacked modals from
  // unlocking the page when only the inner one closes.
  useEffect(() => {
    if (!active || !mounted) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active, mounted]);

  if (!mounted || !active) return null;

  return createPortal(children, document.body);
}
