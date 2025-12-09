import { useState } from 'react';
import LorenzoChat from './LorenzoChat';
import whatsappIcon from '@/assets/whatsapp-icon.png';

interface LorenzoChatWidgetProps {
  customerId?: string;
}

const LorenzoChatWidget = ({ customerId }: LorenzoChatWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(true);

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewMessage(false);
  };

  return (
    <>
      {/* Floating Button - WhatsApp Style */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group overflow-hidden"
          style={{ backgroundColor: '#25D366' }}
          aria-label="Abrir chat com Lorenzo"
        >
          <img 
            src={whatsappIcon} 
            alt="WhatsApp" 
            className="w-10 h-10 object-contain"
          />
          
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
    </>
  );
};

export default LorenzoChatWidget;