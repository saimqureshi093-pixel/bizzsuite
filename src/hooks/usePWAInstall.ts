import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const promptSubscribers = new Set<() => void>();

const notifyPromptSubscribers = () => {
  promptSubscribers.forEach((subscriber) => subscriber());
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event: Event) => {
    event.preventDefault();
    console.log('[PWA] beforeinstallprompt fired');
    deferredPrompt = event as BeforeInstallPromptEvent;
    notifyPromptSubscribers();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notifyPromptSubscribers();
  });
}

export function usePWAInstall() {
  const [installPromptEvent, setInstallPromptEvent] = useState(deferredPrompt);

  useEffect(() => {
    const syncPrompt = () => setInstallPromptEvent(deferredPrompt);
    promptSubscribers.add(syncPrompt);
    syncPrompt();

    return () => {
      promptSubscribers.delete(syncPrompt);
    };
  }, []);

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | null> => {
    const prompt = deferredPrompt;
    if (!prompt) return null;

    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      return outcome;
    } catch (error) {
      console.error('[PWA] Install prompt failed', error);
      return null;
    } finally {
      if (deferredPrompt === prompt) {
        deferredPrompt = null;
      }
      notifyPromptSubscribers();
    }
  };

  return {
    canInstall: !!installPromptEvent,
    promptInstall,
  };
}
