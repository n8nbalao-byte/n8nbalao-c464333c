import { useState, useEffect, useRef } from 'react';
import LorenzoChat from './LorenzoChat';

interface LorenzoChatWidgetProps {
  customerId?: string;
}

// WhatsApp notification sound as base64 (authentic WhatsApp tone)
const WHATSAPP_SOUND = 'https://cdn.freesound.org/previews/574/574793_12517458-lq.mp3';

const LorenzoChatWidget = ({ customerId }: LorenzoChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(true);
  const [isShaking, setIsShaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationCount = useRef(0);
  const sessionStartTime = useRef(Date.now());

  const playNotification = () => {
    if (isOpen) return;
    
    // Play WhatsApp notification sound
    const audio = new Audio(WHATSAPP_SOUND);
    audio.volume = 0.6;
    audio.play().catch(() => {
      // Audio play failed (likely no user interaction yet)
    });
    audioRef.current = audio;

    // Shake animation
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 1000);

    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    notificationCount.current++;
  };

  // First notification after 5 seconds, then check every 5 minutes
  useEffect(() => {
    if (isOpen) return;

    const timeSinceStart = Date.now() - sessionStartTime.current;
    
    // First notification: after 5 seconds if within first 30 seconds
    if (notificationCount.current === 0) {
      const firstTimer = setTimeout(() => {
        if (timeSinceStart < 30000) {
          playNotification();
        }
      }, 5000);
      
      return () => clearTimeout(firstTimer);
    }

    // Subsequent notifications: every 5 minutes
    const interval = setInterval(() => {
      playNotification();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isOpen, notificationCount.current]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewMessage(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  return (
    <>
      {/* Floating Button - WhatsApp Style */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group ${isShaking ? 'animate-shake' : ''}`}
          style={{ backgroundColor: '#25D366' }}
          aria-label="Abrir chat com Lorenzo"
        >
          {/* WhatsApp-style icon */}
          <svg 
            viewBox="0 0 32 32" 
            className="w-9 h-9 text-white fill-current"
          >
            <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.178-1.962C9.806 30.972 12.784 32 16.004 32 24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.32 22.608c-.39 1.1-1.932 2.012-3.178 2.278-.854.18-1.968.324-5.72-1.23-4.802-1.988-7.894-6.87-8.132-7.186-.23-.316-1.93-2.572-1.93-4.904 0-2.332 1.224-3.478 1.66-3.954.39-.43 1.022-.634 1.628-.634.196 0 .374.01.532.018.476.02.716.048 1.03.796.39.93 1.344 3.262 1.462 3.502.12.24.24.554.08.868-.15.324-.28.468-.52.748-.24.28-.47.496-.71.796-.22.26-.468.54-.19 1.01.278.46 1.236 2.038 2.654 3.302 1.824 1.626 3.36 2.132 3.836 2.37.476.24.754.2 1.032-.12.288-.328 1.226-1.43 1.554-1.92.318-.49.648-.41 1.088-.248.448.16 2.78 1.31 3.256 1.55.476.24.794.36.912.554.116.196.116 1.128-.274 2.228z"/>
          </svg>
          
          {/* Pulse animation */}
          <span 
            className="absolute w-full h-full rounded-full animate-ping opacity-30"
            style={{ backgroundColor: '#25D366' }}
          />
          
          {/* Notification badge */}
          {hasNewMessage && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
              1
            </span>
          )}

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
              Fale com o Lorenzo 🎈
              <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900" />
            </div>
          </div>
        </button>
      )}

      {/* Chat Component */}
      <LorenzoChat 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        customerId={customerId}
      />

      {/* Shake animation style */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0); }
          10% { transform: translateX(-5px) rotate(-5deg); }
          20% { transform: translateX(5px) rotate(5deg); }
          30% { transform: translateX(-5px) rotate(-5deg); }
          40% { transform: translateX(5px) rotate(5deg); }
          50% { transform: translateX(-3px) rotate(-3deg); }
          60% { transform: translateX(3px) rotate(3deg); }
          70% { transform: translateX(-2px) rotate(-2deg); }
          80% { transform: translateX(2px) rotate(2deg); }
          90% { transform: translateX(-1px) rotate(-1deg); }
        }
        .animate-shake {
          animation: shake 0.8s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </>
  );
};

export default LorenzoChatWidget;