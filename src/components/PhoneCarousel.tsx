import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface PhoneCarouselProps {
  carouselKey: string;
  fallbackImage?: string;
  className?: string;
  alt?: string;
}

export function PhoneCarousel({ carouselKey, fallbackImage, className = "", alt = "Phone image" }: PhoneCarouselProps) {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [interval, setIntervalTime] = useState(4000);

  useEffect(() => {
    async function fetchImages() {
      try {
        const data = await api.getCarousel(carouselKey);
        if (data.images && data.images.length > 0) {
          const normalizedImages: string[] = data.images.map((img: any) =>
            typeof img === 'string' ? img : img.url
          );
          setImages(normalizedImages);
        }
        if (data.interval) {
          setIntervalTime(data.interval);
        }
      } catch (error) {
        console.error('Error fetching carousel images:', error);
      }
    }
    fetchImages();
  }, [carouselKey]);

  // Auto-rotate images
  useEffect(() => {
    if (images.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  // Get the current image to display
  const currentImage = images.length > 0 ? images[currentIndex] : fallbackImage;

  if (!currentImage) {
    return null;
  }

  return (
    <img
      src={currentImage}
      alt={`${alt} ${currentIndex + 1}`}
      className={`transition-opacity duration-1000 ease-in-out ${className}`}
    />
  );
}
