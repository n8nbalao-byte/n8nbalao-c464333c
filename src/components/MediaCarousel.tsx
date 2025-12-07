import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaItem } from "@/lib/api";

interface MediaCarouselProps {
  media: MediaItem[];
  className?: string;
}

export function MediaCarousel({ media, className = "" }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const goTo = (index: number) => {
    setCurrentIndex(index);
  };

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  useEffect(() => {
    // Pause all videos except current
    videoRefs.current.forEach((video, i) => {
      if (video) {
        if (i === currentIndex) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex]);

  if (!media || media.length === 0) {
    return (
      <div className={`flex items-center justify-center rounded-2xl bg-secondary ${className}`}>
        <img src="/placeholder.svg" alt="Placeholder" className="h-64 w-64 opacity-50" />
      </div>
    );
  }

  const currentMedia = media[currentIndex];

  // Check if it's a YouTube URL and convert to embed format
  const isYouTubeUrl = (url: string) => 
    url.includes('youtube.com') || url.includes('youtu.be');
  
  const getYouTubeEmbedUrl = (url: string): string => {
    // Already embed format
    if (url.includes('youtube.com/embed/')) {
      return url + '?autoplay=1&mute=1';
    }
    
    // Regular youtube.com/watch?v= format
    const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (watchMatch) {
      return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&mute=1`;
    }
    
    // Short youtu.be format
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&mute=1`;
    }
    
    return url;
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-secondary ${className}`}>
      {/* Media Display */}
      <div className="relative aspect-square">
        {currentMedia.type === 'video' ? (
          isYouTubeUrl(currentMedia.url) ? (
            <iframe
              src={getYouTubeEmbedUrl(currentMedia.url)}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube video"
            />
          ) : (
            <video
              ref={(el) => (videoRefs.current[currentIndex] = el)}
              src={currentMedia.url}
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          )
        ) : (
          <img
            src={currentMedia.url}
            alt={`Imagem ${currentIndex + 1}`}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        )}
      </div>

      {/* Navigation Arrows */}
      {media.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {media.map((item, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-16 w-16 overflow-hidden rounded-lg border-2 transition-all ${
                i === currentIndex ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {item.type === 'video' ? (
                <div className={`flex h-full w-full items-center justify-center ${item.url.includes('youtube') ? 'bg-red-600' : 'bg-secondary'}`}>
                  <span className="text-xs text-white">▶</span>
                </div>
              ) : (
                <img src={item.url} alt={`Thumb ${i + 1}`} className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}