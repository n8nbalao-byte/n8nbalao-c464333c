import { useState } from "react";

interface IPhoneMockupProps {
  screenshots: string[];
  className?: string;
}

export function IPhoneMockup({ 
  screenshots, 
  className = ""
}: IPhoneMockupProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % screenshots.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  if (screenshots.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      {/* iPhone Frame */}
      <div className="relative mx-auto" style={{ width: "320px", height: "660px" }}>
        {/* Phone body */}
        <div 
          className="absolute inset-0 rounded-[50px] bg-gradient-to-b from-gray-800 to-gray-900 shadow-2xl"
          style={{ 
            border: "4px solid #1a1a1a",
            boxShadow: "0 0 0 2px #333, 0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          }}
        >
          {/* Dynamic Island / Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20" />
          
          {/* Screen area */}
          <div 
            className="absolute overflow-hidden bg-black cursor-pointer"
            style={{
              top: "14px",
              left: "14px",
              right: "14px",
              bottom: "14px",
              borderRadius: "38px"
            }}
          >
            {/* Screenshots carousel */}
            <div 
              className="flex h-full transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {screenshots.map((src, index) => (
                <div 
                  key={index} 
                  className="min-w-full h-full flex-shrink-0"
                >
                  <img
                    src={src}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            
            {/* Click zones for navigation */}
            {screenshots.length > 1 && (
              <>
                <div 
                  className="absolute left-0 top-0 w-1/3 h-full z-10 hover:bg-white/5 transition-colors"
                  onClick={handlePrev}
                />
                <div 
                  className="absolute right-0 top-0 w-1/3 h-full z-10 hover:bg-white/5 transition-colors"
                  onClick={handleNext}
                />
              </>
            )}
          </div>
          
          {/* Side buttons */}
          <div className="absolute -left-[6px] top-28 w-[3px] h-8 bg-gray-700 rounded-l" /> {/* Silent */}
          <div className="absolute -left-[6px] top-44 w-[3px] h-14 bg-gray-700 rounded-l" /> {/* Vol up */}
          <div className="absolute -left-[6px] top-60 w-[3px] h-14 bg-gray-700 rounded-l" /> {/* Vol down */}
          <div className="absolute -right-[6px] top-44 w-[3px] h-20 bg-gray-700 rounded-r" /> {/* Power */}
          
          {/* Bottom indicator bar */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
        </div>
      </div>

      {/* Dots indicator */}
      {screenshots.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {screenshots.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? "bg-white w-6" 
                  : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
