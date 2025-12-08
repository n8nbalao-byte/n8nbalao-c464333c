import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface HomeCarouselProps {
  carouselKey: string;
  fallbackImage: string;
  className?: string;
  alt?: string;
}

export function HomeCarousel({ carouselKey, fallbackImage, className = "", alt = "Carousel image" }: HomeCarouselProps) {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImages() {
      try {
        const data = await api.getCarousel(carouselKey);
        if (data.images && data.images.length > 0) {
          setImages(data.images);
        }
      } catch (error) {
        console.error('Error fetching carousel images:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, [carouselKey]);

  // Auto-rotate images
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-card rounded-xl ${className}`} />
    );
  }

  // If no images, show fallback
  if (images.length === 0) {
    return (
      <img
        src={fallbackImage}
        alt={alt}
        className={className}
      />
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div 
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`${alt} ${index + 1}`}
            className={`flex-shrink-0 w-full ${className}`}
          />
        ))}
      </div>
      
      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? "bg-primary w-6" 
                  : "bg-primary/40 hover:bg-primary/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
