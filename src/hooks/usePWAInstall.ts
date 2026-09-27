import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

declare global {
  interface Window {
    deferredPrompt: BeforeInstallPromptEvent | null;
  }
}

export function usePWAInstall() {
  const [installPromptEvent, setInstallPromptEvent] = useState(
    () => (typeof window === 'undefined' ? null : window.deferredPrompt)
  );

  useEffect(() => {
    const syncPrompt = () => setInstallPromptEvent(window.deferredPrompt);
    const installedHandler = () => {
      window.deferredPrompt = null;
      syncPrompt();
    };

    window.addEventListener('pwa-installable', syncPrompt);
    window.addEventListener('appinstalled', installedHandler);
    syncPrompt();

    return () => {
      window.removeEventListener('pwa-installable', syncPrompt);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const promptInstall = (): Promise<'accepted' | 'dismissed' | null> | null => {
    const prompt = window.deferredPrompt;
    if (!prompt) return null;

    return (async () => {
      try {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        return outcome;
      } catch (error) {
        console.error('[PWA] Install prompt failed', error);
        return null;
      } finally {
        if (window.deferredPrompt === prompt) {
          window.deferredPrompt = null;
        }
        setInstallPromptEvent(window.deferredPrompt);
      }
    })();
  };

  return {
    canInstall: !!installPromptEvent,
    promptInstall,
  };
}
