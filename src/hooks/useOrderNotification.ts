import { useState, useEffect, useCallback, useRef } from 'react';

interface Order {
  id: string | number;
  createdAt?: string;
}

export const useOrderNotification = (orders: Order[], isEnabled: boolean = true) => {
  const [lastOrderCount, setLastOrderCount] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitialized = useRef(false);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRY9n9zVpHQaOJze1aJyHTmb4NShch46muHTonIfOZni06NwHzic4tSibh84nOLUoW4gOJzi1KJuIDmc4tSibh84nOLUom4fOJzh1KNuHzic4dSjbh84nOHUo28fOJ3h1KNuHjed4dSkbh43neDVpG0eN53g1aRtHjed4NWkbR43nN/VpW0dN5zf1aVsHTac39WlbB02nN/VpWwdNpze1aZsHTac3tWmbB02m97Vpmwc');
    return () => {
      audioRef.current = null;
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    // Use Web Speech API for voice notification
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('Você recebeu um novo pedido!');
      utterance.lang = 'pt-BR';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to find a Portuguese voice
      const voices = speechSynthesis.getVoices();
      const ptVoice = voices.find(voice => voice.lang.startsWith('pt'));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }
      
      speechSynthesis.speak(utterance);
    } else if (audioRef.current) {
      // Fallback to beep sound
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.log('Could not play notification sound:', err);
      });
    }
  }, []);

  useEffect(() => {
    if (!isEnabled || !orders || orders.length === 0) return;

    const currentCount = orders.length;

    // On first load, just set the count without playing sound
    if (!hasInitialized.current) {
      setLastOrderCount(currentCount);
      hasInitialized.current = true;
      return;
    }

    // If we have more orders than before, play notification
    if (lastOrderCount !== null && currentCount > lastOrderCount) {
      console.log('New order detected! Playing notification sound.');
      playNotificationSound();
      
      // Also show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Novo Pedido!', {
          body: `Você recebeu ${currentCount - lastOrderCount} novo(s) pedido(s)`,
          icon: '/favicon.ico'
        });
      }
    }

    setLastOrderCount(currentCount);
  }, [orders, isEnabled, lastOrderCount, playNotificationSound]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  return {
    playNotificationSound,
    requestNotificationPermission
  };
};
