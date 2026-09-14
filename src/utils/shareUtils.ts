/**
 * Reusable Share Utility for Mod Station Apps and AppCards
 * Handles Web Share API with Clipboard API fallback and AbortError handling.
 */

export interface ShareResult {
  success: boolean;
  method?: 'native' | 'clipboard';
  reason?: 'cancelled' | 'unsupported' | 'error';
}

export async function shareApp(app: { name: string; slug?: string; id: string; description?: string }): Promise<ShareResult> {
  const appSlug = app.slug || app.id;
  const appUrl = `${window.location.origin}${window.location.pathname}#/app/${appSlug}`;

  // 1. Try Web Share API
  if (navigator.share) {
    try {
      await navigator.share({
        title: app.name,
        text: `Unduh ${app.name} terverifikasi aman di Mod Station.`,
        url: appUrl,
      });
      return { success: true, method: 'native' };
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // User cancelled share sheet - treat as non-error
        return { success: false, reason: 'cancelled' };
      }
      // If native share fails unexpectedly, fallback to clipboard
    }
  }

  // 2. Fallback to Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(appUrl);
      return { success: true, method: 'clipboard' };
    } catch (err) {
      return { success: false, reason: 'error' };
    }
  }

  return { success: false, reason: 'unsupported' };
}
