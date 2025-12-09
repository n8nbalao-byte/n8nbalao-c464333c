import { useState, useEffect, useCallback, useRef } from 'react';

interface Order {
  id: string | number;
  customerName?: string;
  totalPrice?: number;
  createdAt?: string;
}

interface ElevenLabsSettings {
  enabled: boolean;
  apiKey: string;
  voiceId: string;
}

export const useOrderNotification = (orders: Order[], isEnabled: boolean = true) => {
  const [lastOrderCount, setLastOrderCount] = useState<number | null>(null);
  const [elevenlabsSettings, setElevenlabsSettings] = useState<ElevenLabsSettings>({
    enabled: false,
    apiKey: '',
    voiceId: ''
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInitialized = useRef(false);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRY9n9zVpHQaOJze1aJyHTmb4NShch46muHTonIfOZni06NwHzic4tSibh84nOLUoW4gOJzi1KJuIDmc4tSibh84nOLUom4fOJzh1KNuHzic4dSjbh84nOHUo28fOJ3h1KNuHjed4dSkbh43neDVpG0eN53g1aRtHjed4NWkbR43nN/VpW0dN5zf1aVsHTac39WlbB02nN/VpWwdNpze1aZsHTac3tWmbB02m97Vpmwc');
    
    // Load ElevenLabs settings
    loadElevenlabsSettings();
    
    return () => {
      audioRef.current = null;
    };
  }, []);

  const loadElevenlabsSettings = async () => {
    try {
      const response = await fetch('https://www.n8nbalao.com/api/settings.php');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        const settings: ElevenLabsSettings = {
          enabled: false,
          apiKey: '',
          voiceId: 'B93iDjT4HFRCZ3Ju8oaV'
        };
        
        data.data.forEach((setting: { key: string; value: string }) => {
          if (setting.key === 'elevenlabs_api_key') settings.apiKey = setting.value || '';
          if (setting.key === 'elevenlabs_voice_id') settings.voiceId = setting.value || 'B93iDjT4HFRCZ3Ju8oaV';
          if (setting.key === 'elevenlabs_enabled') settings.enabled = setting.value === 'true';
        });
        
        setElevenlabsSettings(settings);
      }
    } catch (error) {
      console.error('Error loading ElevenLabs settings:', error);
    }
  };

  const speakWithElevenLabs = useCallback(async (text: string) => {
    if (!elevenlabsSettings.enabled || !elevenlabsSettings.apiKey) {
      return false;
    }

    try {
      const response = await fetch('https://www.n8nbalao.com/api/text-to-speech.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      const data = await response.json();
      
      if (data.success && data.audio) {
        const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
        await audio.play();
        return true;
      }
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
    }
    return false;
  }, [elevenlabsSettings]);

  const playNotificationSound = useCallback(async (order?: Order) => {
    // Build notification message
    let message = 'Você recebeu um novo pedido!';
    
    if (order) {
      const customerName = order.customerName || 'Cliente';
      const totalPrice = order.totalPrice ? 
        `R$ ${order.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
      
      if (totalPrice) {
        message = `Novo pedido de ${customerName}, valor total ${totalPrice}`;
      } else {
        message = `Novo pedido de ${customerName}`;
      }
    }

    // Try ElevenLabs first if enabled
    if (elevenlabsSettings.enabled && elevenlabsSettings.apiKey) {
      const success = await speakWithElevenLabs(message);
      if (success) return;
    }

    // Fallback to Web Speech API
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message);
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
  }, [elevenlabsSettings, speakWithElevenLabs]);

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
      
      // Get the newest order (assuming orders are sorted by date desc)
      const newestOrder = orders[0];
      playNotificationSound(newestOrder);
      
      // Also show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        const customerName = newestOrder?.customerName || 'Cliente';
        const totalPrice = newestOrder?.totalPrice ? 
          ` - R$ ${newestOrder.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '';
        
        new Notification('Novo Pedido!', {
          body: `Pedido de ${customerName}${totalPrice}`,
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
    requestNotificationPermission,
    reloadSettings: loadElevenlabsSettings
  };
};
