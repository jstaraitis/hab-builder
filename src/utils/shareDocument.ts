import { Capacitor } from '@capacitor/core';

/**
 * Gets a printable document out of the app, by whatever route the current
 * platform actually supports.
 *
 * `window.print()` is not implemented in WKWebView, which is what Capacitor
 * uses on iOS. It does not throw — it silently does nothing, so the Print
 * button on an iPhone looked broken while reporting no error at all. Android's
 * WebView is inconsistent for the same reason.
 *
 * Rather than call print and hope, this picks a route that works and tells the
 * caller which one it took, so the UI can say what happened. A button that
 * quietly does nothing is worse than one that says "copied to your clipboard".
 *
 * Order of preference on native:
 *   1. Web Share API — opens the iOS share sheet, which offers Mail, Messages,
 *      Notes and Print. Present in some WKWebView builds, absent in others,
 *      hence the guard rather than an assumption.
 *   2. Clipboard — always available, and the text version of these documents is
 *      written to be pasted into an email.
 */

export type ShareOutcome = 'printed' | 'shared' | 'copied' | 'failed';

export interface ShareDocumentInput {
  /** Used as the share sheet title. */
  title: string;
  /** Plain-text rendering, used for share and clipboard routes. */
  text: string;
}

/** True when the browser can actually produce a print dialog. */
export function canPrint(): boolean {
  if (Capacitor.isNativePlatform()) return false;
  return typeof window !== 'undefined' && typeof window.print === 'function';
}

/** True when a native share sheet is reachable. */
export function canShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * What the primary button should say, so it never promises a capability the
 * platform does not have.
 */
export function shareActionLabel(): string {
  if (canPrint()) return 'Print / Save PDF';
  if (canShare()) return 'Share';
  return 'Copy as text';
}

export async function shareDocument(input: ShareDocumentInput): Promise<ShareOutcome> {
  if (canPrint()) {
    window.print();
    return 'printed';
  }

  if (canShare()) {
    try {
      await navigator.share({ title: input.title, text: input.text });
      return 'shared';
    } catch (error) {
      // A user dismissing the share sheet throws AbortError. That is a choice,
      // not a failure, and must not fall through to silently copying instead.
      if (error instanceof Error && error.name === 'AbortError') return 'shared';
      console.error('Share failed, falling back to clipboard:', error);
    }
  }

  try {
    await navigator.clipboard.writeText(input.text);
    return 'copied';
  } catch (error) {
    console.error('Clipboard write failed:', error);
    return 'failed';
  }
}

/** Message to show after an action, so the outcome is never ambiguous. */
export function shareOutcomeMessage(outcome: ShareOutcome): string | null {
  switch (outcome) {
    case 'printed':
      return null; // The print dialog is its own feedback.
    case 'shared':
      return null; // The share sheet is its own feedback.
    case 'copied':
      return 'Printing is not available in the app — the full report was copied to your clipboard instead. Paste it into an email or notes app.';
    case 'failed':
      return 'Could not print, share or copy on this device. Open the report in a browser to print it.';
  }
}
